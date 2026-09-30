const { test } = require('node:test');
const assert = require('node:assert/strict');
const { aggregate } = require('../customer-spend.js');
const rows = [
  { seller: 'Sarah', revenue: 1200, soldSubscriptionsTotal: 2, installmentsTotal: 9, totalCollected: 1200,
    installments: [{ amount: 200, status: 'Rata ris.' }, { amount: 300, status: 'Rata ins.' }] },
  { seller: 'Sarah', revenue: 9000, totalCollected: 400, soldSubscriptionsTotal: 1,
    installments: [{ amount: 100, status: 'Rata ris.' }] },
  { seller: 'Edy', totalCollected: 80, soldSubscriptionsTotal: 0,
    installments: [{ amount: 80, status: 'Rata ris.' }] }
];
test('Uses net period totals, excludes collected installments exactly once and never counts them as sales', () => {
  const [item] = aggregate(rows, 'Sarah');
  assert.equal(item.totalCollected, 1600);
  assert.equal(item.collectedInstallments, 300);
  assert.equal(item.subscriptions, 3);
  assert.equal(item.average, 1300 / 3);
});
test('Seller filter includes Sarah and all selects only consultants with data', () => {
  assert.deepEqual(aggregate(rows).map(x => x.seller), ['Edy', 'Sarah']);
  assert.deepEqual(aggregate(rows, 'missing'), []);
});
test('Zero sales and empty reports have no misleading average', () => {
  assert.equal(aggregate(rows, 'Edy')[0].average, null);
  assert.deepEqual(aggregate([]), []);
});
test('No installment details, numeric strings and zero collected amounts', () => {
  assert.equal(aggregate([{seller:'Edy', totalCollected:'120', soldSubscriptionsTotal:'2'}])[0].average, 60);
  assert.equal(aggregate([{seller:'Edy', totalCollected:0, soldSubscriptionsTotal:2}])[0].average, 0);
});
test('Unknown installment statuses prevent an unverified average', () => {
  assert.equal(aggregate([{seller:'Edy', totalCollected:500, soldSubscriptionsTotal:2, installments:[{amount:100}]}])[0].average, null);
});
test('Negative net amounts stay visible instead of silently clamping the data', () => {
  assert.equal(aggregate([{seller:'Edy', totalCollected:100, soldSubscriptionsTotal:1, installments:[{amount:150,status:'Rata ris.'}]}])[0].average, -50);
});

test('Francesco: collected money counts even when revenue is zero', () => {
  const [item] = aggregate([{seller:'Francesco', revenue:0, totalCollected:1089, soldSubscriptionsTotal:3}], 'Francesco');
  assert.equal(item.netCollected, 1089);
  assert.equal(item.average, 363);
});
