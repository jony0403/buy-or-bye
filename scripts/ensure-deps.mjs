import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const require = createRequire(import.meta.url);
/** Analyzer needs sharp + Playwright Chromium for URL import / comps. */
const requiredPackages = ['sharp', 'playwright'];

const missingPackages = requiredPackages.filter((packageName) => {
  try {
    require.resolve(packageName);
    return false;
  } catch {
    return true;
  }
});

if (missingPackages.length) {
  console.log(`Installing missing dependencies: ${missingPackages.join(', ')}`);
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCommand, ['install'], {
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    console.error('npm install failed. Check your internet connection or school PC restrictions.');
    process.exit(result.status ?? 1);
  }
}

function chromiumLooksInstalled() {
  try {
    const { chromium } = require('playwright');
    const exe = typeof chromium.executablePath === 'function' ? chromium.executablePath() : '';
    return Boolean(exe && existsSync(exe));
  } catch {
    return false;
  }
}

if (!chromiumLooksInstalled() && process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD !== '1') {
  console.log('Playwright Chromium missing — installing…');
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(npxCommand, ['playwright', 'install', 'chromium'], {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: undefined },
  });
  if (result.status !== 0) {
    console.warn('playwright install chromium failed; URL import/comps may return 502 until browsers are present.');
  }
}
