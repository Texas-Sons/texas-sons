const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const token = fs.readFileSync('current_token.txt', 'utf8').trim();
  const browser = await puppeteer.launch({ 
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 400, height: 800 }); // mobile first

  console.log('Navigating to portal...');
  await page.goto(`http://localhost:3000/intake/${token}`, { waitUntil: 'networkidle0' });
  
  // Wait for the app to load
  await page.waitForSelector('form');
  
  console.log('Uploading logo...');
  const logoInput = await page.$('input[type="file"]:not([multiple])');
  await logoInput.uploadFile(path.resolve('test_photo_0.jpg'));
  
  console.log('Uploading photos...');
  const photoInput = await page.$('input[type="file"][multiple]');
  await photoInput.uploadFile(path.resolve('test_photo_1.jpg'), path.resolve('test_photo_2.jpg'), path.resolve('test_photo_0.jpg'));
  
  console.log('Filling form fields...');
  // Tagline
  await page.type('input[placeholder="e.g. Dedicated Texas Quality"]', 'Justice for All Atascosa');
  // Hours
  await page.type('input[placeholder="Mon-Fri 8am-5pm"]', '24/7 Campaign Trail');
  // Description
  await page.type('textarea[placeholder="Tell us about what you do..."]', 'Fighting for the people of Atascosa County.');
  // Email
  await page.type('input[type="email"]', 'waylon@example.com');
  
  console.log('Submitting...');
  await page.click('button[type="submit"]');
  
  // wait for the success screen
  await page.waitForFunction(() => document.body.innerText.includes('Received!'), { timeout: 15000 });
  console.log('Submission successful!');
  
  const screenshotPath = 'C:\\Users\\Morgan\\.gemini\\antigravity\\brain\\7053d411-da32-4c70-81bc-6f9327b21de8\\submission-proof.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Saved screenshot to ' + screenshotPath);
  
  await browser.close();
})();
