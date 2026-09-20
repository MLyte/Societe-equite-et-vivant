import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { renderPage, root } from './vitrine.mjs';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

export default defineConfig({
  // Ressources relatives : l'artefact peut être hébergé à la racine ou dans un sous-dossier.
  base: './',
  publicDir: false,
  plugins: [tailwindcss(), {
    name: 'syntheses-editoriales',
    transformIndexHtml: { order: 'pre', handler: (html) => renderPage(html) },
    generateBundle() {
      const canonical = 'https://demain.mathieuluyten.be/';
      // URL publique stable : les robots sociaux ne résolvent pas le manifeste Vite.
      const shareImage = 'partage-vitrine-2026-09.png';
      this.emitFile({ type: 'asset', fileName: `assets/${shareImage}`, source: readFileSync(resolve(root, 'assets', shareImage)) });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${canonical}sitemap.xml\n` });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${canonical}</loc></url></urlset>\n` });
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
  // Dossier statique autonome à transmettre à l'hébergement.
  build: { outDir: 'vitrine', emptyOutDir: true },
});
