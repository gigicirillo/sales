// Run with a local server on 127.0.0.1:8765 and Playwright installed.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true,channel:"chrome"});
  const page = await browser.newPage();
  const errors=[];
  page.on('pageerror', error => errors.push(error.message));
  const rows=[
    {seller:'Sarah',date:'2026-09-20',center:'Futura Evo',revenue:1200,soldSubscriptionsTotal:2,workedHours:8,installments:[{amount:200,status:'Rata ris.'},{amount:400,status:'Rata ins.'}]},
    {seller:'Sarah',date:'2026-09-21',center:'Futura Fit',revenue:400,soldSubscriptionsTotal:1,workedHours:8,installments:[]},
    {seller:'Edy',date:'2026-09-20',center:'Futura Evo',revenue:100,soldSubscriptionsTotal:0,workedHours:8,installments:[{amount:100,status:'Rata ris.'}]}
  ];
  await page.route('**/auth.js*', route => route.fulfill({contentType:'application/javascript',body:'window.SalesAuth={requireAuth(){document.documentElement.classList.add("authenticated")}}'}));
  await page.route('**/config.js*', route => route.fulfill({contentType:'application/javascript',body:'window.SALES_APP_CONFIG={GOOGLE_SCRIPT_URL:"http://127.0.0.1:8765/mock-report"}'}));
  await page.route('**/mock-report?*', route => {
    const q=new URL(route.request().url()).searchParams;
    const filtered=rows.filter(r=>r.date>=q.get('from')&&r.date<=q.get('to')&&(q.get('center')==='all'||r.center===q.get('center')));
    return route.fulfill({json:{ok:true,rows:filtered}});
  });
  await page.goto('http://127.0.0.1:8765/performance/');
  await page.fill('#dateFrom','2026-09-01');
  await page.fill('#dateTo','2026-09-30');
  await page.locator('#applyFilters').press('Enter');
  await page.waitForFunction(()=>document.querySelectorAll('.customer-spend-row').length===2);
  assert.match(await page.locator('#customerSpendChart').innerText(),/466,67/);
  const indexBefore=await page.locator('#performanceBreakdown').innerText();
  for(const toggle of await page.locator('.performance-toggle').all()) await toggle.uncheck();
  assert.match(await page.locator('#customerSpendChart').innerText(),/466,67/);
  for(const toggle of await page.locator('.performance-toggle').all()) await toggle.check();
  assert.equal(await page.locator('#performanceBreakdown').innerText(),indexBefore);
  await page.selectOption('#performanceSeller','Sarah');
  assert.equal(await page.locator('.customer-spend-row').count(),1);
  await page.selectOption('#centerFilter','Futura Evo');
  await page.locator('#applyFilters').press('Enter');
  await page.waitForFunction(()=>document.getElementById('customerSpendChart').textContent.includes('500,00'));
  for(const width of [1280,375,320]){
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const box=await page.locator('#customerSpendChart').boundingBox();
    assert.ok(box.x>=0 && box.x+box.width<=width);
    await page.screenshot({path:`/tmp/sales-performance-${width}.png`,fullPage:true});
  }
  await page.fill('#dateFrom','2026-09-21');
  await page.locator('#applyFilters').press('Enter');
  await page.waitForFunction(()=>document.getElementById('customerSpendChart').textContent.includes('Nessun dato'));
  await page.route('**/mock-report?*',route=>route.fulfill({json:{ok:false,error:'Test error'}}));
  await page.locator('#applyFilters').press('Enter');
  await page.waitForFunction(()=>document.getElementById('reportMessage').textContent.includes('Test error'));
  assert.equal(await page.locator('.customer-spend-row').count(),0);
  assert.deepEqual(errors,[]);
  await browser.close();
  console.log('Browser checks passed: filters, toggles, empty/error states, 1280/375/320px layouts.');
})().catch(error=>{console.error(error);process.exit(1)});
