const { describe, it } = require('node:test');
const assert = require('node:assert');
const { runFlow, flowsUnder, StopAt } = require('../helpers/runner');

const COLLECTION = 'insurance';
const ROOT = ['Insurance v2.1', 'Data Sharing'];

const flows = flowsUnder({
  collectionName: COLLECTION,
  folderPath: ROOT,
  stopAt: StopAt.par,
});

// Group by example name (segment after "Data Sharing >") so the Node test
// tree mirrors the Postman folder tree.
const grouped = flows.reduce((acc, f) => {
  const [, example] = f.name.split(' > ');
  (acc[example] ??= []).push(f);
  return acc;
}, {});

describe('Insurance > Data Sharing — runs each example up to PAR', () => {
  for (const [example, exampleFlows] of Object.entries(grouped)) {
    describe(example, () => {
      for (const flow of exampleFlows) {
        const label = flow.name.split(' > ').slice(2).join(' > ');
        it(label, async () => {
          const { failures, scriptWarnings } = await runFlow({
            collectionName: COLLECTION,
            flow,
            stopAt: StopAt.par,
            target: 'insurance',
          });
          const warn = scriptWarnings.length
            ? `\n  Script warnings (${scriptWarnings.length}):\n` +
              scriptWarnings.slice(0, 3).map(w => `    - ${w.name}: ${w.error}`).join('\n')
            : '';
          assert.strictEqual(failures.length, 0,
            `Flow had ${failures.length} failure(s):\n` +
            failures.map(f => `  - [${f.phase}] ${f.name}: ${f.status || f.error || ''}${f.body ? '\n      body: ' + f.body : ''}`).join('\n') +
            warn);
        });
      }
    });
  }
});
