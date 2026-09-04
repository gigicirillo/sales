(()=>{
  if(typeof render!=='function')return;
  const baseRender=render;
  const table=document.getElementById('reportTable');
  if(!table)return;
  let sortIndex=0,sortDirection='desc';

  function ensureOperatorColumn(){
    const head=table.tHead?.rows?.[0];
    if(head&&!Array.from(head.cells).some(c=>c.dataset.key==='operator')){
      const th=document.createElement('th');
      th.dataset.key='operator';
      th.dataset.type='text';
      th.textContent='Operatore';
      head.cells[0]?.insertAdjacentElement('afterend',th);
    }
    const bodyRows=[...table.tBodies[0].rows];
    bodyRows.forEach((tr,i)=>{
      if(tr.querySelector('.operator-name-cell'))return;
      const td=document.createElement('td');
      td.className='operator-name-cell';
      td.textContent=rows[i]?.seller||'—';
      tr.cells[0]?.insertAdjacentElement('afterend',td);
    });
    const foot=table.tFoot?.rows?.[0];
    if(foot&&!foot.querySelector('.operator-name-cell')){
      const td=document.createElement('td');
      td.className='operator-name-cell';
      td.textContent='—';
      foot.cells[0]?.insertAdjacentElement('afterend',td);
    }
  }

  function detectType(th,index){
    if(th.dataset.type)return th.dataset.type;
    if(index===0)return'date';
    if(index===1)return'text';
    return'number';
  }
  function parseValue(text,type){
    const raw=String(text||'').trim();
    if(type==='date'){
      const m=raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      return m?Number(`${m[3]}${m[2]}${m[1]}`):0;
    }
    if(type==='number'){
      const cleaned=raw.replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',','.');
      const val=Number(cleaned);return Number.isFinite(val)?val:0;
    }
    return raw.toLocaleLowerCase('it');
  }
  function applySort(){
    const head=table.tHead?.rows?.[0];if(!head)return;
    const th=head.cells[sortIndex];if(!th)return;
    const type=detectType(th,sortIndex),body=table.tBodies[0],items=[...body.rows];
    items.sort((a,b)=>{
      const av=parseValue(a.cells[sortIndex]?.textContent,type),bv=parseValue(b.cells[sortIndex]?.textContent,type);
      const cmp=type==='text'?String(av).localeCompare(String(bv),'it',{sensitivity:'base'}):av-bv;
      return sortDirection==='asc'?cmp:-cmp;
    });
    items.forEach(tr=>body.appendChild(tr));
    [...head.cells].forEach((cell,idx)=>{
      const indicator=cell.querySelector('.sort-indicator');
      if(indicator)indicator.textContent=idx===sortIndex?(sortDirection==='asc'?'▲':'▼'):'⇅';
      cell.classList.toggle('sorted-column',idx===sortIndex);
      cell.setAttribute('aria-sort',idx===sortIndex?(sortDirection==='asc'?'ascending':'descending'):'none');
    });
  }
  function enableHeaders(){
    const head=table.tHead?.rows?.[0];if(!head)return;
    [...head.cells].forEach((th,index)=>{
      if(th.textContent.trim()==='Modifica'||th.dataset.sortReady)return;
      th.dataset.sortReady='1';
      if(index===0)th.dataset.type='date';
      else if(index===1||th.dataset.key==='operator')th.dataset.type='text';
      else th.dataset.type='number';
      const label=th.textContent.trim();
      th.innerHTML=`<button type="button" class="table-sort-button"><span>${label}</span><span class="sort-indicator" aria-hidden="true">⇅</span></button>`;
      th.querySelector('button').addEventListener('click',()=>{
        if(sortIndex===index)sortDirection=sortDirection==='asc'?'desc':'asc';
        else{sortIndex=index;sortDirection=index===0?'desc':'asc';}
        applySort();
      });
    });
  }
  function enhance(){ensureOperatorColumn();enableHeaders();applySort()}
  render=function(){baseRender();enhance()};
  if(!document.getElementById('reportArea')?.hidden)enhance();
})();