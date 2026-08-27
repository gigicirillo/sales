function drawReportJpg(){
  const a=aggregate(currentRows),canvas=document.createElement('canvas'),w=1600,h=1260,ctx=canvas.getContext('2d');
  canvas.width=w;canvas.height=h;
  ctx.fillStyle='#eef1f4';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#111827';ctx.fillRect(45,45,w-90,145);
  ctx.fillStyle='#fff';ctx.font='700 42px Arial';ctx.fillText('Report performance commerciale',80,105);
  ctx.fillStyle='#cbd5e1';ctx.font='23px Arial';ctx.fillText(`Periodo ${formatDate(els.dateFrom.value)} - ${formatDate(els.dateTo.value)} · Venditore: ${els.sellerLabel.textContent} · Centro: ${els.centerLabel.textContent}`,80,150);

  const cards=[['Ore lavorate',a.workedHours.toFixed(2)+' h'],['Messaggi',a.messagesSent],['Mess. compleanno',a.birthdayMessagesSent],['Abbonamenti venduti',a.soldSubscriptionsTotal],['Fatturato',euro(a.revenue)],['Incassato',euro(a.totalCollected)],['Telefonate',a.callsMade],['Appuntamenti',a.appointmentsFromCalls],['Tour',a.toursDone],['Rinnovi',a.organicRenewals],['Prove',a.trialsActivated],['Pass attivati',a.passesVouchersActivated]];
  const cols=4,cw=(w-120)/cols,ch=108;
  cards.forEach((c,i)=>{const x=45+(i%cols)*(cw+10),y=225+Math.floor(i/cols)*(ch+12);ctx.fillStyle='#fff';ctx.fillRect(x,y,cw,ch);ctx.fillStyle='#6b7280';ctx.font='18px Arial';ctx.fillText(c[0],x+18,y+30);ctx.fillStyle='#111827';ctx.font='700 30px Arial';ctx.fillText(String(c[1]),x+18,y+72)});

  const sellerVals=sellers.map(s=>{
    const rows=currentRows.filter(r=>r.seller===s);
    return {seller:s,revenue:rows.reduce((sum,r)=>sum+n(r.revenue),0),collected:rows.reduce((sum,r)=>sum+n(r.totalCollected),0)};
  });
  const max=Math.max(...sellerVals.flatMap(x=>[x.revenue,x.collected]),1);

  ctx.fillStyle='#111827';ctx.font='700 27px Arial';ctx.fillText('Fatturato e incassato per venditore',55,610);
  ctx.font='700 16px Arial';ctx.fillStyle='#6d28d9';ctx.fillRect(55,628,22,10);ctx.fillText('Fatturato',86,638);
  ctx.fillStyle='#0891b2';ctx.fillRect(205,628,22,10);ctx.fillText('Incassato',236,638);

  sellerVals.forEach((it,i)=>{
    const y=670+i*96;
    const revenueW=900*it.revenue/max;
    const collectedW=900*it.collected/max;
    ctx.fillStyle='#374151';ctx.font='700 20px Arial';ctx.fillText(it.seller,55,y+32);

    ctx.fillStyle='#6d28d9';ctx.fillRect(190,y,Math.max(revenueW,2),26);
    ctx.fillStyle='#111827';ctx.font='700 17px Arial';ctx.fillText(euro(it.revenue),200+revenueW,y+19);

    ctx.fillStyle='#0891b2';ctx.fillRect(190,y+36,Math.max(collectedW,2),26);
    ctx.fillStyle='#111827';ctx.font='700 17px Arial';ctx.fillText(euro(it.collected),200+collectedW,y+55);
  });

  ctx.fillStyle='#6b7280';ctx.font='17px Arial';ctx.fillText(`Report esportato il ${new Intl.DateTimeFormat('it-IT',{dateStyle:'medium',timeStyle:'short'}).format(new Date())}`,55,h-38);
  return canvas;
}
