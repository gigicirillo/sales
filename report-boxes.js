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

  function totalsData(rows) {
    const a = aggregate(rows);
    const collected = rows.reduce((sum, row) => sum + rowCollected(row), 0);
    const installmentsTotal = rows.reduce((sum, row) => sum + (Number(row.installmentsTotal) || 0), 0);
    const notesFilled = rows.filter(row => String(row.notes || '').trim()).length;
    return { a, collected, installmentsTotal, notesFilled };
  }

  function renderTotalsBoxes(rows) {
    const { a, collected, installmentsTotal, notesFilled } = totalsData(rows);

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

  function roundedRect(ctx, x, y, w, h, r, fill) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function exportDetailedJpg() {
    const rows = typeof currentRows !== 'undefined' ? currentRows : [];
    const { a, collected, installmentsTotal, notesFilled } = totalsData(rows);
    const sections = [
      { title: 'Operatore', color: '#eaf2ff', values: [['Ore lavorate', formatHours(a.workedHours)], ['Giornate registrate', formatNumber(rows.length)]] },
      { title: 'Azioni da Messaggi', color: '#eefcf5', values: [['Messaggi inviati', formatNumber(a.messagesSent)], ['Messaggi compleanno', formatNumber(a.birthdayMessagesSent)]] },
      { title: 'Azioni da telefonate', color: '#eef6ff', values: [['Telefonate fatte', formatNumber(a.callsMade)], ['Telefonate risposte', formatNumber(a.callsAnswered)], ['Appuntamenti', formatNumber(a.appointmentsFromCalls)], ['Preventivi', formatNumber(a.quotesFromCalls)], ['Abbonamenti', formatNumber(a.subscriptionsFromCalls)]] },
      { title: 'Azioni da tour spontanei', color: '#f2fbf4', values: [['Tour fatti', formatNumber(a.toursDone)], ['Preventivi da tour', formatNumber(a.quotesFromTours)], ['Abbonamenti da tour', formatNumber(a.subscriptionsFromTours)]] },
      { title: 'Azioni da clientela organica', color: '#fff8e8', values: [['Preventivi', formatNumber(a.organicQuotes)], ['Abbonamenti', formatNumber(a.subscriptionsFromOrganicQuotes)], ['Rinnovi organici', formatNumber(a.organicRenewals)]] },
      { title: 'Altre azioni', color: '#f7f1ff', values: [['Prove attivate', formatNumber(a.trialsActivated)], ['Pass/Voucher consegnati', formatNumber(a.passesVouchersDelivered)], ['Pass/Voucher attivati', formatNumber(a.passesVouchersActivated)]] },
      { title: 'Vendite', color: '#fff0f5', values: [['Fatturato', formatMoney(a.revenue)], ['Incassato Futura', formatMoney(a.futuraAmount)]] },
      { title: 'Incassato', color: '#edf9f8', values: [['Totale', formatMoney(collected)], ['POS', formatMoney(a.collectedPos)], ['Contanti', formatMoney(a.collectedCash)], ['Bonifico', formatMoney(a.collectedBank)], ['Finanziamento', formatMoney(a.collectedFinance)]] },
      { title: 'Abbonamenti Venduti', color: '#fffbe8', values: [['Abbonamenti totali venduti', formatNumber(a.soldSubscriptionsTotal)]] },
      { title: 'Ratei', color: '#eef7ff', values: [['Numero ratei', formatNumber(installmentsTotal)]] },
      { title: 'Note', color: '#f8fafc', values: [['Note compilate', `${formatNumber(notesFilled)} su ${formatNumber(rows.length)} giornate`]] }
    ];

    const canvas = document.createElement('canvas');
    const w = 1600, h = 2550, ctx = canvas.getContext('2d');
    canvas.width = w; canvas.height = h;
    ctx.fillStyle = '#eef1f4'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#111827'; ctx.fillRect(45, 45, w - 90, 145);
    ctx.fillStyle = '#fff'; ctx.font = '700 42px Arial'; ctx.fillText('Report performance commerciale', 80, 105);
    ctx.fillStyle = '#cbd5e1'; ctx.font = '23px Arial';
    ctx.fillText(`Periodo ${formatDate(els.dateFrom.value)} - ${formatDate(els.dateTo.value)} · Venditore: ${els.sellerLabel.textContent} · Centro: ${els.centerLabel.textContent}`, 80, 150);

    ctx.fillStyle = '#111827'; ctx.font = '700 28px Arial'; ctx.fillText('Dettagli totali', 55, 235);
    const gap = 18, colW = (w - 110 - gap) / 2, cardH = 190;
    sections.forEach((section, i) => {
      const col = i % 2, row = Math.floor(i / 2), x = 55 + col * (colW + gap), y = 265 + row * (cardH + gap);
      roundedRect(ctx, x, y, colW, cardH, 16, section.color);
      ctx.fillStyle = '#6d28d9'; ctx.font = '700 22px Arial'; ctx.fillText(section.title, x + 20, y + 34);
      const valueCols = section.values.length > 3 ? 3 : Math.max(section.values.length, 1);
      const itemW = (colW - 40 - (valueCols - 1) * 10) / valueCols;
      section.values.forEach((entry, idx) => {
        const r = Math.floor(idx / valueCols), c = idx % valueCols, ix = x + 20 + c * (itemW + 10), iy = y + 55 + r * 62;
        ctx.fillStyle = 'rgba(255,255,255,.82)'; ctx.fillRect(ix, iy, itemW, 52);
        ctx.fillStyle = '#64748b'; ctx.font = '14px Arial'; ctx.fillText(entry[0].slice(0, 25), ix + 10, iy + 18);
        ctx.fillStyle = '#111827'; ctx.font = '700 20px Arial'; ctx.fillText(String(entry[1]), ix + 10, iy + 42);
      });
    });

    const chartY = 1515;
    const sellerVals = sellers.map(s => {
      const sellerRows = rows.filter(r => r.seller === s);
      return { seller: s, revenue: sellerRows.reduce((sum, r) => sum + n(r.revenue), 0), collected: sellerRows.reduce((sum, r) => sum + rowCollected(r), 0) };
    });
    ctx.fillStyle = '#111827'; ctx.font = '700 28px Arial'; ctx.fillText('Fatturato e incassato per venditore', 55, chartY);
    ctx.fillStyle = '#6d28d9'; ctx.fillRect(55, chartY + 20, 22, 12); ctx.fillStyle = '#475569'; ctx.font = '17px Arial'; ctx.fillText('Fatturato', 86, chartY + 31);
    ctx.fillStyle = '#0891b2'; ctx.fillRect(200, chartY + 20, 22, 12); ctx.fillStyle = '#475569'; ctx.fillText('Incassato', 231, chartY + 31);
    const max = Math.max(...sellerVals.flatMap(x => [x.revenue, x.collected]), 1);
    sellerVals.forEach((it, i) => {
      const y = chartY + 65 + i * 125, revW = 900 * it.revenue / max, incW = 900 * it.collected / max;
      ctx.fillStyle = '#374151'; ctx.font = '700 20px Arial'; ctx.fillText(it.seller, 55, y + 38);
      ctx.fillStyle = '#6d28d9'; ctx.fillRect(190, y, Math.max(revW, 2), 30);
      ctx.fillStyle = '#111827'; ctx.font = '700 17px Arial'; ctx.fillText(formatMoney(it.revenue), 200 + revW, y + 21);
      ctx.fillStyle = '#0891b2'; ctx.fillRect(190, y + 45, Math.max(incW, 2), 30);
      ctx.fillStyle = '#111827'; ctx.fillText(formatMoney(it.collected), 200 + incW, y + 66);
    });

    ctx.fillStyle = '#6b7280'; ctx.font = '17px Arial';
    ctx.fillText(`Report esportato il ${new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}`, 55, h - 38);
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `report-vendite-${els.dateFrom.value}-${els.dateTo.value}.jpg`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/jpeg', .94);
  }

  setTimeout(() => {
    const oldExport = document.getElementById('exportJpg');
    if (!oldExport) return;
    const newExport = oldExport.cloneNode(true);
    oldExport.replaceWith(newExport);
    newExport.addEventListener('click', () => {
      try { exportDetailedJpg(); }
      catch (error) {
        const message = document.getElementById('reportMessage');
        if (message) message.textContent = `Esportazione non riuscita: ${error.message}`;
      }
    });
  }, 0);
})();