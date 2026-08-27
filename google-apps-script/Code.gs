const SPREADSHEET_ID = 'INCOLLA_QUI_ID_GOOGLE_SHEET';

const HEADERS = [
  'Data', 'Venditore',
  'Telefonate fatte', 'Telefonate risposte', 'Appuntamenti da telefonate', 'Preventivi da telefonate', 'Abbonamenti da telefonate',
  'Tour fatti', 'Preventivi da tour fatti', 'Abbonamenti da tour',
  'Preventivi organici', 'Abbonamenti da preventivi organici', 'Rinnovi organici',
  'Prove attivate', 'Guest pass consegnati',
  'Fatturato', 'Incassato', 'Futurament', 'Timestamp invio'
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
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#111827').setFontColor('#ffffff');
      sheet.autoResizeColumns(1, HEADERS.length);
    }

    const row = [
      date, data.seller,
      n_(data.callsMade), n_(data.callsAnswered), n_(data.appointmentsFromCalls), n_(data.quotesFromCalls), n_(data.subscriptionsFromCalls),
      n_(data.toursDone), n_(data.quotesFromTours), n_(data.subscriptionsFromTours),
      n_(data.organicQuotes), n_(data.subscriptionsFromOrganicQuotes), n_(data.organicRenewals),
      n_(data.trialsActivated), n_(data.guestPasses),
      n_(data.revenue), n_(data.collected), n_(data.futureAmount), new Date()
    ];

    // Una sola riga per venditore/giorno: se esiste già, viene aggiornata.
    const existingRow = findExistingRow_(sheet, data.date, data.seller);
    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).setNumberFormat('dd/MM/yyyy');
    sheet.getRange(2, 16, Math.max(sheet.getLastRow() - 1, 1), 3).setNumberFormat('€ #,##0.00');
    sheet.getRange(2, 19, Math.max(sheet.getLastRow() - 1, 1), 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');

    return json_({ ok: true, sheet: monthName, updated: Boolean(existingRow) });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function findExistingRow_(sheet, isoDate, seller) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (let i = 0; i < values.length; i++) {
    const rowDate = Utilities.formatDate(new Date(values[i][0]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (rowDate === isoDate && String(values[i][1]) === String(seller)) return i + 2;
  }
  return null;
}

function validatePayload_(data) {
  const sellers = ['Donatella', 'Elena', 'Erika', 'Francesco', 'Ramses'];
  if (!sellers.includes(data.seller)) throw new Error('Venditore non valido');
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