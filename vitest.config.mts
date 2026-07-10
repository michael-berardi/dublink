import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: {
        configPath: './wrangler.toml',
      },
      miniflare: {
        // Force production origins so route tests that hit non-local hosts
        // actually exercise the DubHaven branch. (.dev.vars overrides these
        // to localhost for the dev server, which would make every request
        // look local in the test pool.)
        bindings: {
          APP_URL: 'https://dubmenu.com',
          TV_URL: 'https://tv.dubmenu.com',
          DEMO_LOGIN_PASSWORD: 'test-demo-secret',
          DEMO_LOGIN_EMAIL: 'demo-qa@dubmenu-test.example',
          TEST_MODE: 'true',
        },
      },
    }),
  ],
  test: {
    maxWorkers: 1,
  },
});
