const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('google-apps-script/Code.gs','utf8');
class Sheet {
  constructor(headers,rows=[],capacity=headers.length){this.cells=[Array.from(headers),...rows.map(r=>r.slice())];this.capacity=capacity;this.insertions=0;}
  getLastColumn(){return Math.max(0,...this.cells.map(r=>r.reduce((last,v,i)=>v!==''&&v!=null?i+1:last,0)));}
  getMaxColumns(){return this.capacity;}
  getLastRow(){return this.cells.length;}
  getSheetId(){return 1;}
  getName(){return '2026-09';}
  insertColumnsAfter(at,count){this.capacity+=count;this.insertions+=count;}
  insertColumnAfter(at){this.insertColumnsAfter(at,1);}
  setFrozenRows(){}
  autoResizeColumns(){}
  appendRow(row){this.cells.push(row.slice());}
  getDataRange(){return this.getRange(1,1,this.getLastRow(),this.getLastColumn());}
  getRange(r,c,h=1,w=1){
    const sheet=this;
    return {
      getValues(){return Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>sheet.cells[r-1+i]?.[c-1+j]??''));},
      setValues(values){values.forEach((row,i)=>row.forEach((v,j)=>{(sheet.cells[r-1+i]??=[])[c-1+j]=v}));return this;},
      setValue(value){return this.setValues([[value]]);},
      setFontWeight(){return this;},setBackground(){return this;},setFontColor(){return this;},setNumberFormat(){return this;}
    };
  }
}
function runtime(sheet){
  const context=vm.createContext({Date,console,SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet})},Session:{getScriptTimeZone:()=> 'UTC'},Utilities:{formatDate:(d,tz,pattern)=>d.toISOString().slice(0,pattern==='yyyy-MM'?7:10)},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>JSON.parse(text)})}});
  vm.runInContext(source,context);
  context.requireSession_=()=>({name:'Admin',role:'admin'});
  context.writeAuditLog_=()=>{};
  return context;
}
test('Header migration preserves the last populated column and uses existing capacity',()=>{
  const c=runtime();const headers=vm.runInContext('CURRENT_HEADERS',c).filter(h=>!['Ticket','Chiusura serale'].includes(h));
  const original=Array(headers.length).fill('');original[headers.indexOf('Timestamp invio')]=new Date('2026-09-29T20:58:16Z');
  const sheet=new Sheet(headers,[original],765);
  c.ensureHeaders_(sheet);
  assert.deepEqual(sheet.cells[1],original);
  assert.deepEqual(sheet.cells[0].slice(0,headers.length),Array.from(headers));
  assert.deepEqual(sheet.cells[0].slice(-2),['Chiusura serale','Ticket']);
  assert.equal(sheet.insertions,0);
  c.ensureHeaders_(sheet);assert.equal(sheet.getLastColumn(),35);assert.equal(sheet.insertions,0);
});
test('Migration expands a full grid once and handles an empty sheet',()=>{
  const c=runtime();const s=new Sheet(['Data']);c.ensureHeaders_(s);assert.equal(s.getLastColumn(),35);assert.equal(s.insertions,34);
  const empty=new Sheet([],[],26);c.ensureHeaders_(empty);assert.equal(empty.getLastColumn(),35);assert.equal(empty.cells[0][0],'Data');
});
test('Repeated Daily edits preserve distinct Ticket/Futura and a real timestamp',()=>{
  const c=runtime();const headers=vm.runInContext('CURRENT_HEADERS',c).filter(h=>!['Ticket','Chiusura serale'].includes(h));
  const sheet=new Sheet(headers,[],765);c.SpreadsheetApp={openById:()=>({getSheetByName:()=>sheet})};
  const payload={date:'2026-09-29',seller:'Donatella',center:'Futura Evo',closingEnabled:true,futuraAmount:539,ticket:29.9,totalCollected:1950,revenue:2329};
  for(const ticket of [29.9,0,42.8]){
    const result=c.doPost({postData:{contents:JSON.stringify({...payload,ticket})}});assert.equal(result.ok,true,result.error);
    const idx=Object.fromEntries(sheet.cells[0].map((h,i)=>[h,i]));
    assert.equal(sheet.cells.length,2);assert.equal(sheet.cells[1][idx.Ticket],ticket);assert.equal(sheet.cells[1][idx.Futura],539);assert.ok(sheet.cells[1][idx['Timestamp invio']] instanceof Date);
    const report=c.doGet({parameter:{action:'report',from:'2026-09-29',to:'2026-09-29',center:'all',seller:'all'}});
    assert.equal(report.rows[0].ticket,ticket);assert.equal(report.rows[0].futuraAmount,539);
  }
});
test('Unrecoverable receipts are null, legitimate 46000 euro amounts are not filtered heuristically',()=>{
  const c=runtime();for(const value of [null,undefined,'','DA VERIFICARE',new Date(),true])assert.equal(c.closingMoney_([value],{Ticket:0},'Ticket'),null);
  for(const value of [0,29.9,46294.87])assert.equal(c.closingMoney_([value],{Ticket:0},'Ticket'),value);
  assert.equal(c.n_(new Date()),0);
});
test('Enabled closing requires explicit finite amounts before writing',()=>{
  const c=runtime();const base={seller:'Donatella',center:'Futura Evo',date:'2026-09-29',closingEnabled:true,futuraAmount:0};
  for(const ticket of [null,undefined,'','bad',-1])assert.throws(()=>c.validatePayload_({...base,ticket}),/Importo chiusura/);
  c.validatePayload_({...base,ticket:0});
});
test('Operator financial cells keep their named positions even when amounts coincide',()=>{
  const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'all',addEventListener(){},textContent:'',innerHTML:''});return nodes.get(id)};
  const ctx=vm.createContext({window:{SALES_APP_CONFIG:{}},document:{getElementById:node,querySelector:node},URLSearchParams,Intl,Date,console});
  vm.runInContext(fs.readFileSync('operatore.js','utf8'),ctx);
  vm.runInContext(`reportIsAdmin=true;rows=[{date:'2026-09-29',seller:'Ramses',revenue:0,totalCollected:0,futuraAmount:0,ticket:42.8},{date:'2026-09-29',seller:'Edy',revenue:25,totalCollected:25,futuraAmount:25,ticket:null}];render()`,ctx);
  const html=node('#reportTable tbody').innerHTML;
  const data=[...html.matchAll(/<tr[^>]*>(.*?)<\/tr>/g)].map(x=>[...x[1].matchAll(/<td[^>]*>(.*?)<\/td>/g)].map(c=>c[1]));
  assert.match(data[0][12],/0,00/);assert.match(data[0][13],/0,00/);assert.match(data[0][14],/0,00/);assert.match(data[0][15],/42,80/);
  assert.match(data[1][12],/25,00/);assert.match(data[1][13],/0,00/);assert.match(data[1][14],/25,00/);assert.match(data[1][15],/0,00/);
  assert.doesNotMatch(node('#reportTable tfoot').innerHTML,/N\/D/);
});
test('Collected installments exclude unpaid, unknown and malformed amounts and do not inflate receipts',()=>{
  const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'all',addEventListener(){},textContent:'',innerHTML:''});return nodes.get(id)};
  const ctx=vm.createContext({window:{SALES_APP_CONFIG:{}},document:{getElementById:node,querySelector:node},URLSearchParams,Intl,Date,console});
  vm.runInContext(fs.readFileSync('operatore.js','utf8'),ctx);
  const installments=[{amount:120,status:'Rata ris.'},{amount:'30.50',status:'Rata ris.'},{amount:800,status:'Rata ins.'},{amount:40,status:''},{amount:-2,status:'Rata ris.'},{amount:'bad',status:'Rata ris.'},null];
  assert.equal(ctx.collectedInstallments({installments}),150.5);
  assert.equal(ctx.collectedInstallments({}),0);
  ctx.fixture=installments;
  vm.runInContext(`reportIsAdmin=true;rows=[{date:'2026-09-29',totalCollected:200,installments:fixture},{date:'2026-09-29',totalCollected:100,installments:[{amount:20,status:'Rata ris.'}]}];render()`,ctx);
  assert.match(node('#reportTable tbody').innerHTML,/<td class="ratei-col">150,50/);
  assert.match(node('#reportTable tfoot').innerHTML,/<td class="ratei-col">170,50/);
  assert.match(node('#reportTable tfoot').innerHTML,/<td class="incassato-col">300,00/);
  assert.doesNotMatch(node('#reportTable tbody').innerHTML,/N\/D/);
});
test('Installment column and CSV are admin-only, with hidden structural cells preserving sort indexes',()=>{
  for(const admin of [false,true]){
    const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'all',events:{},addEventListener(event,fn){this.events[event]=fn},textContent:'',innerHTML:''});return nodes.get(id)};
    let csv='';
    const ctx=vm.createContext({window:{SALES_APP_CONFIG:{}},document:{getElementById:node,querySelector:node,createElement:()=>({click(){}})},URLSearchParams,Intl,Date,console,Blob:class{constructor(parts){csv=parts.join('')}},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout(){}});
    vm.runInContext(fs.readFileSync('operatore.js','utf8'),ctx);
    vm.runInContext(`reportIsAdmin=${admin};rows=[{date:'2026-09-29',totalCollected:200,installments:[{amount:73.25,status:'Rata ris.'}]}];render()`,ctx);
    assert.equal(node('rateiHeader').hidden,!admin);
    assert.equal(node('#reportTable tbody').innerHTML.includes('73,25'),admin);
    assert.equal(node('#reportTable tfoot').innerHTML.includes('73,25'),admin);
    assert.equal((node('#reportTable tbody').innerHTML.match(/<td(?: |>|\b)/g)||[]).length,17);
    node('exportCsv').events.click();
    assert.equal(csv.includes('Inc. Ratei'),admin);
    assert.equal(csv.includes('73.25'),admin);
    const lines=csv.split('\r\n');assert.equal(lines[0].split(';').length,lines[1].split(';').length);
  }
});
