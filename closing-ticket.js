(()=>{
  const form=document.getElementById('salesForm');
  const notesCard=document.querySelector('.card-notes');
  const futuraInput=form?.querySelector('input[name="futuraAmount"]');
  const futuraField=futuraInput?.closest('.field');
  if(!form||!notesCard||!futuraInput||!futuraField)return;

  const section=document.createElement('section');
  section.className='card card-evening-closing';
  section.innerHTML=`
    <div class="card-heading"><span>CS</span><h2>CHIUSURA SERALE - FUTURA E TICKET</h2></div>
    <label class="closing-toggle"><input id="eveningClosingEnabled" type="checkbox"> <span>Abilita chiusura serale</span></label>
    <div id="eveningClosingFields" class="grid grid-2" hidden>
      <div id="futuraFieldSlot"></div>
      <div class="field money-field"><label for="ticketAmount">Incasso Ticket</label><div class="currency-wrap"><span>€</span><input id="ticketAmount" name="ticket" type="number" min="0" step=".01" value="0"></div></div>
    </div>`;
  notesCard.insertAdjacentElement('afterend',section);

  const slot=section.querySelector('#futuraFieldSlot');
  slot.replaceWith(futuraField);
  const futuraLabel=futuraField.querySelector('label');if(futuraLabel)futuraLabel.textContent='Incasso Futura';
  const toggle=section.querySelector('#eveningClosingEnabled');
  const fields=section.querySelector('#eveningClosingFields');
  const ticketInput=section.querySelector('#ticketAmount');

  const style=document.createElement('style');
  style.textContent=`
    .card-evening-closing{background:#f8fafc;border:1px solid #cbd5e1;grid-column:1/-1}
    .card-evening-closing .card-heading span{background:#111827;color:#fff}
    .closing-toggle{display:inline-flex;align-items:center;gap:10px;font-weight:900;color:#111827;cursor:pointer;margin:2px 0 12px}
    .closing-toggle input{width:19px;height:19px;accent-color:#6d28d9}
    .card-evening-closing [hidden]{display:none!important}
    .card-evening-closing #eveningClosingFields{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    @media(max-width:620px){.card-evening-closing #eveningClosingFields{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function syncClosing(clearWhenOff=true){
    const enabled=toggle.checked;
    fields.hidden=!enabled;
    futuraInput.disabled=!enabled;
    ticketInput.disabled=!enabled;
    futuraInput.required=enabled;
    ticketInput.required=enabled;
    if(!enabled&&clearWhenOff){futuraInput.value='0';ticketInput.value='0';}
  }
  toggle.addEventListener('change',()=>syncClosing(true));
  syncClosing(true);

  try{
    const salesSection=sections.find(item=>item[0]==='Vendite');
    if(salesSection){const idx=salesSection[2].findIndex(item=>item[1]==='futuraAmount');if(idx>=0)salesSection[2].splice(idx,1);}
  }catch{}

  const baseGetPayload=getPayload;
  getPayload=function(){
    const payload=baseGetPayload();
    payload.closingEnabled=toggle.checked;
    payload.futuraAmount=toggle.checked?(Number(futuraInput.value)||0):0;
    payload.ticket=toggle.checked?(Number(ticketInput.value)||0):0;
    return payload;
  };

  const baseRenderSummary=renderSummary;
  renderSummary=function(target,payload){
    baseRenderSummary(target,payload);
    if(!payload?.closingEnabled)return;
    const formatMoney=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(v)||0);
    target.insertAdjacentHTML('beforeend',`<section class="summary-section" data-summary-box="closing"><h3>CHIUSURA SERALE - FUTURA E TICKET</h3><div class="summary-grid"><div class="summary-item"><span>Incasso Futura</span><strong>${formatMoney(payload.futuraAmount)}</strong></div><div class="summary-item"><span>Incasso Ticket</span><strong>${formatMoney(payload.ticket)}</strong></div></div></section>`);
  };

  form.addEventListener('reset',()=>setTimeout(()=>{toggle.checked=false;syncClosing(true)},0));
  window.SalesClosing={toggle,fields,ticketInput,futuraInput,syncClosing};
})();