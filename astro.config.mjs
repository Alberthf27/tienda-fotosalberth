import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { obtenerCatalogo } from './src/lib/catalogo/snapshot.ts';

const site = process.env.PUBLIC_SITE_URL ?? 'https://tienda-fotosalberth.alberthflores47.workers.dev';

export default defineConfig({
  site,
  output: 'static',
  integrations: [
    {
      name: 'fotosalberth:catalogo-sync',
      hooks: {
        'astro:config:setup': async ({ logger }) => {
          logger.info('Sincronizando catálogo con el sistema POS / VPS...');
          const catalogo = await obtenerCatalogo();
          logger.info(`Catálogo listo: ${catalogo.productos.length} productos cargados.`);
        }
      }
    },
    sitemap({
      filter: (page) => !page.includes('/404')
    })
  ],
  vite: {
    plugins: [tailwindcss()]
  },
  build: {
    inlineStylesheets: 'auto'
  }
});
