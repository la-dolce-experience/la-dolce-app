import { defineConfig, devices } from '@playwright/test';

/**
 * E2E contra o BUILD DE PRODUÇÃO servido com os headers do vercel.json.
 * Pré-requisitos: Supabase local rodando (npm run db:start no la-dolce-api) e, para os testes
 * do painel, E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD de um admin local.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'pt-BR',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && node scripts/serve-dist.mjs',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 180_000,
    env: { VITE_SITE_URL: 'http://localhost:4173' },
  },
});
