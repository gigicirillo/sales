(() => {
  const container = document.getElementById('totalsBoxes');
  if (!container || typeof aggregate !== 'function') return;

  const toggleWrap = document.createElement('div');
  toggleWrap.style.display = 'flex';
  toggleWrap.style.justifyContent = 'center';
  toggleWrap.style.margin = '2px 0 0';

  const toggleButton = document.createElement('button');
  toggleButton.type = 'button';
  toggleButton.textContent = 'Dettagli totali';
  toggleButton.setAttribute('aria-expanded', 'false');
  toggleButton.setAttribute('aria-controls', 'totalsBoxes');
  toggleButton.style.border = '0';
  toggleButton.style.borderRadius = '10px';
  toggleButton.style.background = '#111827';
  toggleButton.style.color = '#fff';
  toggleButton.style.padding = '9px 16px';
  toggleButton.style.font = 'inherit';
  toggleButton.style.fontSize = '.78rem';
  toggleButton.style.fontWeight = '900';
  toggleButton.style.cursor = 'pointer';
  toggleButton.style.boxShadow = '0 5px 14px rgba(15,23,42,.12)';

  toggleWrap.appendChild(toggleButton);
  container.parentNode.insertBefore(toggleWrap, container);

  container.style.overflow = 'hidden';
  container.style.maxHeight = '0px';
  container.style.opacity = '0';
  container.style.marginTop = '-10px';
  container.style.transition = 'max-height .38s ease, opacity .25s ease, margin-top .38s ease';

  let isOpen = false;
  const syncHeight = () => {
    if (isOpen) container.style.maxHeight = `${container.scrollHeight}px`;
  };

  toggleButton.addEventListener('click', () => {
    isOpen = !isOpen;
    toggleButton.setAttribute('aria-expanded', String(isOpen));
    toggleButton.textContent = isOpen ? 'Nascondi dettagli totali' : 'Dettagli totali';
    container.style.maxHeight = isOpen ? `${container.scrollHeight}px` : '0px';
    container.style.opacity = isOpen ? '1' : '0';
    container.style.marginTop = isOpen ? '0' : '-10px';
  });

  window.addEventListener('resize', syncHeight);

  const formatNumber = value => new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 }).format(Number(value) || 0);
  const formatHours = value => `${formatNumber(value)} h`;
  const formatMoney = value => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(Number(value) || 0);
  const item = (label, value, note = '') => `<div class="totals-box-item"><span>${label}</span><strong>${value}</strong>${note ? `<small>${note}</small>` : ''}</div>`;
  const box = (badge, title, content) => `<article class="totals-box"><div class="totals-box-head"><span class="totals-box-badge">${badge}</span><h2>${title}</h2></div><div class="totals-box-grid">${content}</div></article>`;

  function rowCollected(row) {
    const total = Number(row.totalCollected) || 0;
    const parts = (Number(row.collectedPos) || 0) + (Number(row.collectedCash) || 0) + (Number(row.collectedBank) || 0) + (Number(row.collectedFinance) || 0);
    return total > 0 ? total : parts;
  }

  function renderTotalsBoxes(rows) {
    const a = aggregate(rows);
    const collected = rows.reduce((sum, row) => sum + rowCollected(row), 0);
    const installmentsTotal = rows.reduce((sum, row) => sum + (Number(row.installmentsTotal) || 0), 0);
    const notesFilled = rows.filter(row => String(row.notes || '').trim()).length;

    container.innerHTML = [
      box('OP', 'Operatore',
        item('Ore lavorate', formatHours(a.workedHours)) +
        item('Giornate registrate', formatNumber(rows.length))
      ),
      box('MSG', 'Azioni da Messaggi',
        item('Messaggi inviati', formatNumber(a.messagesSent)) +
        item('Messaggi compleanno', formatNumber(a.birthdayMessagesSent))
      ),
      box('01', 'Azioni da telefonate',
        item('Telefonate fatte', formatNumber(a.callsMade)) +
        item('Telefonate risposte', formatNumber(a.callsAnswered)) +
        item('Appuntamenti', formatNumber(a.appointmentsFromCalls)) +
        item('Preventivi', formatNumber(a.quotesFromCalls)) +
        item('Abbonamenti', formatNumber(a.subscriptionsFromCalls))
      ),
      box('02', 'Azioni da tour spontanei',
        item('Tour fatti', formatNumber(a.toursDone)) +
        item('Preventivi da tour', formatNumber(a.quotesFromTours)) +
        item('Abbonamenti da tour', formatNumber(a.subscriptionsFromTours))
      ),
      box('03', 'Azioni da clientela organica',
        item('Preventivi', formatNumber(a.organicQuotes)) +
        item('Abbonamenti', formatNumber(a.subscriptionsFromOrganicQuotes)) +
        item('Rinnovi organici', formatNumber(a.organicRenewals))
      ),
      box('04', 'Altre azioni',
        item('Prove attivate', formatNumber(a.trialsActivated)) +
        item('Pass/Voucher consegnati', formatNumber(a.passesVouchersDelivered)) +
        item('Pass/Voucher attivati', formatNumber(a.passesVouchersActivated))
      ),
      box('05', 'Vendite',
        item('Fatturato', formatMoney(a.revenue)) +
        item('Incassato Futura', formatMoney(a.futuraAmount))
      ),
      box('06', 'Incassato',
        item('Totale', formatMoney(collected)) +
        item('POS', formatMoney(a.collectedPos)) +
        item('Contanti', formatMoney(a.collectedCash)) +
        item('Bonifico', formatMoney(a.collectedBank)) +
        item('Finanziamento', formatMoney(a.collectedFinance))
      ),
      box('ABB', 'Abbonamenti Venduti',
        item('Abbonamenti totali venduti', formatNumber(a.soldSubscriptionsTotal))
      ),
      box('RAT', 'Ratei',
        item('Numero ratei', formatNumber(installmentsTotal))
      ),
      box('07', 'Note',
        item('Note compilate', formatNumber(notesFilled), `su ${formatNumber(rows.length)} giornate`)
      )
    ].join('');
    syncHeight();
  }

  const originalRender = render;
  render = function(rows) {
    originalRender(rows);
    renderTotalsBoxes(rows || []);
  };

  renderTotalsBoxes(typeof currentRows !== 'undefined' ? currentRows : []);
})();