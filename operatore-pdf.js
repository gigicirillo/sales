/* Paginated vector PDF: readable text, repeated headers and intact rows. */
function exportOperatorPdf(){
  const {jsPDF}=window.jspdf;
  const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  const width=pdf.internal.pageSize.getWidth(),height=pdf.internal.pageSize.getHeight(),margin=8;
  const table=document.getElementById('reportTable');
  const headers=[...table.tHead.rows[0].cells];
  const indexes=headers.map((cell,index)=>({cell,index})).filter(({cell})=>!cell.hidden&&!/Modifica/.test(cell.textContent));
  const labels=indexes.map(({cell})=>cell.textContent.replace(/[↕↑↓▲▼⬆⬇]/g,'').trim());
  const weights=labels.map(label=>/Data|Operatore/.test(label)?1.55:/Inc\.|Incassato|Fatturato/.test(label)?1.4:1);
  const unit=(width-2*margin)/weights.reduce((a,b)=>a+b,0),widths=weights.map(x=>x*unit);
  let y=0,page=0;
  const clean=value=>value.replace(/\u00a0/g,' ').trim();
  function drawRow(values,header=false,total=false,source=null){
    pdf.setFont('helvetica',header||total?'bold':'normal');pdf.setFontSize(header?7:8);
    const lines=values.map((value,i)=>pdf.splitTextToSize(clean(value),widths[i]-3));
    const rowHeight=Math.max(8,...lines.map(x=>x.length*3.4+3));
    if(!header&&y+rowHeight>height-13)newPage();
    let x=margin;
    values.forEach((value,i)=>{
      const cell=source?.cells[indexes[i].index];
      const fill=header?[17,24,39]:cell?.classList.contains('ratei-col')?[255,237,213]:cell?.classList.contains('incassato-col')?[220,252,231]:total?[226,232,240]:[248,250,252];
      pdf.setFillColor(...fill);pdf.setDrawColor(226,232,240);pdf.rect(x,y,widths[i],rowHeight,'FD');
      pdf.setTextColor(...(header?[255,255,255]:[17,24,39]));
      pdf.setFont('helvetica',header||total?'bold':'normal');pdf.setFontSize(header?7:8);
      pdf.text(lines[i],x+1.5,y+4);x+=widths[i];
    });
    y+=rowHeight;
  }
  function newPage(){
    if(page)pdf.addPage();page++;
    pdf.setTextColor(17,24,39);pdf.setFont('helvetica','bold');pdf.setFontSize(12);
    pdf.text(`Report operatore - ${document.getElementById('reportName').textContent}`,margin,12);
    pdf.setFont('helvetica','normal');pdf.setFontSize(9);
    pdf.text(`${date(from.value)} - ${date(to.value)} | ${center.value==='all'?'Tutti i centri':center.value}`,margin,18);
    y=23;drawRow(labels,true);
  }
  newPage();
  [...table.tBodies[0].rows,...(table.tFoot?.rows||[])].forEach(row=>{
    drawRow(indexes.map(({index})=>row.cells[index]?.textContent||''),false,row.parentElement===table.tFoot,row);
  });
  for(let i=1;i<=page;i++){pdf.setPage(i);pdf.setFont('helvetica','normal');pdf.setFontSize(8);pdf.setTextColor(100,116,139);pdf.text(`Pagina ${i} di ${page}`,width-margin,height-5,{align:'right'});}
  pdf.save(filename('pdf'));
}
