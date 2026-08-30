/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const { execSync } = require('child_process');
const path = require('path');

console.log('=== 1. Backend TypeScript Check ===');
try {
  const beTsc = execSync('node ./node_modules/typescript/bin/tsc --noEmit', { cwd: path.resolve('.'), encoding: 'utf-8' });
  console.log('Backend TSC Output:\n', beTsc || '0 errors');
} catch (e) {
  console.log('Backend TSC Error:\n', e.stdout || e.message);
}

console.log('\n=== 2. Backend Lint Check ===');
try {
  const beLint = execSync('pnpm lint', { cwd: path.resolve('.'), encoding: 'utf-8' });
  console.log('Backend Lint Output:\n', beLint || 'PASS');
} catch (e) {
  console.log('Backend Lint Error:\n', e.stdout || e.message);
}

console.log('\n=== 3. Frontend TypeScript Check ===');
try {
  const feTsc = execSync('bun x tsc --noEmit', { cwd: path.resolve('..', 'Doctorly-Fontend'), encoding: 'utf-8' });
  console.log('Frontend TSC Output:\n', feTsc || 'Zero type errors');
} catch (e) {
  console.log('Frontend TSC Error:\n', e.stdout || e.message);
}

console.log('\n=== 4. Building Doctorly-Fontend ===');
try {
  const feBuild = execSync('bun run build', { cwd: path.resolve('..', 'Doctorly-Fontend'), encoding: 'utf-8' });
  console.log('Frontend Build Output:\n', feBuild || 'BUILD SUCCESS');
} catch (e) {
  console.log('Frontend Build Error:\n', e.stdout || e.message);
}
