(()=>{
  if(typeof render!=='function')return;
  const baseRender=render;

  function arrangeTable(){
    const table=document.getElementById('reportTable');
    if(!table)return;

    const head=table.tHead?.rows?.[0];
    if(head){
      const headers=[...head.cells];
      const revenue=headers.find(c=>c.textContent.trim()==='Fatturato');
      const collected=headers.find(c=>c.textContent.trim()==='Incassato');
      if(revenue&&collected){
        collected.classList.add('incassato-col');
        revenue.insertAdjacentElement('afterend',collected);
      }
    }

    const bodyRows=[...table.tBodies[0].rows];
    bodyRows.forEach((tr,i)=>{
      let ticket=tr.querySelector('.ticket-income-cell');
      if(!ticket){
        ticket=document.createElement('td');
        ticket.className='ticket-income-cell';
        ticket.textContent=euro(rows[i]?.ticket||0);
        const futura=[...tr.cells].find((_,idx)=>idx===12);
        if(futura)futura.insertAdjacentElement('afterend',ticket);
      }
      const cells=[...tr.cells];
      const revenue=cells[11];
      const collected=cells.find((cell,idx)=>idx>11&&idx<cells.length-1&&!cell.classList.contains('ticket-income-cell')&&cell.textContent===euro(rows[i]?.totalCollected||0));
      if(revenue&&collected){
        collected.classList.add('incassato-col');
        revenue.insertAdjacentElement('afterend',collected);
      }
    });

    const foot=table.tFoot?.rows?.[0];
    if(foot){
      if(!foot.querySelector('.ticket-income-cell')){
        const ticket=document.createElement('td');
        ticket.className='ticket-income-cell';
        ticket.textContent=euro(rows.reduce((sum,r)=>sum+n(r.ticket),0));
        const futura=foot.cells[12];
        if(futura)futura.insertAdjacentElement('afterend',ticket);
      }
      const cells=[...foot.cells];
      const revenue=cells[11];
      const totalValue=euro(rows.reduce((sum,r)=>sum+n(r.totalCollected),0));
      const collected=cells.find((cell,idx)=>idx>11&&idx<cells.length-1&&!cell.classList.contains('ticket-income-cell')&&cell.textContent===totalValue);
      if(revenue&&collected){
        collected.classList.add('incassato-col');
        revenue.insertAdjacentElement('afterend',collected);
      }
    }
  }

  render=function(){baseRender();arrangeTable()};
  if(document.getElementById('reportArea')&&!document.getElementById('reportArea').hidden)arrangeTable();
})();