import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true });
await p.goto('http://localhost:4181/', { waitUntil:'domcontentloaded' });
await p.setInputFiles('#fileInput', '/tmp/rp/sample.replay.gz');
await p.waitForTimeout(2500);
await p.click('[data-tab="cards"]').catch(()=>{});
await p.waitForTimeout(1000);
const first = await p.$('.card-mini');
if(first){ await first.click(); await p.waitForTimeout(900); }
// viewport-only (what the user sees)
await p.screenshot({ path:'/tmp/rp/mob_viewport.png' });
// the modal card element
const modal = await p.$('.modal-card');
if(modal){ await modal.screenshot({ path:'/tmp/rp/mob_modal.png' }); console.log('modal shot'); }
// measure the card-detail grid columns actually used
const info = await p.evaluate(()=>{
  const cd = document.querySelector('.card-detail');
  if(!cd) return 'no card-detail';
  const cs = getComputedStyle(cd);
  const img = cd.querySelector('.card-image');
  return { gridCols: cs.gridTemplateColumns, cardDetailWidth: cd.getBoundingClientRect().width, imgWidth: img?.getBoundingClientRect().width };
});
console.log('card-detail layout:', JSON.stringify(info));
await b.close();
