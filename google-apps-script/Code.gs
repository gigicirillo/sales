const SPREADSHEET_ID = '1u7puiT0sI9W2WYV3mbeYk_iBrRQhxSOiGbhlpXMCymw';

const HEADERS = [
  'Data', 'Venditore', 'Centro di competenza',
  'Telefonate fatte', 'Telefonate risposte', 'Appuntamenti da telefonate', 'Preventivi da telefonate', 'Abbonamenti da telefonate',
  'Tour fatti', 'Preventivi da tour fatti', 'Abbonamenti da tour',
  'Preventivi organici', 'Abbonamenti da preventivi organici', 'Rinnovi organici',
  'Prove attivate', 'Pass / Voucher Consegnati', 'Pass / Voucher Attivati',
  'Fatturato', 'Futura',
  'Totale Incassato', 'Inc. POS', 'Inc. Contanti', 'Inc. Bonifico', 'Inc. Finanziamento',
  'Note', 'Timestamp invio'
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    validatePayload_(data);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const date = parseLocalDate_(data.date);
    const monthName = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM');
    let sheet = ss.getSheetByName(monthName);

    if (!sheet) {
      sheet = ss.insertSheet(monthName);
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.setFrozenRows(1);
      styleHeaders_(sheet);
    } else {
      ensureHeaders_(sheet);
    }

    const row = [
      date, data.seller, data.center,
      n_(data.callsMade), n_(data.callsAnswered), n_(data.appointmentsFromCalls), n_(data.quotesFromCalls), n_(data.subscriptionsFromCalls),
      n_(data.toursDone), n_(data.quotesFromTours), n_(data.subscriptionsFromTours),
      n_(data.organicQuotes), n_(data.subscriptionsFromOrganicQuotes), n_(data.organicRenewals),
      n_(data.trialsActivated), n_(data.passesVouchersDelivered), n_(data.passesVouchersActivated),
      n_(data.revenue), n_(data.futuraAmount),
      n_(data.totalCollected), n_(data.collectedPos), n_(data.collectedCash), n_(data.collectedBank), n_(data.collectedFinance),
      String(data.notes || ''), new Date()
    ];

    const existingRow = findExistingRow_(sheet, data.date, data.seller, data.center);
    if (existingRow) sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    else sheet.appendRow(row);

    const rows = Math.max(sheet.getLastRow() - 1, 1);
    sheet.getRange(2, 1, rows, 1).setNumberFormat('dd/MM/yyyy');
    sheet.getRange(2, 18, rows, 7).setNumberFormat('€ #,##0.00');
    sheet.getRange(2, 26, rows, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    sheet.autoResizeColumns(1, HEADERS.length);

    return json_({ ok: true, sheet: monthName, updated: Boolean(existingRow) });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function ensureHeaders_(sheet) {
  while (sheet.getMaxColumns() < HEADERS.length) sheet.insertColumnAfter(sheet.getMaxColumns());
  const current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), HEADERS.length)).getValues()[0];

  if (current[2] !== 'Centro di competenza') sheet.insertColumnAfter(2);

  const oldGuestPassIndex = current.indexOf('Guest pass consegnati');
  if (oldGuestPassIndex >= 0) {
    sheet.getRange(1, oldGuestPassIndex + 1).setValue('Pass / Voucher Consegnati');
    sheet.insertColumnAfter(oldGuestPassIndex + 1);
  } else if (current.indexOf('Pass / Voucher Consegnati') >= 0 && current.indexOf('Pass / Voucher Attivati') < 0) {
    const deliveredCol = current.indexOf('Pass / Voucher Consegnati') + 1;
    sheet.insertColumnAfter(deliveredCol);
  }

  while (sheet.getMaxColumns() < HEADERS.length) sheet.insertColumnAfter(sheet.getMaxColumns());
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  styleHeaders_(sheet);
}

function styleHeaders_(sheet) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#111827').setFontColor('#ffffff');
}

function findExistingRow_(sheet, isoDate, seller, center) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  for (let i = 0; i < values.length; i++) {
    const rowDate = Utilities.formatDate(new Date(values[i][0]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (rowDate === isoDate && String(values[i][1]) === String(seller) && String(values[i][2]) === String(center)) return i + 2;
  }
  return null;
}

function validatePayload_(data) {
  const sellers = ['Donatella', 'Elena', 'Erika', 'Francesco', 'Ramses'];
  const centers = ['Futura Evo', 'Futura Fit'];
  if (!sellers.includes(data.seller)) throw new Error('Venditore non valido');
  if (!centers.includes(data.center)) throw new Error('Centro di competenza non valido');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date || '')) throw new Error('Data non valida');
}

function parseLocalDate_(iso) {
  const parts = iso.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
}

function n_(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}