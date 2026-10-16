/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { seoPlugin } from './scripts/vite-seo-plugin.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = (env.VITE_SITE_URL || 'http://localhost:4173').replace(/\/$/, '');
  // Garante que %VITE_SITE_URL% no index.html sempre seja substituído.
  process.env.VITE_SITE_URL = siteUrl;

  return {
    plugins: [react(), seoPlugin({ siteUrl, supabaseUrl: env.VITE_SUPABASE_URL, anonKey: env.VITE_SUPABASE_ANON_KEY })],
    build: {
      rollupOptions: {
        output: {
          // Separa bibliotecas grandes para melhor cache entre publicações.
          manualChunks: (id: string) => {
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('node_modules/react')) return 'react';
            return undefined;
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: { modules: { classNameStrategy: 'non-scoped' } },
    },
  };
});
