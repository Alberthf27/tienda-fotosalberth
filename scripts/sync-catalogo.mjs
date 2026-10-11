// Sincroniza data/catalogo.json desde el endpoint público del POS (VPS).
// Solo lectura: NO modifica la base de datos del VPS.
// Uso: npm run sync   (o: node scripts/sync-catalogo.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.join(__dirname, '..');
const rutaSnapshot = path.join(raiz, 'data', 'catalogo.json');
const apiUrl = process.env.CATALOGO_API_URL || 'http://159.112.128.144:3000/api/public/catalogo';

console.log(`[sync] Descargando catálogo desde ${apiUrl} ...`);

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 15000);

try {
  const res = await fetch(apiUrl, {
    signal: controller.signal,
    headers: { Accept: 'application/json', 'User-Agent': 'tienda-fotosalberth-sync/1.0' }
  });
  clearTimeout(timer);

  if (!res.ok) {
    console.error(`[sync] ✗ El endpoint respondió ${res.status} ${res.statusText}. ¿Está desplegado el endpoint /api/public/catalogo en producción?`);
    process.exit(1);
  }

  const data = await res.json();
  if (!data?.ok || !Array.isArray(data.productos) || data.productos.length === 0) {
    console.error('[sync] ✗ Respuesta inválida o vacía del endpoint.');
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(rutaSnapshot), { recursive: true });
  const anterior = fs.existsSync(rutaSnapshot)
    ? JSON.parse(fs.readFileSync(rutaSnapshot, 'utf8')).productos?.length ?? 0
    : 0;

  fs.writeFileSync(rutaSnapshot, JSON.stringify(data, null, 2), 'utf8');

  console.log(`[sync] ✓ Snapshot actualizado: ${data.productos.length} productos, ${data.categorias.length} categorías.`);
  console.log(`[sync]   Antes: ${anterior} productos → Ahora: ${data.productos.length} productos.`);
  console.log(`[sync]   Generado en: ${data.generado_en}`);
  console.log(`[sync] Siguiente paso: npm run build`);
} catch (err) {
  clearTimeout(timer);
  console.error(`[sync] ✗ Error de conexión: ${err.message}`);
  console.error('[sync]   El VPS puede estar caído o el endpoint aún no desplegado. Se conserva el snapshot local.');
  process.exit(1);
}
