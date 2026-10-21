import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const temporaryDirectory = fileURLToPath(new URL('./node_modules/.cache/playwright-temp/', import.meta.url));
mkdirSync(temporaryDirectory, { recursive: true });
process.env.TEMP = temporaryDirectory;
process.env.TMP = temporaryDirectory;
process.env.TMPDIR = temporaryDirectory;

const externalServer = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalServer || 'http://127.0.0.1:18771';

export default defineConfig({
  testDir: './tests',
  testMatch: 'browser.spec.js',
  timeout: 60000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.PLAYWRIGHT_JSON_OUTPUT_FILE
    ? [['list'], ['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_FILE }]]
    : 'list',
  use: {
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined),
    baseURL,
    viewport: { width: 1280, height: 900 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: externalServer ? undefined : {
    command: 'python tests/serve.py',
    cwd: fileURLToPath(new URL('.', import.meta.url)),
    url: 'http://127.0.0.1:18771/index.html',
    reuseExistingServer: false,
    timeout: 20000,
  },
});
