(()=>{
  const form=document.getElementById('salesForm');
  if(!form)return;
  let approvedKey='';
  const key=()=>`${document.getElementById('seller')?.value||''}|${document.getElementById('date')?.value||''}|${document.getElementById('center')?.value||''}`;
  const isEdit=()=>new URLSearchParams(location.search).has('editDate');
  function modal(){
    let el=document.getElementById('duplicateDailyModal');
    if(el)return el;
    el=document.createElement('div');el.id='duplicateDailyModal';el.className='duplicate-daily-modal';el.hidden=true;
    el.innerHTML='<div class="duplicate-daily-dialog" role="dialog" aria-modal="true" aria-labelledby="duplicateDailyTitle"><div class="duplicate-daily-icon">!</div><h2 id="duplicateDailyTitle">Daily già presente</h2><p id="duplicateDailyText"></p><div class="duplicate-daily-actions"><button type="button" id="duplicateDailyBack">Verifica la data</button><button type="button" id="duplicateDailyContinue">Continua comunque</button></div></div>';
    document.body.appendChild(el);return el;
  }
  function show(existing,onContinue){const el=modal(),seller=document.getElementById('seller')?.value||'',date=document.getElementById('date')?.value||'',center=document.getElementById('center')?.value||'';const [y,m,d]=date.split('-');el.querySelector('#duplicateDailyText').innerHTML=`Risulta già registrato un Daily per <strong>${seller}</strong>, centro <strong>${center}</strong>, con data di competenza <strong>${d}/${m}/${y}</strong>.<br><br>Verifica attentamente la <strong>Giornata di riferimento</strong> prima di procedere, per evitare di sovrascrivere o duplicare dati.`;el.hidden=false;el.querySelector('#duplicateDailyBack').onclick=()=>{el.hidden=true;document.getElementById('date')?.focus()};el.querySelector('#duplicateDailyContinue').onclick=()=>{el.hidden=true;onContinue()};
  }
  async function checkDuplicate(){
    if(isEdit())return false;
    const seller=document.getElementById('seller')?.value||'',date=document.getElementById('date')?.value||'',center=document.getElementById('center')?.value||'';
    if(!seller||!date||!center||!window.SALES_APP_CONFIG?.GOOGLE_SCRIPT_URL)return false;
    const token=window.SalesAuth?.getToken?.()||sessionStorage.getItem('salesAuthToken')||sessionStorage.getItem('sales_token')||'';
    const params=new URLSearchParams({action:'report',from:date,to:date,seller,center,token});
    try{const res=await fetch(`${window.SALES_APP_CONFIG.GOOGLE_SCRIPT_URL}?${params}`);const data=await res.json();return Boolean(data.ok&&Array.isArray(data.rows)&&data.rows.some(r=>r.date===date&&r.seller===seller&&r.center===center))}catch(_){return false}
  }
  form.addEventListener('submit',async e=>{
    if(e.__duplicateChecked||isEdit())return;
    const current=key();if(approvedKey===current){approvedKey='';return}
    e.preventDefault();e.stopImmediatePropagation();
    if(!form.reportValidity())return;
    const submit=document.getElementById('submitButton'),old=submit?.textContent;if(submit){submit.disabled=true;submit.textContent='Verifica Daily…'}
    const exists=await checkDuplicate();if(submit){submit.disabled=false;submit.textContent=old}
    const proceed=()=>{approvedKey=current;form.requestSubmit()};
    if(exists)show(true,proceed);else proceed();
  },true);
})();