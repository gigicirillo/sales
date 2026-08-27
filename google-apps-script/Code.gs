const SPREADSHEET_ID = '1u7puiT0sI9W2WYV3mbeYk_iBrRQhxSOiGbhlpXMCymw';

const HEADERS = [
  'Data', 'Venditore', 'Centro di competenza',
  'Ora ingresso', 'Ora uscita', 'Mess. inviati', 'Mess. di Compleanno inviati', 'Esiti messaggi compleanno',
  'Telefonate fatte', 'Telefonate risposte', 'Appuntamenti da telefonate', 'Preventivi da telefonate', 'Abbonamenti da telefonate',
  'Tour fatti', 'Preventivi da tour fatti', 'Abbonamenti da tour',
  'Preventivi organici', 'Abbonamenti da preventivi organici', 'Rinnovi organici',
  'Prove attivate', 'Pass / Voucher Consegnati', 'Pass / Voucher Attivati',
  'Fatturato', 'Futura',
  'Totale Incassato', 'Inc. POS', 'Inc. Contanti', 'Inc. Bonifico', 'Inc. Finanziamento',
  'Note', 'Timestamp invio'
];

function doGet(e) {
  try {
    if (!e || !e.parameter || e.parameter.action !== 'report') return json_({ ok: true, service: 'Futura Sales API' });
    const from = e.parameter.from || '', to = e.parameter.to || '', seller = e.parameter.seller || 'all', center = e.parameter.center || 'all';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) throw new Error('Intervallo date non valido');
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID), rows = [];
    ss.getSheets().forEach(sheet => {
      if (!/^\d{4}-\d{2}$/.test(sheet.getName()) || sheet.getLastRow() < 2) return;
      const values = sheet.getDataRange().getValues(), headers = values[0].map(String), index = {};
      headers.forEach((h,i)=>index[h]=i);
      values.slice(1).forEach(row => {
        const dateValue=row[index['Data']]; if(!dateValue) return;
        const isoDate=Utilities.formatDate(new Date(dateValue),Session.getScriptTimeZone(),'yyyy-MM-dd'), rowSeller=String(row[index['Venditore']]||''), rowCenter=String(row[index['Centro di competenza']]||'');
        if(isoDate<from||isoDate>to) return; if(seller!=='all'&&rowSeller!==seller) return; if(center!=='all'&&rowCenter!==center) return;
        rows.push({date:isoDate,seller:rowSeller,center:rowCenter,entryTime:cellText_(row,index,'Ora ingresso'),exitTime:cellText_(row,index,'Ora uscita'),messagesSent:cellNumber_(row,index,'Mess. inviati'),birthdayMessagesSent:cellNumber_(row,index,'Mess. di Compleanno inviati'),birthdayOutcomes:parseOutcomes_(cellText_(row,index,'Esiti messaggi compleanno')),callsMade:cellNumber_(row,index,'Telefonate fatte'),callsAnswered:cellNumber_(row,index,'Telefonate risposte'),appointmentsFromCalls:cellNumber_(row,index,'Appuntamenti da telefonate'),quotesFromCalls:cellNumber_(row,index,'Preventivi da telefonate'),subscriptionsFromCalls:cellNumber_(row,index,'Abbonamenti da telefonate'),toursDone:cellNumber_(row,index,'Tour fatti'),quotesFromTours:cellNumber_(row,index,'Preventivi da tour fatti'),subscriptionsFromTours:cellNumber_(row,index,'Abbonamenti da tour'),organicQuotes:cellNumber_(row,index,'Preventivi organici'),subscriptionsFromOrganicQuotes:cellNumber_(row,index,'Abbonamenti da preventivi organici'),organicRenewals:cellNumber_(row,index,'Rinnovi organici'),trialsActivated:cellNumber_(row,index,'Prove attivate'),passesVouchersDelivered:cellNumber_(row,index,'Pass / Voucher Consegnati'),passesVouchersActivated:cellNumber_(row,index,'Pass / Voucher Attivati'),revenue:cellNumber_(row,index,'Fatturato'),futuraAmount:cellNumber_(row,index,'Futura'),totalCollected:cellNumber_(row,index,'Totale Incassato'),collectedPos:cellNumber_(row,index,'Inc. POS'),collectedCash:cellNumber_(row,index,'Inc. Contanti'),collectedBank:cellNumber_(row,index,'Inc. Bonifico'),collectedFinance:cellNumber_(row,index,'Inc. Finanziamento')});
      });
    });
    rows.sort((a,b)=>a.date.localeCompare(b.date)||a.seller.localeCompare(b.seller));
    return json_({ok:true,rows:rows});
  } catch(error){return json_({ok:false,error:error.message});}
}

function doPost(e) {
  try {
    const data=JSON.parse(e.postData.contents); validatePayload_(data);
    const ss=SpreadsheetApp.openById(SPREADSHEET_ID), date=parseLocalDate_(data.date), monthName=Utilities.formatDate(date,Session.getScriptTimeZone(),'yyyy-MM');
    let sheet=ss.getSheetByName(monthName);
    if(!sheet){sheet=ss.insertSheet(monthName);sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);styleHeaders_(sheet);}else ensureHeaders_(sheet);
    const row=[date,data.seller,data.center,String(data.entryTime||''),String(data.exitTime||''),n_(data.messagesSent),n_(data.birthdayMessagesSent),JSON.stringify(Array.isArray(data.birthdayOutcomes)?data.birthdayOutcomes:[]),n_(data.callsMade),n_(data.callsAnswered),n_(data.appointmentsFromCalls),n_(data.quotesFromCalls),n_(data.subscriptionsFromCalls),n_(data.toursDone),n_(data.quotesFromTours),n_(data.subscriptionsFromTours),n_(data.organicQuotes),n_(data.subscriptionsFromOrganicQuotes),n_(data.organicRenewals),n_(data.trialsActivated),n_(data.passesVouchersDelivered),n_(data.passesVouchersActivated),n_(data.revenue),n_(data.futuraAmount),n_(data.totalCollected),n_(data.collectedPos),n_(data.collectedCash),n_(data.collectedBank),n_(data.collectedFinance),String(data.notes||''),new Date()];
    const existingRow=findExistingRow_(sheet,data.date,data.seller,data.center); if(existingRow)sheet.getRange(existingRow,1,1,row.length).setValues([row]);else sheet.appendRow(row);
    const rows=Math.max(sheet.getLastRow()-1,1); sheet.getRange(2,1,rows,1).setNumberFormat('dd/MM/yyyy'); sheet.getRange(2,23,rows,7).setNumberFormat('€ #,##0.00'); sheet.getRange(2,31,rows,1).setNumberFormat('dd/MM/yyyy HH:mm:ss'); sheet.autoResizeColumns(1,HEADERS.length);
    return json_({ok:true,sheet:monthName,updated:Boolean(existingRow)});
  } catch(error){return json_({ok:false,error:error.message});}
}

function cellNumber_(row,index,header){const i=index[header];return i===undefined?0:n_(row[i]);}
function cellText_(row,index,header){const i=index[header];return i===undefined?'':String(row[i]||'');}
function parseOutcomes_(value){try{const parsed=JSON.parse(value||'[]');return Array.isArray(parsed)?parsed:[]}catch(e){return value?[value]:[]}}
function ensureHeaders_(sheet){
  while(sheet.getMaxColumns()<HEADERS.length)sheet.insertColumnAfter(sheet.getMaxColumns());
  let current=sheet.getRange(1,1,1,Math.max(sheet.getLastColumn(),HEADERS.length)).getValues()[0];
  if(current[2]!=='Centro di competenza')sheet.insertColumnAfter(2);
  current=sheet.getRange(1,1,1,Math.max(sheet.getLastColumn(),HEADERS.length)).getValues()[0];
  if(current[3]!=='Ora ingresso'){sheet.insertColumnsAfter(3,5);current=sheet.getRange(1,1,1,Math.max(sheet.getLastColumn(),HEADERS.length)).getValues()[0];}
  const oldGuestPassIndex=current.indexOf('Guest pass consegnati');
  if(oldGuestPassIndex>=0){sheet.getRange(1,oldGuestPassIndex+1).setValue('Pass / Voucher Consegnati');sheet.insertColumnAfter(oldGuestPassIndex+1);}else if(current.indexOf('Pass / Voucher Consegnati')>=0&&current.indexOf('Pass / Voucher Attivati')<0){sheet.insertColumnAfter(current.indexOf('Pass / Voucher Consegnati')+1);}
  while(sheet.getMaxColumns()<HEADERS.length)sheet.insertColumnAfter(sheet.getMaxColumns()); sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]); styleHeaders_(sheet);
}
function styleHeaders_(sheet){sheet.setFrozenRows(1);sheet.getRange(1,1,1,HEADERS.length).setFontWeight('bold').setBackground('#111827').setFontColor('#ffffff');}
function findExistingRow_(sheet,isoDate,seller,center){const lastRow=sheet.getLastRow();if(lastRow<2)return null;const values=sheet.getRange(2,1,lastRow-1,3).getValues();for(let i=0;i<values.length;i++){const rowDate=Utilities.formatDate(new Date(values[i][0]),Session.getScriptTimeZone(),'yyyy-MM-dd');if(rowDate===isoDate&&String(values[i][1])===String(seller)&&String(values[i][2])===String(center))return i+2;}return null;}
function validatePayload_(data){const sellers=['Donatella','Elena','Erika','Francesco','Ramses'],centers=['Futura Evo','Futura Fit'];if(!sellers.includes(data.seller))throw new Error('Venditore non valido');if(!centers.includes(data.center))throw new Error('Centro di competenza non valido');if(!/^\d{4}-\d{2}-\d{2}$/.test(data.date||''))throw new Error('Data non valida');if(data.entryTime&&!/^\d{2}:\d{2}$/.test(data.entryTime))throw new Error('Ora ingresso non valida');if(data.exitTime&&!/^\d{2}:\d{2}$/.test(data.exitTime))throw new Error('Ora uscita non valida');}
function parseLocalDate_(iso){const parts=iso.split('-').map(Number);return new Date(parts[0],parts[1]-1,parts[2],12,0,0);}
function n_(value){const number=Number(value);return Number.isFinite(number)&&number>=0?number:0;}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}