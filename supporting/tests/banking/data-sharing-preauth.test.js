const { test } = require('node:test');
const assert = require('node:assert');
const { runComposedFlow, composeFolder } = require('../helpers/runner');
const { loadCollection, findFolder } = require('../helpers/collection');
const { creds } = require('../helpers/config');

const COLLECTION = 'banking';
const TARGET = 'banking';
const EXAMPLE = 'Example 1 - All Data Permissions';
const ROOT = ['V2.1', 'Data Sharing', EXAMPLE];

const preAuth = creds[TARGET]?.preAuthorised?.v2_1?.dataSharing;
const expired = preAuth?.expiresAt && Date.parse(preAuth.expiresAt) < Date.now();
const skipReason = !preAuth
  ? 'no preAuthorised.v2_1.dataSharing in supporting/certs/config.js'
  : expired ? `pre-authorised consent expired at ${preAuth.expiresAt}` : null;

const testOpts = skipReason ? { skip: skipReason } : {};
test(`Banking > Data Sharing (pre-authorised) — ${EXAMPLE}`, testOpts, async (t) => {
  const resourceFolder = findFolder(loadCollection(COLLECTION).item, [...ROOT, 'Resource Endpoints']);
  const resourceNames = (resourceFolder?.item || []).filter(i => i.request).map(i => i.name);

  const folder = composeFolder({
    collectionName: COLLECTION,
    folderPaths: [[...ROOT, 'Token Exchange'], [...ROOT, 'Resource Endpoints']],
    name: `${EXAMPLE} (pre-auth)`,
  });
  const { requestResults } = await runComposedFlow({
    collectionName: COLLECTION,
    folder,
    target: TARGET,
    inject: { refresh_token: preAuth.refreshToken },
  });
  const results = new Map(requestResults.map(r => [r.name, r]));

  const assertOk = (name) => {
    const r = results.get(name);
    assert.ok(r, `no result captured for "${name}" — earlier step likely failed`);
    assert.ifError(r.error);
    assert.ok(r.status >= 200 && r.status < 300,
      `expected 2xx, got ${r.status}\n  body: ${r.body}`);
  };

  await t.test('TPP-API Hub: Refresh Token Exchange', () => {
    assertOk('TPP-API Hub: Refresh Token Exchange');
  });

  for (const name of resourceNames) {
    await t.test(name, () => assertOk(name));
  }
});
