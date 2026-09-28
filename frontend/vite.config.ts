import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/study/api': {
        target: process.env.ODOO_PROXY_TARGET || 'http://localhost:8069',
        changeOrigin: true,
      },
    },
  },
});