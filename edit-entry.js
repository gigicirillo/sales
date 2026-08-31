(()=>{
  const params=new URLSearchParams(location.search);
  const editDate=params.get('editDate');
  const editSeller=params.get('editSeller');
  const editCenter=params.get('editCenter');
  if(!editDate||!editSeller||!editCenter)return;

  const endpoint=window.SALES_APP_CONFIG?.GOOGLE_SCRIPT_URL?.trim();
  const original={date:editDate,seller:editSeller,center:editCenter};

  const setValue=(name,value)=>{
    const el=document.querySelector(`[name="${name}"]`)||document.getElementById(name);
    if(el)el.value=value??'';
  };
  const fire=el=>{if(el){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}};

  async function preload(){
    const session=window.SalesAuth?.session();
    if(!endpoint||!session?.token)return;

    const authenticatedFetch=window.fetch.bind(window);
    window.fetch=async function(input,init={}){
      const url=typeof input==='string'?input:input?.url||'';
      if(endpoint&&url.startsWith(endpoint)&&(init.method||'GET').toUpperCase()==='POST'&&typeof init.body==='string'){
        try{
          const body=JSON.parse(init.body);
          if(!body.action){
            body.originalDate=original.date;
            body.originalSeller=original.seller;
            body.originalCenter=original.center;
            init={...init,body:JSON.stringify(body)};
          }
        }catch{}
      }
      return authenticatedFetch(input,init);
    };

    const newEntry=document.getElementById('newEntryButton');
    newEntry?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();location.href='index.html';},{capture:true});

    const status=document.getElementById('connectionStatus');
    if(status)status.textContent='Caricamento modifica…';
    try{
      const q=new URLSearchParams({action:'report',from:editDate,to:editDate,seller:editSeller,center:editCenter,token:session.token});
      const res=await authenticatedFetch(`${endpoint}?${q}`);
      const data=await res.json();
      if(!data.ok)throw new Error(data.error||'Errore caricamento dati');
      const row=(data.rows||[]).find(r=>r.date===editDate&&r.center===editCenter&&(data.user?.role==='admin'?r.seller===editSeller:true));
      if(!row)throw new Error('Inserimento non trovato');

      const seller=document.getElementById('seller');
      if(seller&&!seller.disabled)seller.value=row.seller;
      setValue('date',row.date);
      setValue('center',row.center);
      setValue('entryTime',row.entryTime);
      setValue('exitTime',row.exitTime);
      setValue('afternoonEntryTime',row.afternoonEntryTime);
      setValue('afternoonExitTime',row.afternoonExitTime);
      setValue('messagesSent',row.messagesSent);
      setValue('birthdayMessagesSent',row.birthdayMessagesSent);
      setValue('callsMade',row.callsMade);
      setValue('callsAnswered',row.callsAnswered);
      setValue('appointmentsFromCalls',row.appointmentsFromCalls);
      setValue('toursDone',row.toursDone);
      setValue('passesVouchersActivated',row.passesVouchersActivated);
      setValue('passesVouchersDelivered',row.passesVouchersDelivered);
      setValue('revenue',row.revenue);
      setValue('futuraAmount',row.futuraAmount);
      setValue('collectedPos',row.collectedPos);
      setValue('collectedCash',row.collectedCash);
      setValue('collectedBank',row.collectedBank);
      setValue('collectedFinance',row.collectedFinance);
      setValue('quotesTotal',row.quotesTotal);
      setValue('soldSubscriptionsTotal',row.soldSubscriptionsTotal);
      setValue('installmentsTotal',row.installmentsTotal);
      setValue('notes',row.notes);

      fire(document.getElementById('birthdayMessagesSent'));
      fire(document.getElementById('quotesTotal'));
      fire(document.getElementById('soldSubscriptionsTotal'));
      fire(document.getElementById('installmentsTotal'));
      ['entryTime','exitTime','afternoonEntryTime','afternoonExitTime','collectedPos','collectedCash','collectedBank','collectedFinance'].forEach(id=>fire(document.getElementById(id)));

      (row.birthdayOutcomes||[]).forEach((v,i)=>setValue(`birthdayOutcome${i+1}`,v));
      (row.quotes||[]).forEach((v,i)=>setValue(`quoteType${i+1}`,v?.type||''));
      (row.soldSubscriptions||[]).forEach((v,i)=>{
        setValue(`subscriptionType${i+1}`,v?.subscriptionType||'');
        setValue(`customerType${i+1}`,v?.customerType||'');
        setValue(`customerSource${i+1}`,v?.customerSource||'');
      });
      (row.installments||[]).forEach((v,i)=>{
        setValue(`installmentAmount${i+1}`,v?.amount||0);
        setValue(`installmentUser${i+1}`,v?.user||'');
        const radio=document.querySelector(`input[name="installmentStatus${i+1}"][value="${CSS.escape(v?.status||'')}"]`);
        if(radio)radio.checked=true;
      });

      if(status)status.textContent='MODIFICA INSERIMENTO';
      const subtitle=document.querySelector('.subtitle');
      if(subtitle)subtitle.textContent=`Modifica inserimento del ${editDate.split('-').reverse().join('/')} · ${row.seller}`;
      const submit=document.getElementById('submitButton');
      if(submit)submit.textContent='Riepilogo modifiche';
    }catch(err){
      if(status)status.textContent='Errore modifica';
      const msg=document.getElementById('formMessage');
      if(msg){msg.textContent=`Impossibile caricare l'inserimento: ${err.message}`;msg.className='form-message error';}
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(preload,0));
  else setTimeout(preload,0);
})();