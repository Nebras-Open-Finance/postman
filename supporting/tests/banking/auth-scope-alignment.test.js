// Static check: the OAuth `scope` requested in the authorization URL must
// match the `scope` claim signed into the PAR request object for the same
// flow. A mismatch means the user is sent to authorize a different scope
// than the one registered via PAR, which the LFI can reject.
//
// Pure structural test — reads the collection JSON only, no network, no certs.
// Scoped to the V2.1 Data Sharing and Service Initiation flows (the surface
// aligned by the auth-code-url-scope-sync change). V1.2 and V2.1/Other are
// known to still mismatch and are intentionally not guarded here.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..', '..', '..');
const collection = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'banking.postman_collection.json'), 'utf8')
);

// Roots whose AuthFlow / Consent Flow folders must have aligned scopes.
const ROOTS = [
  ['V2.1', 'Data Sharing'],
  ['V2.1', 'Service Initiation'],
];

// Token-set equality, order-insensitive ('a b' === 'b a').
const normalise = (s) => s.trim().split(/\s+/).filter(Boolean).sort().join(' ');

function findFolder(items, folderPath) {
  let level = items;
  let node = null;
  for (const name of folderPath) {
    node = (level || []).find((it) => it.name === name && Array.isArray(it.item));
    if (!node) return null;
    level = node.item;
  }
  return node;
}

// `scope` claim from a PAR request object JWT body, e.g. `"scope": "accounts openid"`.
function parScope(item) {
  const raw = item?.request?.body?.raw || '';
  const m = raw.match(/"scope"\s*:\s*"([^"]+)"/);
  return m ? m[1] : null;
}

// `scope` value baked into the authCodeUrl built by a POST-to-PAR script,
// e.g. `const scope = encodeURIComponent('openid accounts')` or a literal
// `scope=openid` in the URL template.
function urlScope(item) {
  for (const ev of item?.event || []) {
    const src = (ev.script?.exec || []).join('\n');
    if (!/authCodeUrl\s*=/.test(src)) continue;
    const enc = src.match(/encodeURIComponent\(\s*'([^']+)'\s*\)/);
    if (enc) return enc[1];
    const lit = src.match(/[?&]scope=([^&`$\s]+)/);
    if (lit) return decodeURIComponent(lit[1]);
    return '(unparsed)';
  }
  return null;
}

// A flow is any folder whose direct children include both a PAR request
// object and a POST-to-PAR script. Yields { path, par, url } per flow.
function collectFlows(node, pathParts, out) {
  const kids = node.item || [];
  const parItem = kids.find((k) => parScope(k));
  const urlItem = kids.find((k) => urlScope(k));
  if (parItem && urlItem) {
    out.push({ path: pathParts.join(' / '), par: parScope(parItem), url: urlScope(urlItem) });
  }
  for (const k of kids) {
    if (Array.isArray(k.item)) collectFlows(k, [...pathParts, k.name], out);
  }
  return out;
}

const flows = [];
for (const root of ROOTS) {
  const folder = findFolder(collection.item, root);
  assert.ok(folder, `collection folder not found: ${root.join(' / ')}`);
  collectFlows(folder, root, flows);
}

test('banking V2.1 — authorization URL scope matches PAR request scope', async (t) => {
  assert.ok(flows.length > 0, 'no PAR/authCodeUrl flow pairs found — selectors likely stale');

  for (const flow of flows) {
    await t.test(flow.path, () => {
      assert.notStrictEqual(flow.url, '(unparsed)',
        `could not parse scope from authCodeUrl script in "${flow.path}"`);
      assert.strictEqual(normalise(flow.url), normalise(flow.par),
        `scope mismatch:\n  PAR request object: "${flow.par}"\n  authorization URL:  "${flow.url}"`);
    });
  }
});
