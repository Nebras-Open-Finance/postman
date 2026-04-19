const newman = require('newman');
const crypto = require('node:crypto');
const { signingKeyPem, transportCertPath, transportKeyPath, creds } = require('./config');
const { discover } = require('./discovery');
const {
  loadCollection, findFolder, enumerateFlows, buildSubsetCollection,
  requestUrl, requestMethod,
} = require('./collection');

// Seed environment values required by the collection's pre-request scripts.
// Discovery provides issuer / token / par endpoints; the rest come from config.
async function buildEnv(target) {
  const cfg = creds[target];
  if (!cfg) throw new Error(`Unknown target "${target}" in supporting/certs/config.js`);
  const disco = await discover(cfg.discoveryUri);

  // Postman substitutes variables verbatim into raw bodies; PEMs must be
  // pre-escaped so newlines survive as `\n` JSON escape sequences.
  const pemEscaped = signingKeyPem.replace(/\r?\n/g, '\\n');

  const values = [
    { key: '_clientId', value: cfg.clientId, enabled: true },
    { key: 'clientId', value: cfg.clientId, enabled: true },
    { key: 'kid-local', value: cfg.signingKeyId, enabled: true },
    { key: 'signingKeyId', value: cfg.signingKeyId, enabled: true },
    { key: 'pem-local', value: pemEscaped, enabled: true },
    { key: 'signingKey', value: pemEscaped, enabled: true },
    { key: 'redirectUri', value: cfg.redirectUri, enabled: true },
    { key: 'redirectUrl', value: cfg.redirectUri, enabled: true },
    { key: 'redirect_uri', value: cfg.redirectUri, enabled: true },
    { key: 'issuer', value: disco.issuer, enabled: true },
    { key: 'tokenEndpoint', value: disco.token_endpoint, enabled: true },
    { key: 'parEndpoint', value: disco.pushed_authorization_request_endpoint || '', enabled: true },
    { key: 'par-endpoint', value: disco.pushed_authorization_request_endpoint || '', enabled: true },
    { key: 'authorizationEndpoint', value: disco.authorization_endpoint || '', enabled: true },
    { key: 'authEndpoint', value: disco.authorization_endpoint || '', enabled: true },
    { key: 'rs', value: cfg.baseUri, enabled: true },
    { key: 'baseUri', value: cfg.baseUri, enabled: true },
    { key: 'cs', value: cfg.consentUri || cfg.baseUri, enabled: true },
    { key: 'discoveryUri', value: cfg.discoveryUri, enabled: true },
    { key: 'jwksUrl', value: disco.jwks_uri || '', enabled: true },
    { key: 'x-fapi-interaction-id', value: crypto.randomUUID(), enabled: true },
    { key: 'interaction-id', value: crypto.randomUUID(), enabled: true },
    { key: 'interactionId', value: crypto.randomUUID(), enabled: true },
  ];

  return { name: `${target}-auto`, values };
}

// Predicate helpers — determines when to stop including items in a flow.
function urlPathMatches(item, fragment) {
  const url = requestUrl(item).toLowerCase();
  return url.includes(fragment.toLowerCase());
}

const StopAt = {
  // Collection uses `{{par-endpoint}}` / `{{parEndpoint}}` templates rather
  // than a literal /par path, so match on request name as primary signal.
  par: item => requestMethod(item) === 'POST' && (
    /\bPAR\b/.test(item.name || '') ||
    /par-endpoint|parEndpoint/.test(requestUrl(item)) ||
    /\/par(\b|$)/.test(requestUrl(item))
  ),
  // Matches POST /<type>-insurance-quotes (Create Quote), but not PATCH by id
  // or the insurance-quote-log variants.
  createQuote: item => requestMethod(item) === 'POST'
    && /\/[a-z]+-insurance-quotes(\?|$)/i.test(requestUrl(item))
    && !/insurance-quotes\/\{/.test(requestUrl(item))
    && !/insurance-quote-log/.test(requestUrl(item)),
  never: () => false,
};

function runNewman({ collection, environment }) {
  return new Promise((resolve, reject) => {
    const failures = [];
    const scriptWarnings = [];
    const requestResults = [];
    let currentItem = null;
    newman.run({
      collection,
      environment,
      reporters: [],
      sslClientCert: transportCertPath,
      sslClientKey: transportKeyPath,
      insecure: process.env.NEBRAS_TLS_STRICT !== '1',
      timeoutRequest: 30000,
      bail: false,
    }, (err, summary) => {
      if (err) return reject(err);
      resolve({ summary, failures, scriptWarnings, requestResults });
    })
    .on('beforeItem', (err, args) => { currentItem = args?.item?.name; })
    .on('request', (err, args) => {
      const name = args?.item?.name;
      const status = args?.response?.code;
      const body = args?.response?.stream?.toString('utf8').slice(0, 500);
      requestResults.push({ name, status, body, error: err?.message });
      if (err) failures.push({ phase: 'request', name, error: err.message });
      else if (args.response && status >= 400) {
        failures.push({ phase: 'http', name, status, body });
      } else if (args.response && /POST to PAR end-point/i.test(name || '') && status !== 201) {
        // RFC 9126: PAR must return 201 Created. A 200 would still be a regression.
        failures.push({ phase: 'http', name, status, body: `expected 201, got ${status}` });
      }
      if (process.env.NEBRAS_TEST_DEBUG && args.response) {
        console.error(`[debug] ${name} -> ${status} ${body?.slice(0, 300)}`);
      }
    })
    .on('exception', (cursor, err) => {
      // Script errors don't fail the run — if they break a downstream call,
      // that call's HTTP status will catch it. Collected as warnings so
      // collection-script bugs surface without blocking the suite.
      const e = err?.error || err;
      scriptWarnings.push({
        name: currentItem || cursor?.ref || 'unknown',
        error: e?.message || JSON.stringify(e).slice(0, 300),
      });
    });
  });
}

async function runFlow({ collectionName, flow, stopAt, target }) {
  const collection = loadCollection(collectionName);
  const subset = buildSubsetCollection(collection, flow.folder, stopAt);
  const environment = await buildEnv(target);
  return runNewman({ collection: subset, environment });
}

// Build a synthetic folder that concatenates the direct requests of multiple
// sibling folders (e.g. "Token Exchange" + "Resource Endpoints"). Variant
// subfolders like "(application/jwt)" are excluded — they're alternate
// flavours of the same requests, not part of the vanilla flow. Useful when a
// flow is split across folders but must share env state (the access_token
// minted by Token Exchange feeds the Resource calls).
function composeFolder({ collectionName, folderPaths, name }) {
  const collection = loadCollection(collectionName);
  const items = [];
  for (const p of folderPaths) {
    const folder = findFolder(collection.item, p);
    if (!folder) throw new Error(`Folder not found: ${p.join(' > ')}`);
    items.push(...(folder.item || []).filter(it => it.request));
  }
  return { name: name || folderPaths.map(p => p.join('/')).join(' + '), item: items };
}

// Run a folder (synthetic or otherwise) with optional collection-variable
// overrides. The overrides are injected into the cloned subset so `{{name}}`
// placeholders anywhere in the collection resolve to the supplied values.
async function runComposedFlow({ collectionName, folder, target, inject = {} }) {
  const collection = loadCollection(collectionName);
  const subset = buildSubsetCollection(collection, folder);
  subset.variable = subset.variable || [];
  for (const [key, value] of Object.entries(inject)) {
    const existing = subset.variable.find(v => v.key === key);
    if (existing) existing.value = value;
    else subset.variable.push({ key, value, type: 'string' });
  }
  const environment = await buildEnv(target);
  return runNewman({ collection: subset, environment });
}

function flowsUnder({ collectionName, folderPath, stopAt, includeNonStop = false }) {
  const collection = loadCollection(collectionName);
  return enumerateFlows(collection.item, folderPath, stopAt, includeNonStop);
}

// Wrap a whole folder (including nested subfolders) as a single flow so that
// env state set by one subfolder's scripts flows into the next. Used for
// areas like CoP where `discovery` populates `discovered-as`/`discovered-rs`
// that `confirmation` then consumes.
function folderAsFlow({ collectionName, folderPath }) {
  const { findFolder } = require('./collection');
  const collection = loadCollection(collectionName);
  const folder = findFolder(collection.item, folderPath);
  if (!folder) throw new Error(`Folder not found: ${folderPath.join(' > ')}`);
  return { name: folderPath.join(' > '), folder };
}

module.exports = {
  buildEnv,
  runNewman,
  runFlow,
  runComposedFlow,
  composeFolder,
  flowsUnder,
  folderAsFlow,
  StopAt,
};
