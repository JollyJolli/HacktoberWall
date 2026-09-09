const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const output = process.env.QA_OUTPUT || path.join(require('node:os').tmpdir(), 'hacktoberwall-qa');
fs.mkdirSync(output, {recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL ? {channel:process.env.BROWSER_CHANNEL} : {})});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const results=[];
 for(const width of [320,375,390,768,1440,1920]){
  await page.setViewportSize({width,height:1000});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('.archive-art').scrollIntoViewIfNeeded();
  await page.locator('.archive-art img').evaluate(img=>img.decode());
  await page.evaluate(()=>window.scrollTo(0,0));
  results.push(await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelector('h1').getBoundingClientRect().width,names:document.querySelectorAll('.name-tile').length,bars:document.querySelectorAll('.commit-bar').length,brokenImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src),font:document.fonts.check('700 20px Wall')})));
  await page.screenshot({path:path.join(output,`qa-${width}.png`),fullPage:true});
 }
 await page.getByRole('button',{name:'Unfold all 121 entries +'}).click();
 if(await page.locator('.wall-toggle').getAttribute('aria-expanded')!=='true')throw Error('Wall did not open');
 await page.getByRole('button',{name:'Fold the wall −'}).click();
 if(await page.locator('.wall-toggle').getAttribute('aria-expanded')!=='false')throw Error('Wall did not fold');
 await page.locator('summary').click();
 if(await page.locator('details').getAttribute('open')===null)throw Error('Data disclosure failed');
 const localLinks=await page.locator('a[href]').evaluateAll(a=>a.map(x=>x.getAttribute('href')).filter(h=>!h.startsWith('http')&&!h.startsWith('mailto:')));
 for(const href of localLinks){if(href.startsWith('#')){if(!await page.locator(href).count())throw Error('Missing anchor '+href);}else{const r=await page.request.get('http://127.0.0.1:4173/'+href);if(r.status()!==200)throw Error('Broken link '+href);}}
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.reload();
 const motion=await page.locator('.year-next').evaluate(el=>getComputedStyle(el).animationName);
 if(motion!=='none')throw Error('Reduced motion not respected');
 const nojs=await browser.newContext({javaScriptEnabled:false});
 const staticPage=await nojs.newPage();await staticPage.goto('http://127.0.0.1:4173/');
 if(await staticPage.locator('.name-tile').count()!==121)throw Error('Missing static archive');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('http://127.0.0.1:4173/');await page.keyboard.press('Tab');
 if(await page.evaluate(()=>document.activeElement.textContent)!=='Skip to content')throw Error('Skip link is not first keyboard stop');
 console.log(JSON.stringify({results,errors,motion,interactions:'passed',links:'passed',noJS:'passed',keyboard:'passed'},null,2));
 await browser.close();
 if(errors.length||results.some(r=>r.scrollWidth>r.width||r.brokenImages.length||!r.font))process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});



