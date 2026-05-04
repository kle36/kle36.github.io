import { mkdir } from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotDir = join(__dirname, 'temporary screenshots');
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

await mkdir(screenshotDir, { recursive: true });

const existing = existsSync(screenshotDir)
  ? readdirSync(screenshotDir).filter(f => /^screenshot-\d+/.test(f)).length
  : 0;
const filename = label
  ? `screenshot-${existing + 1}-${label}.png`
  : `screenshot-${existing + 1}.png`;
const outputPath = join(screenshotDir, filename);

const puppeteerSearchPaths = [
  'C:/Users/nateh/AppData/Local/Temp/puppeteer-test/node_modules/puppeteer',
  join(__dirname, 'node_modules/puppeteer'),
];

const chromeCandidates = [
  'C:/Users/nateh/.cache/puppeteer/chrome/win64-134.0.6998.35/chrome-win64/chrome.exe',
  'C:/Users/lekat/.cache/puppeteer/chrome/win64-134.0.6998.35/chrome-win64/chrome.exe',
  'C:/Users/nateh/.cache/puppeteer/chrome/win64-133.0.6943.53/chrome-win64/chrome.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];

const require = createRequire(import.meta.url);

let puppeteer = null;
for (const p of puppeteerSearchPaths) {
  if (existsSync(p)) {
    try { puppeteer = require(p); break; } catch {}
  }
}
if (!puppeteer) {
  try { puppeteer = require('puppeteer'); } catch {}
}
if (!puppeteer) {
  console.error('Puppeteer not found. Run: npm install puppeteer');
  process.exit(1);
}

const executablePath = chromeCandidates.find(p => existsSync(p));

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  ...(executablePath ? { executablePath } : {}),
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 900));
await page.screenshot({ path: outputPath, fullPage: true });
await browser.close();

console.log(`Saved → ${outputPath}`);
