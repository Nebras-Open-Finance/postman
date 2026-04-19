const { describe, it } = require('node:test');
const assert = require('node:assert');
const { runFlow, folderAsFlow, StopAt } = require('../helpers/runner');

const COLLECTION = 'banking';

// Client-credentials-grant-only areas: no PAR, no authorize. Each area runs
// end-to-end as a single newman invocation so that env state set by one
// sub-folder (e.g. CoP's discovery populates discovered-as/discovered-rs)
// flows into the next.
const AREAS = [
  { name: 'Confirmation Of Payee APIs (application/jwt)', path: ['V2.1', 'Confirmation Of Payee APIs (application/jwt)'] },
  { name: 'Products & Leads',                            path: ['V2.1', 'Products & Leads'] },
  { name: 'Atms',                                        path: ['V2.1', 'Atms'] },
];

describe('Banking > cc-grant-only areas — end-to-end', () => {
  for (const area of AREAS) {
    it(area.name, async () => {
      const flow = folderAsFlow({ collectionName: COLLECTION, folderPath: area.path });
      const { failures } = await runFlow({
        collectionName: COLLECTION, flow, stopAt: StopAt.never, target: 'banking',
      });
      assert.strictEqual(failures.length, 0,
        failures.map(f => `  - [${f.phase}] ${f.name}: ${f.status || f.error || ''}${f.body ? '\n      body: ' + f.body : ''}`).join('\n'));
    });
  }
});
