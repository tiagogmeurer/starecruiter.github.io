import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    // Important for GitHub Pages (relative asset paths)
    base: './',
    server: {
      port: 3000,
      host: '0.0.0.0',
      // If you ever run this behind a tunnel (Cloudflare/Ngrok), this avoids Vite host blocking.
      allowedHosts: 'all',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
