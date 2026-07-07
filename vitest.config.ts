import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        isolatedStorage: false,
        wrangler: {
          configPath: './wrangler.toml',
          // Force production origins so route tests that hit non-local hosts
          // actually exercise the DubHaven branch. (.dev.vars overrides these
          // to localhost for the dev server, which would make every request
          // look local in the test pool.)
          vars: {
            APP_URL: 'https://dubmenu.com',
            TV_URL: 'https://tv.dubmenu.com',
            DEMO_LOGIN_PASSWORD: 'test-demo-secret',
            DEMO_LOGIN_EMAIL: 'demo-qa@dubmenu-test.example',
          },
        },
      },
    },
  },
});
