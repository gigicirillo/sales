/* Collected amounts and subscription counts come directly from the report API.
 * Only installments marked "Rata ris." are collected; "Rata ins." is unpaid.
 * Collected totals already include paid installments: subtract them exactly once.
 */
(function (root) {
  'use strict';
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const euro = value => new Intl.NumberFormat('it-IT', {
    style: 'currency', currency: 'EUR'
  }).format(value);

  function aggregate(rows, seller = 'all') {
    const groups = new Map();
    for (const row of rows) {
      if (seller !== 'all' && row.seller !== seller) continue;
      if (!groups.has(row.seller)) groups.set(row.seller, {
        seller: row.seller, totalCollected: 0, collectedInstallments: 0,
        subscriptions: 0, unknownInstallments: 0
      });
      const item = groups.get(row.seller);
      item.totalCollected += number(row.totalCollected);
      item.subscriptions += number(row.soldSubscriptionsTotal);
      for (const installment of Array.isArray(row.installments) ? row.installments : []) {
        const status = String(installment?.status || '').trim();
        if (status === 'Rata ris.') item.collectedInstallments += number(installment.amount);
        else if (status !== 'Rata ins.' && number(installment?.amount) !== 0) item.unknownInstallments++;
      }
    }
    return [...groups.values()].sort((a, b) => String(a.seller).localeCompare(String(b.seller), 'it')).map(item => ({
      ...item,
      netCollected: item.totalCollected - item.collectedInstallments,
      average: item.subscriptions > 0 && !item.unknownInstallments
        ? (item.totalCollected - item.collectedInstallments) / item.subscriptions : null
    }));
  }

  function render(rows, seller) {
    const target = document.getElementById('customerSpendChart');
    if (!target) return;
    target.replaceChildren();
    const items = aggregate(rows, seller);
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'customer-spend-empty';
      empty.textContent = 'Nessun dato disponibile con i filtri correnti.';
      target.appendChild(empty);
      return;
    }
    const max = Math.max(1, ...items.map(item => Math.abs(item.average || 0)));
    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'customer-spend-row';
      const label = document.createElement('span');
      label.className = 'customer-spend-name';
      label.textContent = item.seller || 'Consulente non indicato';
      const value = document.createElement('strong');
      value.className = 'customer-spend-value';
      value.textContent = item.average === null ? 'N/D' : euro(item.average);
      const track = document.createElement('div');
      track.className = 'customer-spend-track';
      track.setAttribute('aria-hidden', 'true');
      const bar = document.createElement('div');
      bar.className = 'customer-spend-bar';
      bar.style.width = `${Math.abs(item.average || 0) / max * 100}%`;
      if (item.average < 0) bar.classList.add('negative');
      track.appendChild(bar);
      const detail = document.createElement('small');
      detail.className = 'customer-spend-detail';
      detail.textContent = item.unknownInstallments
        ? 'Media non disponibile: verificare lo stato dei ratei nel Daily.'
        : `Incassato netto: ${euro(item.netCollected)} · ${item.subscriptions} abbonamenti · Ratei riscossi esclusi: ${euro(item.collectedInstallments)}`;
      if (item.subscriptions <= 0) detail.textContent += ' · Nessun abbonamento venduto.';
      row.append(label, value, track, detail);
      target.appendChild(row);
    }
  }
  root.CustomerSpend = { aggregate, render };
  if (typeof module !== 'undefined' && module.exports) module.exports = { aggregate };
})(typeof window === 'undefined' ? globalThis : window);
