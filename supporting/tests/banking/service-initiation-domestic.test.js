const { describe, it } = require('node:test');
const assert = require('node:assert');
const { runFlow, flowsUnder, StopAt } = require('../helpers/runner');

const COLLECTION = 'banking';
const ROOT = ['V2.1', 'Service Initiation', 'Domestic Payments'];

const flows = flowsUnder({
  collectionName: COLLECTION,
  folderPath: ROOT,
  stopAt: StopAt.par,
});

// Flow names are "Domestic Payments > <Payment Type> > <Example> > ...".
// Group by payment type so the test tree mirrors the collection tree.
const grouped = flows.reduce((acc, f) => {
  const paymentType = f.name.split(' > ')[1] || 'Other';
  (acc[paymentType] ??= []).push(f);
  return acc;
}, {});

describe('Banking > Service Initiation > Domestic Payments — runs each example up to PAR', () => {
  for (const [paymentType, typeFlows] of Object.entries(grouped)) {
    describe(paymentType, () => {
      for (const flow of typeFlows) {
        const label = flow.name.split(' > ').slice(2).join(' > ') || flow.name;
        it(label, async () => {
          const { failures } = await runFlow({
            collectionName: COLLECTION,
            flow,
            stopAt: StopAt.par,
            target: 'banking',
          });
          assert.strictEqual(failures.length, 0,
            `Flow had ${failures.length} failure(s):\n` +
            failures.map(f => `  - [${f.phase}] ${f.name}: ${f.status || f.error || ''}${f.body ? '\n      body: ' + f.body : ''}`).join('\n'));
        });
      }
    });
  }
});
