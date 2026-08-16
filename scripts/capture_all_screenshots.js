const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const targets = [
  {
    name: 'port-2020-transparansi.png',
    url: 'http://localhost:2020/',
    appDir: 'apps/transparansi-anggaran/apps/web-next/public/screenshots',
    appFilename: 'portal.png'
  },
  {
    name: 'port-2020-sekolah-024029.png',
    url: 'http://localhost:2020/dashboard/024029',
    appDir: 'apps/transparansi-anggaran/apps/web-next/public/screenshots',
    appFilename: 'school_detail.png'
  },
  {
    name: 'port-2021-kementerian.png',
    url: 'http://localhost:2021/dashboard',
    appDir: 'apps/dashboard-kementerian/public/screenshots',
    appFilename: 'dashboard.png'
  },
  {
    name: 'port-2022-bank.png',
    url: 'http://localhost:2022/dashboard',
    appDir: 'apps/dashboard-bank/public/screenshots',
    appFilename: 'dashboard.png'
  },
  {
    name: 'port-2023-auditor.png',
    url: 'http://localhost:2023/dashboard',
    appDir: 'apps/dashboard-auditor/public/screenshots',
    appFilename: 'dashboard.png'
  },
  {
    name: 'port-2024-institusi-pendidikan.png',
    url: 'http://localhost:2024/dashboard',
    appDir: 'apps/dashboard-institusi-pendidikan/public/screenshots',
    appFilename: 'dashboard.png'
  },
  {
    name: 'port-2027-apbd-lampung.png',
    url: 'http://localhost:2027/dashboard',
    appDir: 'apps/dashboard-apbd/public/screenshots',
    appFilename: 'dashboard.png'
  }
];

async function captureAll() {
  console.log('=== CAPTURING SCREENSHOTS FOR ALL DASHBOARDS ===\n');
  const rootScreenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(rootScreenshotsDir)) {
    fs.mkdirSync(rootScreenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });

  for (const t of targets) {
    const page = await context.newPage();
    try {
      console.log(`Navigating to ${t.url} ...`);
      await page.goto(t.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000); // Give animations time to settle

      // Save to root screenshots
      const rootPath = path.join(rootScreenshotsDir, t.name);
      await page.screenshot({ path: rootPath, fullPage: false });
      console.log(`Saved: ${rootPath}`);

      // Save to app public/screenshots if specified
      if (t.appDir) {
        const fullAppDir = path.join(__dirname, '..', t.appDir);
        if (!fs.existsSync(fullAppDir)) {
          fs.mkdirSync(fullAppDir, { recursive: true });
        }
        const appPath = path.join(fullAppDir, t.appFilename);
        await page.screenshot({ path: appPath, fullPage: false });
        console.log(`Saved: ${appPath}`);
      }
    } catch (err) {
      console.error(`Failed to capture ${t.url}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('\n=== ALL SCREENSHOTS CAPTURED SUCCESSFULLY ===');
}

captureAll();
