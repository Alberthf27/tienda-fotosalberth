// Prepara las fotos del catálogo para la web.
//
// El endpoint del POS entrega cada foto como `data:image/jpeg;base64` (~9 KB por
// producto). Si se incrustan en el HTML, el peso se dispara: medido en 10.9 MB de
// portada, de los cuales 8.85 MB eran base64 duplicado (en `<img src>` y otra vez
// dentro de `data-producto`).
//
// Este script las saca a archivos WebP en dos tamaños y deja un catálogo ligero
// (`data/catalogo.web.json`) que la tienda consume. El original `data/catalogo.json`
// no se toca: sigue siendo el snapshot fiel del VPS.
//
// Uso: node scripts/preparar-imagenes.mjs      (o: npm run imagenes)
//      IMAGENES_FORZAR=1 node scripts/preparar-imagenes.mjs   para regenerar todo

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.join(__dirname, '..');
const rutaOrigen = path.join(raiz, 'data', 'catalogo.json');
const rutaDestino = path.join(raiz, 'data', 'catalogo.web.json');
const dirImagenes = path.join(raiz, 'public', 'img', 'productos');

const CALIDAD_WEBP = 78;
const GRANDE = 400;
const MINI = 268;
const RE_DATA_URI = /^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/;

if (!fs.existsSync(rutaOrigen)) {
  console.error('[imagenes] ✗ No existe data/catalogo.json. Ejecuta primero: npm run sync');
  process.exit(1);
}

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (err) {
  console.error(`[imagenes] ✗ sharp no está instalado (${err.message}). Ejecuta: npm install`);
  process.exit(1);
}

const catalogo = JSON.parse(fs.readFileSync(rutaOrigen, 'utf8'));
fs.mkdirSync(dirImagenes, { recursive: true });

const forzar = process.env.IMAGENES_FORZAR === '1';
const kb = (n) => `${Math.round(n / 1024)} KB`;

function nombreSeguro(slug, id) {
  const base = (slug || `producto-${id}`)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `producto-${id}`;
}

let generadas = 0;
let reutilizadas = 0;
let sinFoto = 0;
let fallidas = 0;
let bytesEntrada = 0;
let bytesSalida = 0;

const productos = [];

for (const producto of catalogo.productos) {
  const foto = Array.isArray(producto.fotos) ? producto.fotos[0] : null;

  // Ya viene como ruta (segunda pasada del script): se conserva.
  if (foto && !String(foto).startsWith('data:')) {
    productos.push(producto);
    continue;
  }

  const match = foto ? RE_DATA_URI.exec(foto) : null;
  if (!match) {
    sinFoto += 1;
    productos.push({ ...producto, fotos: [] });
    continue;
  }

  const buffer = Buffer.from(match[2], 'base64');
  bytesEntrada += buffer.length;

  const base = nombreSeguro(producto.slug, producto.id);
  const archivoGrande = path.join(dirImagenes, `${base}-${GRANDE}.webp`);
  const archivoMini = path.join(dirImagenes, `${base}-${MINI}.webp`);

  try {
    const faltan = forzar || !fs.existsSync(archivoGrande) || !fs.existsSync(archivoMini);

    if (faltan) {
      const img = sharp(buffer).rotate();
      const [grande, mini] = await Promise.all([
        img.clone().resize({ width: GRANDE, height: GRANDE, fit: 'inside', withoutEnlargement: true }).webp({ quality: CALIDAD_WEBP }).toBuffer(),
        img.clone().resize({ width: MINI, height: MINI, fit: 'inside', withoutEnlargement: true }).webp({ quality: CALIDAD_WEBP }).toBuffer()
      ]);
      fs.writeFileSync(archivoGrande, grande);
      fs.writeFileSync(archivoMini, mini);
      bytesSalida += grande.length + mini.length;
      generadas += 1;
    } else {
      bytesSalida += fs.statSync(archivoGrande).size + fs.statSync(archivoMini).size;
      reutilizadas += 1;
    }

    productos.push({
      ...producto,
      fotos: [`/img/productos/${base}-${GRANDE}.webp`],
      fotos_mini: [`/img/productos/${base}-${MINI}.webp`]
    });
  } catch (err) {
    fallidas += 1;
    console.warn(`[imagenes] ⚠ ${producto.sku}: ${err.message}`);
    productos.push({ ...producto, fotos: [] });
  }
}

const ligero = { ...catalogo, productos };
fs.writeFileSync(rutaDestino, JSON.stringify(ligero, null, 2), 'utf8');

const pesoHtml = (n) => Math.round(n / 1024);
console.log(`[imagenes] ${generadas} generadas · ${reutilizadas} reutilizadas · ${sinFoto} sin foto · ${fallidas} fallidas`);
console.log(`[imagenes] JPEG original ${kb(bytesEntrada)} → WebP 2 tamaños ${kb(bytesSalida)}`);
console.log(`[imagenes] ✓ ${path.relative(raiz, rutaDestino)} (${Math.round(fs.statSync(rutaDestino).size / 1024 / 1024 * 10) / 10} MB, sin base64)`);
