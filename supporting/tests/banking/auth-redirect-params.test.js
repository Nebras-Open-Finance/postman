// Static check: the authorization-code redirect URL must carry exactly three
// query parameters — `client_id`, `response_type` and `request_uri` — and
// nothing else. Scope (and anything else) is conveyed solely via the PAR
// request object; any extra parameter on the redirect URL is a regression.
//
// Pure structural test — reads the collection JSON only, no network, no certs.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..', '..', '..');
const collection = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'banking.postman_collection.json'), 'utf8')
);

// The only query parameters permitted on the authorization-code redirect URL.
const EXPECTED_PARAMS = ['client_id', 'response_type', 'request_uri'];

// Walk the whole collection tree, yielding every item that builds an
// authCodeUrl, paired with the folder path it lives under.
function collectAuthCodeUrlScripts(node, pathParts, out) {
  for (const item of node.item || []) {
    const here = [...pathParts, item.name];
    for (const ev of item.event || []) {
      const src = (ev.script?.exec || []).join('\n');
      if (/authCodeUrl\s*=/.test(src)) {
        out.push({ path: here.join(' / '), src });
      }
    }
    if (Array.isArray(item.item)) collectAuthCodeUrlScripts(item, here, out);
  }
  return out;
}

// Extract the ordered list of query-parameter names from the `authCodeUrl`
// template literal, e.g. `${authEndpoint}?client_id=...&response_type=...`.
function authCodeUrlParams(src) {
  const m = src.match(/authCodeUrl\s*=\s*`([^`]*)`/);
  if (!m) return null;
  const query = m[1].split('?')[1];
  if (!query) return [];
  return query.split('&').map((p) => p.split('=')[0]);
}

const scripts = collectAuthCodeUrlScripts(collection, [], []);

test('banking — authorization URL carries only client_id, response_type and request_uri', async (t) => {
  assert.ok(scripts.length > 0, 'no authCodeUrl scripts found — selectors likely stale');

  for (const s of scripts) {
    await t.test(s.path, () => {
      const params = authCodeUrlParams(s.src);
      assert.ok(params, `could not parse authCodeUrl template in "${s.path}"`);
      assert.deepStrictEqual(
        [...params].sort(),
        [...EXPECTED_PARAMS].sort(),
        `unexpected redirect URL parameters in "${s.path}": got [${params.join(', ')}], ` +
          `expected exactly [${EXPECTED_PARAMS.join(', ')}]`
      );
    });
  }
});
