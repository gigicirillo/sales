function subscriptionEntries(rows){
  return rows.flatMap(row=>{
    const details=Array.isArray(row.soldSubscriptions)?row.soldSubscriptions:[];
    const count=Math.max(0,Math.trunc(Number(row.soldSubscriptionsTotal)||0));
    return Array.from({length:count},(_,i)=>({seller:row.seller||'Non specificato',type:String(details[i]?.customerType||'').trim()||'Non specificato',source:String(details[i]?.customerSource||'').trim()||'Non specificato'}));
  });
}
function filterSubscriptions(entries,filters){return entries.filter(e=>['seller','type','source'].every(k=>filters[k]==='all'||e[k]===filters[k]));}
if(typeof module!=='undefined')module.exports={subscriptionEntries,filterSubscriptions};
if(typeof document!=='undefined')(async()=>{
  const user=await SalesAuth.requireAdmin();if(!user)return;
  const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),now=new Date(),iso=d=>new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  $('from').value=params.get('from')||iso(new Date(now.getFullYear(),now.getMonth(),1));$('to').value=params.get('to')||iso(now);
  if(['all','Futura Evo','Futura Fit'].includes(params.get('center')))$('center').value=params.get('center');
  let entries=[],initialSeller=params.get('seller')||'all';
  function options(id,key,label){const selected=id==='seller'&&initialSeller!=='all'?initialSeller:$(id).value;$(id).replaceChildren(new Option(label,'all'));[...new Set(entries.map(e=>e[key]))].sort((a,b)=>a.localeCompare(b,'it')).forEach(v=>$(id).add(new Option(v,v)));$(id).value=[...$(id).options].some(o=>o.value===selected)?selected:'all';}
  function table(title,data,keys){const wrap=document.createElement('div');wrap.className='table-scroll';const t=document.createElement('table'),cap=document.createElement('caption');cap.textContent=title;t.append(cap);const head=t.createTHead().insertRow();[...keys.map(k=>k==='type'?'Tipo cliente':'Fonte cliente'),'Abbonamenti'].forEach(label=>{const th=document.createElement('th');th.textContent=label;head.append(th)});const counts=new Map();data.forEach(e=>{const k=JSON.stringify(keys.map(key=>e[key]));counts.set(k,(counts.get(k)||0)+1)});const body=t.createTBody();[...counts].sort((a,b)=>b[1]-a[1]).forEach(([key,count])=>{const row=body.insertRow();[...JSON.parse(key),count].forEach(value=>{row.insertCell().textContent=value})});wrap.append(t);return wrap;}
  const chartColors=['#6d28d9','#059669','#ea580c','#0284c7','#db2777','#ca8a04','#4f46e5','#0d9488','#b91c1c','#64748b'];
  function chart(data,key,title,pie){
    const figure=document.createElement('figure');figure.className='subscription-figure';
    const caption=document.createElement('figcaption');caption.textContent=title;figure.append(caption);
    const counts=new Map();data.forEach(e=>counts.set(e[key],(counts.get(e[key])||0)+1));
    const groups=[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'it'));
    const categories=[...new Set(entries.map(e=>e[key]))].sort((a,b)=>a.localeCompare(b,'it'));
    const color=label=>chartColors[categories.indexOf(label)%chartColors.length];
    const plot=document.createElement('div');plot.setAttribute('aria-hidden','true');
    if(pie){
      plot.className='subscription-pie';let start=0;
      plot.style.background='conic-gradient('+groups.map(([label,count])=>{const end=start+count/data.length*360;const slice=`${color(label)} ${start}deg ${end}deg`;start=end;return slice}).join(',')+')';
    }else{
      plot.className='subscription-columns';const max=Math.max(...groups.map(x=>x[1]),1);
      groups.forEach(([label,count],i)=>{const column=document.createElement('div');column.className='subscription-column';const value=document.createElement('strong');value.textContent=count;const bar=document.createElement('div');bar.className='subscription-bar';bar.style.height=`${count/max*160}px`;bar.style.background=color(label);const tag=document.createElement('span');tag.textContent=String(i+1);column.title=`${label}: ${count}`;column.append(value,bar,tag);plot.append(column)});
    }
    const legend=document.createElement('ul');legend.className='subscription-legend';
    groups.forEach(([label,count],i)=>{const li=document.createElement('li'),dot=document.createElement('span');dot.className='subscription-swatch';dot.style.background=color(label);const text=document.createElement('span');text.textContent=`${pie?'':`${i+1}. `}${label}`;const value=document.createElement('strong');value.textContent=`${count} · ${(count/data.length*100).toLocaleString('it-IT',{maximumFractionDigits:1})}%`;li.append(dot,text,value);legend.append(li)});
    figure.append(plot,legend);return figure;
  }
  function charts(data){const wrap=document.createElement('div');wrap.className='subscription-charts';wrap.append(chart(data,'type','Tipo cliente',true),chart(data,'source','Fonte cliente',false));return wrap;}
  function render(){const filtered=filterSubscriptions(entries,{seller:$('seller').value,type:$('type').value,source:$('source').value});$('results').replaceChildren();$('status').textContent=`${filtered.length} abbonamenti corrispondenti ai filtri.`;const sellers=[...new Set(filtered.map(e=>e.seller))].sort((a,b)=>a.localeCompare(b,'it'));sellers.forEach(seller=>{const data=filtered.filter(e=>e.seller===seller),card=document.createElement('article');card.className='chart-card';const h=document.createElement('h2');h.textContent=`${seller} · ${data.length} abbonamenti`;card.append(h,charts(data),table('Per tipo cliente',data,['type']),table('Per fonte cliente',data,['source']),table('Tipo cliente e fonte',data,['type','source']));$('results').append(card)});if(!filtered.length)$('status').textContent='Nessun abbonamento trovato con questi filtri.';}
  async function load(){if(!$('filters').reportValidity())return;if($('from').value>$('to').value){$('status').textContent='La data iniziale deve precedere quella finale.';return;}$('apply').disabled=true;$('status').textContent='Caricamento…';$('results').replaceChildren();try{const q=new URLSearchParams({action:'report',from:$('from').value,to:$('to').value,center:$('center').value,seller:'all'});const response=await fetch(`${window.SALES_APP_CONFIG.GOOGLE_SCRIPT_URL}?${q}`),data=await response.json();if(!data.ok)throw new Error(data.error||'Errore caricamento');if(data.user?.role!=='admin')throw new Error('Accesso riservato admin');entries=subscriptionEntries(data.rows||[]);options('seller','seller','Tutti gli operatori');initialSeller='all';options('type','type','Tutti i tipi');options('source','source','Tutte le fonti');render()}catch(e){entries=[];$('status').textContent=`Impossibile caricare: ${e.message}`}finally{$('apply').disabled=false}}
  $('filters').addEventListener('submit',e=>{e.preventDefault();load()});['seller','type','source'].forEach(id=>$(id).addEventListener('change',render));await load();
})();
