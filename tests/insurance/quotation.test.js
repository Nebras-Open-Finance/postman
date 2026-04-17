const { describe, it } = require('node:test');
const assert = require('node:assert');
const { runFlow, flowsUnder, StopAt } = require('../helpers/runner');

const COLLECTION = 'insurance';
const ROOT = ['Insurance v2.1', 'Quotation'];

const flows = flowsUnder({
  collectionName: COLLECTION,
  folderPath: ROOT,
  stopAt: StopAt.createQuote,
});

const byInsuranceType = flows.reduce((acc, f) => {
  // Second segment of the name is the insurance type folder
  const type = f.name.split(' > ')[1] || 'Other';
  (acc[type] ??= []).push(f);
  return acc;
}, {});

describe('Insurance > Quotation — runs each example up to Create Quote', () => {
  for (const [type, typeFlows] of Object.entries(byInsuranceType)) {
    describe(type, () => {
      for (const flow of typeFlows) {
        const label = flow.name.split(' > ').slice(2).join(' > ') || flow.name;
        it(label, async () => {
          const { failures } = await runFlow({
            collectionName: COLLECTION,
            flow,
            stopAt: StopAt.createQuote,
            target: 'insurance',
          });
          assert.strictEqual(failures.length, 0,
            `Flow had ${failures.length} failure(s):\n` +
            failures.map(f => `  - [${f.phase}] ${f.name}: ${f.status || f.error || ''}${f.body ? '\n      body: ' + f.body : ''}`).join('\n'));
        });
      }
    });
  }
});
