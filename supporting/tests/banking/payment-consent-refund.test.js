const { describe, it } = require('node:test');
const assert = require('node:assert');
const { runFlow, flowsUnder, StopAt } = require('../helpers/runner');

const COLLECTION = 'banking';
const ROOT = ['V2.1', 'Service Initiation', 'Payment Consent Refund'];

// Consent Flow runs up to PAR (same pattern as Data Sharing).
// Get Refund depends on a consent id produced by a real auth-code flow, so
// it can't be exercised standalone; skipped.
const flows = flowsUnder({
  collectionName: COLLECTION,
  folderPath: ROOT,
  stopAt: StopAt.par,
});

describe('Banking > Service Initiation > Payment Consent Refund — runs each example up to PAR', () => {
  for (const flow of flows) {
    const label = flow.name.split(' > ').slice(1).join(' > ') || flow.name;
    it(label, async () => {
      const { failures } = await runFlow({
        collectionName: COLLECTION, flow, stopAt: StopAt.par, target: 'banking',
      });
      assert.strictEqual(failures.length, 0,
        failures.map(f => `  - [${f.phase}] ${f.name}: ${f.status || f.error || ''}${f.body ? '\n      body: ' + f.body : ''}`).join('\n'));
    });
  }
});
