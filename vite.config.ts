import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 5121,
    strictPort: true,
    open: true
  }
});