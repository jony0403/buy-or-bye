import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const requiredPackages = ['sharp', 'playwright'];

const missingPackages = requiredPackages.filter((packageName) => {
  try {
    require.resolve(packageName);
    return false;
  } catch {
    return true;
  }
});

if (!missingPackages.length) {
  process.exit(0);
}

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
