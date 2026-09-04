(()=>{
  const button=document.getElementById('downloadJpgButton');
  if(!button)return;

  function buildJpg(payload){
    const width=1600,pad=44,gap=16;
    const closing=Boolean(payload.closingEnabled);
    const height=closing?1040:880;
    const canvas=document.createElement('canvas');
    canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#eef1f4';ctx.fillRect(0,0,width,height);

    drawRoundedRect(ctx,pad,pad,width-pad*2,128,22,'#111827');
    ctx.fillStyle='#c4b5fd';ctx.font='700 20px Arial';ctx.fillText('FUTURA CLUBS · DAILY COMMERCIALE',pad+28,pad+34);
    ctx.fillStyle='#fff';ctx.font='700 38px Arial';ctx.fillText(`${payload.seller||'Consulente'} · ${payload.center||'Centro'}`,pad+28,pad+80);
    ctx.fillStyle='#cbd5e1';ctx.font='21px Arial';ctx.fillText(formatDateCompact(payload.date),pad+28,pad+111);
    ctx.textAlign='right';ctx.fillStyle='#ef4444';ctx.font='700 18px Arial';ctx.fillText(`INVIATO ${new Intl.DateTimeFormat('it-IT',{dateStyle:'short',timeStyle:'short'}).format(lastSentAt||new Date())}`,width-pad-28,pad+34);ctx.textAlign='left';

    let y=pad+128+gap;
    const half=(width-pad*2-gap)/2;
    drawMetric(ctx,pad,y,half,150,'Preventivi',Number(payload.quotesTotal)||0,'#fef2f2','#b91c1c');
    drawMetric(ctx,pad+half+gap,y,half,150,'Abbonamenti venduti',Number(payload.soldSubscriptionsTotal)||0,'#fffbe8','#854d0e');
    y+=166;

    const activity=[['Messaggi',payload.messagesSent,'#eefcf5'],['Telefonate',payload.callsMade,'#eef6ff'],['Appuntamenti',payload.appointmentsFromCalls,'#eef6ff'],['Tour',payload.toursDone,'#eef6ff'],['Pass attivati',payload.passesVouchersActivated,'#f7f1ff'],['Pass consegnati',payload.passesVouchersDelivered,'#f7f1ff']];
    const aw=(width-pad*2-gap*5)/6;
    activity.forEach(([label,value,fill],i)=>drawMetric(ctx,pad+i*(aw+gap),y,aw,126,label,Number(value)||0,fill));
    y+=142;

    const moneyW=(width-pad*2-gap)/2;
    drawMetric(ctx,pad,y,moneyW,140,'Fatturato',euroCompact(payload.revenue),'#fff0f5','#0f172a');
    drawMetric(ctx,pad+moneyW+gap,y,moneyW,140,'Totale incassato',euroCompact(payload.totalCollected),'#edf9f8','#0f172a');
    y+=156;

    ctx.fillStyle='#475569';ctx.font='700 18px Arial';ctx.fillText('DETTAGLIO INCASSI',pad,y+22);y+=36;
    const payments=[['POS',payload.collectedPos],['Contanti',payload.collectedCash],['Bonifico',payload.collectedBank],['Finanziamento',payload.collectedFinance]];
    const pw=(width-pad*2-gap*3)/4;
    payments.forEach(([label,value],i)=>drawMetric(ctx,pad+i*(pw+gap),y,pw,118,label,euroCompact(value),'#edf9f8','#0f172a'));
    y+=134;

    if(closing){
      ctx.fillStyle='#475569';ctx.font='700 18px Arial';ctx.fillText('CHIUSURA SERALE - FUTURA E TICKET',pad,y+22);y+=36;
      drawMetric(ctx,pad,y,moneyW,126,'Incassato Futura',euroCompact(payload.futuraAmount),'#f5f3ff','#0f172a');
      drawMetric(ctx,pad+moneyW+gap,y,moneyW,126,'Ticket',euroCompact(payload.ticket),'#f5f3ff','#0f172a');
    }
    return canvas;
  }

  button.addEventListener('click',e=>{
    e.preventDefault();e.stopImmediatePropagation();
    const message=document.getElementById('downloadMessage');
    message.className='form-message';message.textContent='';
    button.disabled=true;const oldText=button.innerHTML;button.textContent='Creazione JPG…';
    try{
      const payload=typeof getPayload==='function'?getPayload():null;
      if(!payload)throw new Error('Nessun riepilogo disponibile');
      const canvas=buildJpg(payload);
      canvas.toBlob(blob=>{
        if(!blob)throw new Error('Impossibile generare il JPG');
        const url=URL.createObjectURL(blob),link=document.createElement('a'),safeDate=(payload.date||'giornata').replaceAll('-',''),safeSeller=(payload.seller||'consulente').toLowerCase().replace(/\s+/g,'-');
        link.href=url;link.download=`riepilogo-${safeDate}-${safeSeller}.jpg`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
        message.textContent='JPG generato correttamente.';message.classList.add('success');button.disabled=false;button.innerHTML=oldText;
      },'image/jpeg',0.94);
    }catch(error){message.textContent=`Impossibile creare il JPG: ${error.message}`;message.classList.add('error');button.disabled=false;button.innerHTML=oldText;}
  },true);
})();