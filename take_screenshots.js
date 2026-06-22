const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log('Starting puppeteer...');
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const outDir = path.join(__dirname, 'public', 'screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Disable intro video via localStorage for the domain
  await page.goto('http://localhost:3000');
  await page.evaluate(() => {
    localStorage.setItem('disableIntroVideo', 'true');
  });

  console.log('1. Landing - Hero');
  await page.screenshot({ path: path.join(outDir, '01_landing_hero.png') });

  console.log('2. Landing - Features');
  await page.evaluate(() => window.scrollBy(0, 900));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '02_landing_features.png') });

  console.log('3. Landing - Fish Types');
  await page.evaluate(() => window.scrollBy(0, 900));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '03_landing_fish.png') });

  console.log('4. Landing - Eco Widget & TMA');
  await page.evaluate(() => window.scrollBy(0, 1000));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '04_landing_eco_tma.png') });

  console.log('5. Landing - Video Footer');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '05_landing_footer.png') });

  // Login
  console.log('Logging in...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'demo@vetlog.aqua');
  await page.type('input[type="password"]', 'demo123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });

  console.log('6. Dashboard - Main Analytics');
  await new Promise(r => setTimeout(r, 1000)); // wait for animations
  await page.screenshot({ path: path.join(outDir, '06_dashboard_main.png') });

  console.log('7. Dashboard - Cages List');
  await page.goto('http://localhost:3000/dashboard/cages', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '07_dashboard_cages.png') });

  console.log('8. Dashboard - Journal');
  await page.goto('http://localhost:3000/dashboard/journal', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '08_dashboard_journal.png') });

  console.log('9. Dashboard - Settings');
  await page.goto('http://localhost:3000/dashboard/settings', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '09_dashboard_settings.png') });

  console.log('10. Dashboard - Fish Database');
  await page.goto('http://localhost:3000/dashboard/fish', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '10_dashboard_fish.png') });

  await browser.close();
  console.log('Done! Screenshots saved to', outDir);
}

run().catch(console.error);
