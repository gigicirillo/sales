(()=>{
  const input=document.querySelector('input[name="passesVouchersDelivered"]');
  if(!input)return;
  input.id=input.id||'passesVouchersDelivered';
  const card=input.closest('.card');
  const grid=input.closest('.grid');
  let rows=document.getElementById('passVoucherRows');
  if(!rows){rows=document.createElement('div');rows.id='passVoucherRows';rows.className='subscription-rows pass-voucher-rows';grid.insertAdjacentElement('afterend',rows)}
  const style=document.createElement('style');
  style.textContent='.pass-voucher-rows{margin-top:6px}.pass-voucher-row{display:grid;grid-template-columns:minmax(180px,.8fr) minmax(220px,1.2fr);gap:6px;padding-top:6px;border-top:1px dashed rgba(100,116,139,.35)}.pass-voucher-row select,.pass-voucher-row input{width:100%}@media(max-width:620px){.pass-voucher-row{grid-template-columns:1fr}}';
  document.head.appendChild(style);
  const options=['Omaggio Compleanno','Porta un amico','Referral-Cliente','GPass Trainer'];
  function renderRows(){
    const count=Math.max(0,Math.min(50,parseInt(input.value,10)||0));
    const old=[...rows.querySelectorAll('.pass-voucher-row')].map(r=>({type:r.querySelector('[data-role="type"]')?.value||'',reference:r.querySelector('[data-role="reference"]')?.value||''}));
    rows.innerHTML='';
    for(let i=1;i<=count;i++){
      const row=document.createElement('div');row.className='pass-voucher-row';
      const typeField=document.createElement('div');typeField.className='field';
      const typeLabel=document.createElement('label');typeLabel.htmlFor=`passVoucherType${i}`;typeLabel.textContent=`Tipo Pass/Voucher ${i}`;
      const select=document.createElement('select');select.id=`passVoucherType${i}`;select.name=`passVoucherType${i}`;select.dataset.role='type';
      select.innerHTML='<option value="">Seleziona tipologia</option>'+options.map((o,idx)=>`<option value="${o}">${idx+1}. ${o}</option>`).join('');
      select.value=old[i-1]?.type||'';typeField.append(typeLabel,select);
      const refField=document.createElement('div');refField.className='field';
      const refLabel=document.createElement('label');refLabel.htmlFor=`passVoucherReference${i}`;refLabel.textContent=`Referenza Pass/Voucher Consegnato ${i}`;
      const ref=document.createElement('input');ref.type='text';ref.id=`passVoucherReference${i}`;ref.name=`passVoucherReference${i}`;ref.dataset.role='reference';ref.placeholder=`Referenza ${i}`;ref.value=old[i-1]?.reference||'';refField.append(refLabel,ref);
      row.append(typeField,refField);rows.appendChild(row);
    }
  }
  ['input','change','keyup'].forEach(evt=>input.addEventListener(evt,renderRows));renderRows();
  const patch=()=>{
    if(typeof getPayload!=='function'||!Array.isArray(sections)||typeof formatValue!=='function'){setTimeout(patch,30);return}
    if(window.__passVoucherPatched)return;window.__passVoucherPatched=true;
    const baseGetPayload=getPayload;
    getPayload=function(){const payload=baseGetPayload();const count=Math.max(0,parseInt(input.value,10)||0),details=[];for(let i=1;i<=count;i++)details.push({type:document.getElementById(`passVoucherType${i}`)?.value||'',reference:(document.getElementById(`passVoucherReference${i}`)?.value||'').trim()});payload.passVoucherDetails=details;return payload};
    const other=sections.find(s=>s[0]==='Altre azioni');if(other&&!other[1].some(x=>x[1]==='passVoucherDetails'))other[1].push(['Dettaglio Pass / Voucher Consegnati','passVoucherDetails']);
    const baseFormat=formatValue;
    formatValue=function(k,v){if(k==='passVoucherDetails')return Array.isArray(v)&&v.length?v.map((x,i)=>`${i+1}. ${x.type||'—'} | ${x.reference||'—'}`).join(' · '):'—';return baseFormat(k,v)};
    document.getElementById('newEntryButton')?.addEventListener('click',()=>setTimeout(()=>{rows.innerHTML='';renderRows()},0));
  };
  patch();
})();