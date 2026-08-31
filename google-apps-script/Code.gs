const SPREADSHEET_ID = '1u7puiT0sI9W2WYV3mbeYk_iBrRQhxSOiGbhlpXMCymw';

const CURRENT_HEADERS = [
  'Data','Venditore','Centro di competenza','Ora ingresso','Ora uscita','Ore lavorate',
  'Mess. inviati','Mess. di Compleanno inviati','Esiti messaggi compleanno',
  'Telefonate fatte','Telefonate risposte','Appuntamenti','Tour fatti',
  'Pass / Voucher Attivati','Pass / Voucher Consegnati',
  'Fatturato','Futura','Totale Incassato','Inc. POS','Inc. Contanti','Inc. Bonifico','Inc. Finanziamento',
  'Numero preventivi','Dettaglio preventivi',
  'Abbonamenti totali venduti','Dettaglio abbonamenti venduti',
  'Numero ratei','Dettaglio ratei','Note','Timestamp invio'
];

function doGet(e){
  try{
    if(!e||!e.parameter||e.parameter.action!=='report')return json_({ok:true,service:'Futura Sales API',schema:'2026-08-31'});
    const from=e.parameter.from||'',to=e.parameter.to||'',seller=e.parameter.seller||'all',center=e.parameter.center||'all';
    if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to))throw new Error('Intervallo date non valido');
    const ss=SpreadsheetApp.openById(SPREADSHEET_ID),rows=[];
    ss.getSheets().forEach(sheet=>{
      if(!/^\d{4}-\d{2}$/.test(sheet.getName())||sheet.getLastRow()<2)return;
      const values=sheet.getDataRange().getValues(),headers=values[0].map(String),index={};headers.forEach((h,i)=>index[h]=i);
      values.slice(1).forEach(row=>{
        const dateValue=row[index['Data']];if(!dateValue)return;
        const isoDate=Utilities.formatDate(new Date(dateValue),Session.getScriptTimeZone(),'yyyy-MM-dd');
        const rowSeller=String(row[index['Venditore']]||''),rowCenter=String(row[index['Centro di competenza']]||'');
        if(isoDate<from||isoDate>to)return;if(seller!=='all'&&rowSeller!==seller)return;if(center!=='all'&&rowCenter!==center)return;
        const legacyQuotes=cellNumber_(row,index,'Preventivi da telefonate')+cellNumber_(row,index,'Preventivi da tour fatti')+cellNumber_(row,index,'Preventivi organici');
        const currentQuotes=cellNumber_(row,index,'Numero preventivi');
        rows.push({
          date:isoDate,seller:rowSeller,center:rowCenter,
          entryTime:cellText_(row,index,'Ora ingresso'),exitTime:cellText_(row,index,'Ora uscita'),workedHours:cellNumber_(row,index,'Ore lavorate'),
          messagesSent:cellNumber_(row,index,'Mess. inviati'),birthdayMessagesSent:cellNumber_(row,index,'Mess. di Compleanno inviati'),birthdayOutcomes:parseArray_(cellText_(row,index,'Esiti messaggi compleanno')),
          callsMade:cellNumber_(row,index,'Telefonate fatte'),callsAnswered:cellNumber_(row,index,'Telefonate risposte'),appointmentsFromCalls:firstNumber_(row,index,['Appuntamenti','Appuntamenti da telefonate']),toursDone:cellNumber_(row,index,'Tour fatti'),
          passesVouchersActivated:cellNumber_(row,index,'Pass / Voucher Attivati'),passesVouchersDelivered:cellNumber_(row,index,'Pass / Voucher Consegnati'),
          revenue:cellNumber_(row,index,'Fatturato'),futuraAmount:cellNumber_(row,index,'Futura'),totalCollected:cellNumber_(row,index,'Totale Incassato'),collectedPos:cellNumber_(row,index,'Inc. POS'),collectedCash:cellNumber_(row,index,'Inc. Contanti'),collectedBank:cellNumber_(row,index,'Inc. Bonifico'),collectedFinance:cellNumber_(row,index,'Inc. Finanziamento'),
          quotesTotal:currentQuotes||legacyQuotes,quotes:parseArray_(cellText_(row,index,'Dettaglio preventivi')),
          soldSubscriptionsTotal:cellNumber_(row,index,'Abbonamenti totali venduti'),soldSubscriptions:parseArray_(cellText_(row,index,'Dettaglio abbonamenti venduti')),
          installmentsTotal:cellNumber_(row,index,'Numero ratei'),installments:parseArray_(cellText_(row,index,'Dettaglio ratei')),notes:cellText_(row,index,'Note')
        });
      });
    });
    rows.sort((a,b)=>a.date.localeCompare(b.date)||a.seller.localeCompare(b.seller));
    return json_({ok:true,rows:rows});
  }catch(error){return json_({ok:false,error:error.message});}
}

function doPost(e){
  try{
    const data=JSON.parse(e.postData.contents);validatePayload_(data);
    const ss=SpreadsheetApp.openById(SPREADSHEET_ID),date=parseLocalDate_(data.date),monthName=Utilities.formatDate(date,Session.getScriptTimeZone(),'yyyy-MM');
    let sheet=ss.getSheetByName(monthName);
    if(!sheet){sheet=ss.insertSheet(monthName);sheet.getRange(1,1,1,CURRENT_HEADERS.length).setValues([CURRENT_HEADERS]);styleHeaders_(sheet);}else ensureHeaders_(sheet);
    const map={
      'Data':date,'Venditore':data.seller,'Centro di competenza':data.center,'Ora ingresso':String(data.entryTime||''),'Ora uscita':String(data.exitTime||''),'Ore lavorate':calculateWorkedHours_(data.entryTime,data.exitTime),
      'Mess. inviati':n_(data.messagesSent),'Mess. di Compleanno inviati':n_(data.birthdayMessagesSent),'Esiti messaggi compleanno':JSON.stringify(Array.isArray(data.birthdayOutcomes)?data.birthdayOutcomes:[]),
      'Telefonate fatte':n_(data.callsMade),'Telefonate risposte':n_(data.callsAnswered),'Appuntamenti':n_(data.appointmentsFromCalls),'Tour fatti':n_(data.toursDone),
      'Pass / Voucher Attivati':n_(data.passesVouchersActivated),'Pass / Voucher Consegnati':n_(data.passesVouchersDelivered),
      'Fatturato':n_(data.revenue),'Futura':n_(data.futuraAmount),'Totale Incassato':n_(data.totalCollected),'Inc. POS':n_(data.collectedPos),'Inc. Contanti':n_(data.collectedCash),'Inc. Bonifico':n_(data.collectedBank),'Inc. Finanziamento':n_(data.collectedFinance),
      'Numero preventivi':n_(data.quotesTotal),'Dettaglio preventivi':JSON.stringify(Array.isArray(data.quotes)?data.quotes:[]),
      'Abbonamenti totali venduti':n_(data.soldSubscriptionsTotal),'Dettaglio abbonamenti venduti':JSON.stringify(Array.isArray(data.soldSubscriptions)?data.soldSubscriptions:[]),
      'Numero ratei':n_(data.installmentsTotal),'Dettaglio ratei':JSON.stringify(Array.isArray(data.installments)?data.installments:[]),'Note':String(data.notes||''),'Timestamp invio':new Date()
    };
    const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(String);
    const row=headers.map(h=>Object.prototype.hasOwnProperty.call(map,h)?map[h]:'');
    const existingRow=findExistingRow_(sheet,data.date,data.seller,data.center);
    if(existingRow)sheet.getRange(existingRow,1,1,row.length).setValues([row]);else sheet.appendRow(row);
    formatSheet_(sheet,headers);sheet.autoResizeColumns(1,headers.length);
    return json_({ok:true,sheet:monthName,updated:Boolean(existingRow),schema:'2026-08-31'});
  }catch(error){return json_({ok:false,error:error.message});}
}

function ensureHeaders_(sheet){
  let headers=sheet.getRange(1,1,1,Math.max(sheet.getLastColumn(),1)).getValues()[0].map(String);
  CURRENT_HEADERS.forEach(header=>{
    if(headers.indexOf(header)<0){sheet.insertColumnAfter(sheet.getLastColumn());sheet.getRange(1,sheet.getLastColumn()).setValue(header);headers.push(header);}
  });
  styleHeaders_(sheet);
}
function styleHeaders_(sheet){sheet.setFrozenRows(1);sheet.getRange(1,1,1,sheet.getLastColumn()).setFontWeight('bold').setBackground('#111827').setFontColor('#ffffff');}
function formatSheet_(sheet,headers){
  const rows=Math.max(sheet.getLastRow()-1,1);
  const setFormat=(header,format)=>{const i=headers.indexOf(header);if(i>=0)sheet.getRange(2,i+1,rows,1).setNumberFormat(format);};
  setFormat('Data','dd/MM/yyyy');setFormat('Ore lavorate','0.00');
  ['Fatturato','Futura','Totale Incassato','Inc. POS','Inc. Contanti','Inc. Bonifico','Inc. Finanziamento'].forEach(h=>setFormat(h,'€ #,##0.00'));
  setFormat('Timestamp invio','dd/MM/yyyy HH:mm:ss');
}
function findExistingRow_(sheet,isoDate,seller,center){
  const lastRow=sheet.getLastRow();if(lastRow<2)return null;
  const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(String),di=headers.indexOf('Data'),si=headers.indexOf('Venditore'),ci=headers.indexOf('Centro di competenza');
  if(di<0||si<0||ci<0)return null;
  const values=sheet.getRange(2,1,lastRow-1,sheet.getLastColumn()).getValues();
  for(let i=0;i<values.length;i++){const rowDate=Utilities.formatDate(new Date(values[i][di]),Session.getScriptTimeZone(),'yyyy-MM-dd');if(rowDate===isoDate&&String(values[i][si])===String(seller)&&String(values[i][ci])===String(center))return i+2;}return null;
}
function firstNumber_(row,index,headers){for(const h of headers){if(index[h]!==undefined)return n_(row[index[h]]);}return 0;}
function cellNumber_(row,index,header){const i=index[header];return i===undefined?0:n_(row[i]);}
function cellText_(row,index,header){const i=index[header];return i===undefined?'':String(row[i]||'');}
function parseArray_(value){try{const parsed=JSON.parse(value||'[]');return Array.isArray(parsed)?parsed:[]}catch(e){return value?[value]:[]}}
function calculateWorkedHours_(entryTime,exitTime){if(!entryTime||!exitTime)return 0;const start=String(entryTime).split(':').map(Number),end=String(exitTime).split(':').map(Number);if(start.length<2||end.length<2)return 0;let minutes=(end[0]*60+end[1])-(start[0]*60+start[1]);if(minutes<0)minutes+=1440;return Number((minutes/60).toFixed(2));}
function validatePayload_(data){const sellers=['Donatella','Elena','Erika','Francesco','Ramses'],centers=['Futura Evo','Futura Fit'];if(!sellers.includes(data.seller))throw new Error('Venditore non valido');if(!centers.includes(data.center))throw new Error('Centro di competenza non valido');if(!/^\d{4}-\d{2}-\d{2}$/.test(data.date||''))throw new Error('Data non valida');if(data.entryTime&&!/^\d{2}:\d{2}$/.test(data.entryTime))throw new Error('Ora ingresso non valida');if(data.exitTime&&!/^\d{2}:\d{2}$/.test(data.exitTime))throw new Error('Ora uscita non valida');}
function parseLocalDate_(iso){const parts=iso.split('-').map(Number);return new Date(parts[0],parts[1]-1,parts[2],12,0,0);}
function n_(value){const number=Number(value);return Number.isFinite(number)&&number>=0?number:0;}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
