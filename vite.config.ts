import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2020',
  },
  server: {
    proxy: {
      '/api/chat/completions': {
        target: 'https://models.github.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        headers: {
          'accept': 'application/json',
        },
      },
    },
  },
});
