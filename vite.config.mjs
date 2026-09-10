import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { renderPage, root } from './vitrine.mjs';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

export default defineConfig({
  base: '/societe-equite-vivant/',
  publicDir: false,
  plugins: [tailwindcss(), {
    name: 'syntheses-editoriales',
    transformIndexHtml: { order: 'pre', handler: (html) => renderPage(html) },
    generateBundle() {
      // Les chemins relatifs du manifeste restent valides dans assets/ après compilation.
      const manifest = JSON.parse(readFileSync(resolve(root, 'assets/site.webmanifest'), 'utf8'));
      for (const icon of manifest.icons) {
        this.emitFile({ type: 'asset', fileName: `assets/${icon.src}`, source: readFileSync(resolve(root, 'assets', icon.src)) });
      }
    },
    configureServer(server) { server.watcher.add(resolve(root, 'vitrine.md')); },
    handleHotUpdate({ file, server }) {
      if (file.endsWith('vitrine.md')) { server.ws.send({ type: 'full-reload' }); return []; }
    },
  }],
  build: { outDir: 'dist', emptyOutDir: true },
});
