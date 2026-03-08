import { defineConfig } from 'vite';
import { execSync } from 'child_process';
import type { Plugin } from 'vite';

/** Run `gh auth token` and return the token, or throw with a helpful message. */
function getGitHubToken(): string {
  try {
    return execSync('gh auth token', { encoding: 'utf-8', timeout: 5000 }).trim();
  } catch {
    throw new Error('GitHub CLI not authenticated. Run `gh auth login` first.');
  }
}

/** Vite plugin that serves /api/auth/status so the frontend can check auth. */
function authStatusPlugin(): Plugin {
  return {
    name: 'auth-status',
    configureServer(server) {
      server.middlewares.use('/api/auth/status', (_req, res) => {
        try {
          getGitHubToken();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ authenticated: true }));
        } catch (err) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            authenticated: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          }));
        }
      });
    },
  };
}

export default defineConfig({
  build: {
    target: 'es2020',
  },
  plugins: [authStatusPlugin()],
  server: {
    proxy: {
      '/api/chat/completions': {
        target: 'https://api.githubcopilot.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('authorization');
            try {
              const token = getGitHubToken();
              proxyReq.setHeader('Authorization', `Bearer ${token}`);
              proxyReq.setHeader('Copilot-Integration-Id', 'copilot-developer-cli');
            } catch (err) {
              console.error('[proxy] Failed to get GitHub token:', err);
            }
          });
        },
        headers: {
          'accept': 'application/json',
        },
      },
    },
  },
});
