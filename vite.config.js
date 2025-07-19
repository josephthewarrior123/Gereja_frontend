import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Always use root for Vercel
  server: {
    port: 9875,
    open: true
  },
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
});
