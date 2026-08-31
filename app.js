const form=document.getElementById('salesForm');
const dateInput=document.getElementById('date');
const formMessage=document.getElementById('formMessage');
const connectionStatus=document.getElementById('connectionStatus');
const entryView=document.getElementById('entryView');
const reviewView=document.getElementById('reviewView');
const successView=document.getElementById('successView');
const reviewSummary=document.getElementById('reviewSummary');
const successSummary=document.getElementById('successSummary');
const backButton=document.getElementById('backButton');
const confirmButton=document.getElementById('confirmButton');
const newEntryButton=document.getElementById('newEntryButton');
const reviewMessage=document.getElementById('reviewMessage');
const sentTime=document.getElementById('sentTime');
const downloadJpgButton=document.getElementById('downloadJpgButton');
const downloadMessage=document.getElementById('downloadMessage');
const birthdayMessagesSent=document.getElementById('birthdayMessagesSent');
const birthdayOutcomes=document.getElementById('birthdayOutcomes');
const quotesTotal=document.getElementById('quotesTotal');
const quotesRows=document.getElementById('quotesRows');
const soldSubscriptionsTotal=document.getElementById('soldSubscriptionsTotal');
const soldSubscriptionsRows=document.getElementById('soldSubscriptionsRows');
const installmentsTotal=document.getElementById('installmentsTotal');
const installmentsRows=document.getElementById('installmentsRows');
const totalCollected=document.getElementById('totalCollected');
let pendingPayload=null,lastSentAt=null;

const customerTypes=[
  ['', 'Seleziona tipo cliente'],
  ['Rinnovo','1. Rinnovo'],
  ['ExCliente-Tmk','2. ExCliente-Tmk'],
  ['ExCliente-Spont.','3. ExCliente-Spont.'],
  ['Tour/Spont.','3. Tour/Spont.'],
  ['Cliente-Ups','4. Cliente-Ups'],
  ['Prova','5. Prova']
];
const quoteTypes=customerTypes.filter(([value])=>value!=='Prova').map(([value,label])=>[value,label.replace('tipo cliente','tipo preventivo')]);
const customerSources=[
  ['', 'Seleziona fonte cliente'],
  ['Email-Newsletter','Email-Newsletter'],['Facebook','Facebook'],['Google','Google'],['Instagram','Instagram'],['Messenger','Messenger'],['Sito web','Sito web'],['TikTok','TikTok'],['WhatsApp','WhatsApp'],
  ['Amico che frequenta','Amico che frequenta'],['Passaparola','Passaparola'],['Vista di passaggio','Vista di passaggio'],['Evento','Evento'],['Iniziative Referals','Iniziative Referals'],['Invito','Invito'],['Quotidiani Riviste','Quotidiani Riviste'],['Settimana Gratuita Evento','Settimana Gratuita Evento'],['Settimana Gratuita Staff','Settimana Gratuita Staff'],['Televisione','Televisione'],['Volantino','Volantino']
];

const localToday=new Date();
localToday.setMinutes(localToday.getMinutes()-localToday.getTimezoneOffset());
dateInput.value=localToday.toISOString().slice(0,10);
const endpoint=window.SALES_APP_CONFIG?.GOOGLE_SCRIPT_URL?.trim();
connectionStatus.textContent=endpoint?'Google Sheet collegato':'Da collegare a Google Sheet';

function numberValue(d,k){const v=Number(d.get(k));return Number.isFinite(v)?v:0}
function selectWithOptions(id,name,options,value=''){
  const select=document.createElement('select');select.id=id;select.name=name;
  options.forEach(([v,t])=>{const option=document.createElement('option');option.value=v;option.textContent=t;select.appendChild(option)});
  select.value=value||'';return select;
}

const entryTimeInput=form.querySelector('input[name="entryTime"]');
const exitTimeInput=form.querySelector('input[name="exitTime"]');
const workedHoursInput=document.getElementById('workedHours');
function calculateWorkedHours(){
  if(!entryTimeInput||!exitTimeInput||!workedHoursInput)return 0;
  const start=entryTimeInput.value,end=exitTimeInput.value;
  if(!start||!end){workedHoursInput.value='0,00 h';return 0}
  const[sh,sm]=start.split(':').map(Number),[eh,em]=end.split(':').map(Number);
  let minutes=(eh*60+em)-(sh*60+sm);if(minutes<0)minutes+=1440;
  const hours=minutes/60;workedHoursInput.value=`${hours.toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2})} h`;return Number(hours.toFixed(2));
}
['input','change'].forEach(evt=>{entryTimeInput?.addEventListener(evt,calculateWorkedHours);exitTimeInput?.addEventListener(evt,calculateWorkedHours)});
calculateWorkedHours();

function updateCollected(){
  const ids=['collectedPos','collectedCash','collectedBank','collectedFinance'];
  const sum=ids.reduce((s,id)=>s+(Number(document.getElementById(id)?.value)||0),0);
  if(totalCollected)totalCollected.value=sum.toFixed(2);
}
['collectedPos','collectedCash','collectedBank','collectedFinance'].forEach(id=>{const el=document.getElementById(id);['input','change'].forEach(evt=>el?.addEventListener(evt,updateCollected))});
updateCollected();

function renderBirthdayOutcomeFields(){
  if(!birthdayMessagesSent||!birthdayOutcomes)return;
  const count=Math.max(0,Math.min(50,parseInt(birthdayMessagesSent.value,10)||0));
  const old=[...birthdayOutcomes.querySelectorAll('input[type="text"]')].map(i=>i.value);
  birthdayOutcomes.innerHTML='';
  for(let i=1;i<=count;i++){
    const field=document.createElement('div');field.className='field';
    const label=document.createElement('label');label.htmlFor=`birthdayOutcome${i}`;label.textContent=`Esito mes. ${i}`;
    const input=document.createElement('input');input.type='text';input.id=`birthdayOutcome${i}`;input.name=`birthdayOutcome${i}`;input.placeholder=`Esito messaggio ${i}`;input.value=old[i-1]||'';
    field.append(label,input);birthdayOutcomes.appendChild(field);
  }
}
['input','change','keyup'].forEach(evt=>birthdayMessagesSent?.addEventListener(evt,renderBirthdayOutcomeFields));
renderBirthdayOutcomeFields();

function renderQuoteRows(){
  if(!quotesTotal||!quotesRows)return;
  const count=Math.max(0,Math.min(50,parseInt(quotesTotal.value,10)||0));
  const old=[...quotesRows.querySelectorAll('select')].map(s=>s.value);
  quotesRows.innerHTML='';
  for(let i=1;i<=count;i++){
    const row=document.createElement('div');row.className='quote-row';
    const field=document.createElement('div');field.className='field';
    const label=document.createElement('label');label.htmlFor=`quoteType${i}`;label.textContent=`Tipo preventivo ${i}`;
    field.append(label,selectWithOptions(`quoteType${i}`,`quoteType${i}`,quoteTypes,old[i-1]));row.appendChild(field);quotesRows.appendChild(row);
  }
}
['input','change','keyup'].forEach(evt=>quotesTotal?.addEventListener(evt,renderQuoteRows));
renderQuoteRows();

function renderSoldSubscriptionRows(){
  if(!soldSubscriptionsTotal||!soldSubscriptionsRows)return;
  const count=Math.max(0,Math.min(50,parseInt(soldSubscriptionsTotal.value,10)||0));
  const old=[...soldSubscriptionsRows.querySelectorAll('.subscription-row')].map(row=>[...row.querySelectorAll('input,select')].map(i=>i.value));
  soldSubscriptionsRows.innerHTML='';
  for(let i=1;i<=count;i++){
    const row=document.createElement('div');row.className='subscription-row';
    const fields=[['Tipo di Abbon.','subscriptionType'],['Tipo cliente','customerType'],['Fonte cliente','customerSource']];
    fields.forEach(([labelText,key],idx)=>{
      const field=document.createElement('div');field.className='field';
      const label=document.createElement('label');label.htmlFor=`${key}${i}`;label.textContent=`${labelText} ${i}`;
      let control;
      if(key==='customerType')control=selectWithOptions(`${key}${i}`,`${key}${i}`,customerTypes,old[i-1]?.[idx]);
      else if(key==='customerSource')control=selectWithOptions(`${key}${i}`,`${key}${i}`,customerSources,old[i-1]?.[idx]);
      else{control=document.createElement('input');control.type='text';control.id=`${key}${i}`;control.name=`${key}${i}`;control.placeholder=`${labelText} ${i}`;control.value=old[i-1]?.[idx]||''}
      field.append(label,control);row.appendChild(field);
    });
    soldSubscriptionsRows.appendChild(row);
  }
}
['input','change','keyup'].forEach(evt=>soldSubscriptionsTotal?.addEventListener(evt,renderSoldSubscriptionRows));
renderSoldSubscriptionRows();

function renderInstallments(){
  if(!installmentsTotal||!installmentsRows)return;
  const count=Math.max(0,Math.min(50,parseInt(installmentsTotal.value,10)||0));
  const old=[...installmentsRows.querySelectorAll('.installment-row')].map(row=>({amount:row.querySelector('[data-role="amount"]')?.value||'',user:row.querySelector('[data-role="user"]')?.value||'',status:row.querySelector('input[type="radio"]:checked')?.value||''}));
  installmentsRows.innerHTML='';
  for(let i=1;i<=count;i++){
    const row=document.createElement('div');row.className='installment-row';
    row.innerHTML=`<div class="field money-field"><label for="installmentAmount${i}">Importo Rata ${i}</label><div class="currency-wrap"><span>€</span><input data-role="amount" id="installmentAmount${i}" name="installmentAmount${i}" type="number" min="0" step="0.01" value="${old[i-1]?.amount||''}"></div></div><div class="field"><label for="installmentUser${i}">Utente ${i}</label><input data-role="user" id="installmentUser${i}" name="installmentUser${i}" type="text" value="${old[i-1]?.user||''}" placeholder="Utente ${i}"></div><div class="field"><label>Stato ${i}</label><div class="installment-status"><label><input type="radio" name="installmentStatus${i}" value="Rata ins." ${old[i-1]?.status==='Rata ins.'?'checked':''}> Rata ins.</label><label><input type="radio" name="installmentStatus${i}" value="Rata ris." ${old[i-1]?.status==='Rata ris.'?'checked':''}> Rata ris.</label></div></div>`;
    installmentsRows.appendChild(row);
  }
}
['input','change','keyup'].forEach(evt=>installmentsTotal?.addEventListener(evt,renderInstallments));
renderInstallments();

function getPayload(){
  const d=new FormData(form);
  const birthdayCount=numberValue(d,'birthdayMessagesSent'),birthdayOutcomeList=[];
  for(let i=1;i<=birthdayCount;i++)birthdayOutcomeList.push((d.get(`birthdayOutcome${i}`)||'').trim());
  const quoteCount=numberValue(d,'quotesTotal'),quotes=[];
  for(let i=1;i<=quoteCount;i++)quotes.push({type:(d.get(`quoteType${i}`)||'').trim()});
  const soldCount=numberValue(d,'soldSubscriptionsTotal'),soldSubscriptions=[];
  for(let i=1;i<=soldCount;i++)soldSubscriptions.push({subscriptionType:(d.get(`subscriptionType${i}`)||'').trim(),customerType:(d.get(`customerType${i}`)||'').trim(),customerSource:(d.get(`customerSource${i}`)||'').trim()});
  const installmentCount=numberValue(d,'installmentsTotal'),installments=[];
  for(let i=1;i<=installmentCount;i++)installments.push({amount:numberValue(d,`installmentAmount${i}`),user:(d.get(`installmentUser${i}`)||'').trim(),status:d.get(`installmentStatus${i}`)||''});
  return{
    seller:d.get('seller'),date:d.get('date'),center:d.get('center'),entryTime:d.get('entryTime')||'',exitTime:d.get('exitTime')||'',workedHours:calculateWorkedHours(),
    messagesSent:numberValue(d,'messagesSent'),birthdayMessagesSent:birthdayCount,birthdayOutcomes:birthdayOutcomeList,
    callsMade:numberValue(d,'callsMade'),callsAnswered:numberValue(d,'callsAnswered'),appointmentsFromCalls:numberValue(d,'appointmentsFromCalls'),toursDone:numberValue(d,'toursDone'),
    passesVouchersActivated:numberValue(d,'passesVouchersActivated'),passesVouchersDelivered:numberValue(d,'passesVouchersDelivered'),
    revenue:numberValue(d,'revenue'),futuraAmount:numberValue(d,'futuraAmount'),totalCollected:numberValue(d,'totalCollected'),collectedPos:numberValue(d,'collectedPos'),collectedCash:numberValue(d,'collectedCash'),collectedBank:numberValue(d,'collectedBank'),collectedFinance:numberValue(d,'collectedFinance'),
    quotesTotal:quoteCount,quotes,soldSubscriptionsTotal:soldCount,soldSubscriptions,installmentsTotal:installmentCount,installments,notes:(d.get('notes')||'').trim()
  };
}

const sections=[
  ['Dati giornata',[['Venditore','seller'],['Data','date'],['Centro di competenza','center']]],
  ['Operatore',[['Ora ingresso','entryTime'],['Ora uscita','exitTime'],['Ore lavorate','workedHours']]],
  ['Azioni da Messaggi',[['Mess. inviati','messagesSent'],['Mess. di Compleanno inviati','birthdayMessagesSent'],['Esiti messaggi compleanno','birthdayOutcomes']]],
  ['Azioni da telefonate e tour',[['Telefonate fatte','callsMade'],['Telefonate risposte','callsAnswered'],['Appuntamenti','appointmentsFromCalls'],['Tour fatti','toursDone']]],
  ['Altre azioni',[['Pass / Voucher Attivati','passesVouchersActivated'],['Pass / Voucher Consegnati','passesVouchersDelivered']]],
  ['Vendite',[['Fatturato','revenue'],['Incassato Futura','futuraAmount']]],
  ['Incassato',[['Totale Incassato','totalCollected'],['Inc. POS','collectedPos'],['Inc. Contanti','collectedCash'],['Inc. Bonifico','collectedBank'],['Inc. Finanziamento','collectedFinance']]],
  ['Preventivi',[['Numero preventivi','quotesTotal'],['Dettaglio preventivi','quotes']]],
  ['Abbonamenti Venduti',[['Abbonamenti totali venduti','soldSubscriptionsTotal'],['Dettaglio abbonamenti','soldSubscriptions']]],
  ['Ratei',[['Numero ratei','installmentsTotal'],['Dettaglio ratei','installments']]],
  ['Note',[['Note','notes']]]
];

const moneyKeys=['revenue','futuraAmount','totalCollected','collectedPos','collectedCash','collectedBank','collectedFinance'];
function formatValue(k,v){
  if(moneyKeys.includes(k))return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(v||0);
  if(k==='workedHours')return `${Number(v||0).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2})} h`;
  if(k==='date'){const[y,m,d]=String(v).split('-');return`${d}/${m}/${y}`}
  if(k==='birthdayOutcomes')return Array.isArray(v)&&v.length?v.map((x,i)=>`${i+1}. ${x||'—'}`).join(' · '):'—';
  if(k==='quotes')return Array.isArray(v)&&v.length?v.map((x,i)=>`${i+1}. ${x.type||'—'}`).join(' · '):'—';
  if(k==='soldSubscriptions')return Array.isArray(v)&&v.length?v.map((x,i)=>`${i+1}. ${x.subscriptionType||'—'} | ${x.customerType||'—'} | ${x.customerSource||'—'}`).join(' · '):'—';
  if(k==='installments')return Array.isArray(v)&&v.length?v.map((x,i)=>`${i+1}. € ${Number(x.amount||0).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2})} | ${x.user||'—'} | ${x.status||'—'}`).join(' · '):'—';
  return v||'—';
}
function renderSummary(target,payload){
  target.innerHTML=sections.map(([title,fields])=>`<section class="summary-section"><h3>${title}</h3><div class="summary-grid">${fields.map(([label,key])=>`<div class="summary-item${['notes','birthdayOutcomes','quotes','soldSubscriptions','installments'].includes(key)?' summary-note':''}"><span>${label}</span><strong>${formatValue(key,payload[key])}</strong></div>`).join('')}</div></section>`).join('');
}
function showView(view){entryView.hidden=true;reviewView.hidden=true;successView.hidden=true;view.hidden=false;window.scrollTo({top:0,behavior:'smooth'})}

form.addEventListener('submit',e=>{e.preventDefault();formMessage.className='form-message';formMessage.textContent='';if(!form.reportValidity())return;pendingPayload=getPayload();renderSummary(reviewSummary,pendingPayload);reviewMessage.textContent='';showView(reviewView)});
backButton.addEventListener('click',()=>showView(entryView));
confirmButton.addEventListener('click',async()=>{
  if(!pendingPayload)return;if(!endpoint){reviewMessage.textContent='Configurazione mancante del collegamento Google Sheet.';reviewMessage.className='form-message error';return}
  confirmButton.disabled=true;confirmButton.textContent='Invio in corso…';reviewMessage.textContent='';
  try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(pendingPayload)}),result=await response.json();if(!result.ok)throw new Error(result.error||'Errore durante il salvataggio');renderSummary(successSummary,pendingPayload);lastSentAt=new Date();sentTime.textContent=`INVIATO IL ${new Intl.DateTimeFormat('it-IT',{dateStyle:'full',timeStyle:'medium'}).format(lastSentAt)}`;downloadMessage.textContent='';showView(successView)}catch(error){reviewMessage.textContent=`Invio non riuscito: ${error.message}`;reviewMessage.className='form-message error'}finally{confirmButton.disabled=false;confirmButton.textContent='Conferma e invia'}
});
newEntryButton.addEventListener('click',()=>{
  const seller=pendingPayload?.seller||'',center=pendingPayload?.center||'';form.reset();document.getElementById('seller').value=seller;document.getElementById('center').value=center;dateInput.value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);form.querySelectorAll('input[type="number"]').forEach(i=>i.value='0');birthdayOutcomes.innerHTML='';quotesRows.innerHTML='';soldSubscriptionsRows.innerHTML='';installmentsRows.innerHTML='';calculateWorkedHours();updateCollected();pendingPayload=null;lastSentAt=null;showView(entryView);
});

function wrapText(ctx,text,maxWidth){const words=String(text||'—').split(/\s+/),lines=[];let line='';for(const word of words){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test}if(line)lines.push(line);return lines}
function drawRoundedRect(ctx,x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill()}
function generateSummaryJpg(payload){
  const width=1400,pad=54,sectionGap=18,headerH=150,colGap=14,cellH=74,usable=width-pad*2;let estimated=headerH+pad*2;
  for(const[,fields]of sections){estimated+=52+Math.ceil(fields.length/3)*cellH+sectionGap;if(fields.some(([,k])=>['notes','birthdayOutcomes','quotes','soldSubscriptions','installments'].includes(k)))estimated+=54}
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=Math.max(1200,estimated);const ctx=canvas.getContext('2d');ctx.fillStyle='#eef1f4';ctx.fillRect(0,0,canvas.width,canvas.height);drawRoundedRect(ctx,pad,pad,usable,headerH,22,'#111827');ctx.fillStyle='#dc2626';ctx.font='700 24px Arial';ctx.fillText(`INVIATO IL ${new Intl.DateTimeFormat('it-IT',{dateStyle:'full',timeStyle:'medium'}).format(lastSentAt||new Date())}`,pad+28,pad+40);ctx.fillStyle='#ffffff';ctx.font='700 38px Arial';ctx.fillText('Riepilogo dati inviati',pad+28,pad+88);ctx.fillStyle='#cbd5e1';ctx.font='22px Arial';ctx.fillText('Futura Clubs · Inserimento attività commerciali',pad+28,pad+122);
  let y=pad+headerH+sectionGap;const palette=['#f8fafc','#eaf2ff','#eefcf5','#eef2ff','#ecfeff','#f0fdf4','#fff7ed','#faf5ff','#fef2f2','#fffbe8','#f9fafb'];
  sections.forEach(([title,fields],sectionIndex)=>{const cols=fields.length===1?1:Math.min(3,fields.length),cellW=(usable-colGap*(cols-1))/cols;ctx.fillStyle='#6d28d9';ctx.font='700 20px Arial';ctx.fillText(title.toUpperCase(),pad,y+22);y+=34;for(let i=0;i<fields.length;i++){const[label,key]=fields[i],col=i%cols,row=Math.floor(i/cols),x=pad+col*(cellW+colGap),cy=y+row*cellH;drawRoundedRect(ctx,x,cy,cellW,cellH-8,14,palette[sectionIndex%palette.length]);ctx.fillStyle='#6b7280';ctx.font='17px Arial';ctx.fillText(label,x+16,cy+24);ctx.fillStyle='#111827';ctx.font='700 22px Arial';const value=formatValue(key,payload[key]);const lines=wrapText(ctx,value,cellW-32).slice(0,['notes','birthdayOutcomes','quotes','soldSubscriptions','installments'].includes(key)?3:2);lines.forEach((line,idx)=>ctx.fillText(line,x+16,cy+52+idx*23))}y+=Math.ceil(fields.length/cols)*cellH+sectionGap});return canvas;
}
downloadJpgButton.addEventListener('click',()=>{
  downloadMessage.className='form-message';downloadMessage.textContent='';if(!pendingPayload){downloadMessage.textContent='Nessun riepilogo disponibile da scaricare.';downloadMessage.classList.add('error');return}downloadJpgButton.disabled=true;const oldText=downloadJpgButton.innerHTML;downloadJpgButton.textContent='Creazione JPG…';
  try{const canvas=generateSummaryJpg(pendingPayload);canvas.toBlob(blob=>{if(!blob){downloadMessage.textContent='Impossibile generare il JPG.';downloadMessage.classList.add('error');downloadJpgButton.disabled=false;downloadJpgButton.innerHTML=oldText;return}const url=URL.createObjectURL(blob),link=document.createElement('a'),safeDate=(pendingPayload.date||'giornata').replaceAll('-',''),safeSeller=(pendingPayload.seller||'venditore').toLowerCase().replace(/\s+/g,'-');link.href=url;link.download=`riepilogo-${safeDate}-${safeSeller}.jpg`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);downloadMessage.textContent='JPG generato correttamente.';downloadMessage.classList.add('success');downloadJpgButton.disabled=false;downloadJpgButton.innerHTML=oldText},'image/jpeg',0.94)}catch(error){downloadMessage.textContent=`Impossibile creare il JPG: ${error.message}`;downloadMessage.classList.add('error');downloadJpgButton.disabled=false;downloadJpgButton.innerHTML=oldText}
});