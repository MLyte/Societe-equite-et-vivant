import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { renderPage, root } from './vitrine.mjs';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/societe-equite-vivant/',
  publicDir: false,
  plugins: [tailwindcss(), {
    name: 'syntheses-editoriales',
    transformIndexHtml: { order: 'pre', handler: (html) => renderPage(html) },
    configureServer(server) { server.watcher.add(resolve(root, 'vitrine.md')); },
    handleHotUpdate({ file, server }) {
      if (file.endsWith('vitrine.md')) { server.ws.send({ type: 'full-reload' }); return []; }
    },
  }],
  build: { outDir: 'dist', emptyOutDir: true },
});
