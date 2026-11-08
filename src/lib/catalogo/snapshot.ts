import fs from 'node:fs';
import path from 'node:path';
import type { CatalogoData } from './tipos';

const TIMEOUT_MS = 7000;

export async function descargarCatalogoDesdeApi(apiUrl: string): Promise<CatalogoData | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'tienda-fotosalberth-builder/1.0'
      }
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[Catalogo] API respondió con status ${res.status}: ${res.statusText}`);
      return null;
    }

    const data = await res.json() as CatalogoData;
    if (data && data.ok && Array.isArray(data.productos)) {
      return data;
    }

    console.warn('[Catalogo] Respuesta de API con estructura inválida:', data);
    return null;
  } catch (err: any) {
    clearTimeout(timer);
    console.warn(`[Catalogo] No se pudo conectar con el VPS (${apiUrl}): ${err.message}`);
    return null;
  }
}

/**
 * Lee el catálogo que consume la tienda.
 *
 * Se prefiere `data/catalogo.web.json` (generado por scripts/preparar-imagenes.mjs):
 * apunta a fotos WebP en `public/img/productos` en vez de llevar el base64 dentro
 * del HTML. Si ese archivo no existe o no coincide en cantidad de productos con el
 * snapshot, se usa `data/catalogo.json` tal cual (con las fotos embebidas).
 */
export function leerCatalogoLocal(raiz: string): CatalogoData | null {
  const rutaSnapshot = path.join(raiz, 'data', 'catalogo.json');
  const rutaLigera = path.join(raiz, 'data', 'catalogo.web.json');

  const leer = (ruta: string): CatalogoData | null => {
    try {
      if (!fs.existsSync(ruta)) return null;
      return JSON.parse(fs.readFileSync(ruta, 'utf8')) as CatalogoData;
    } catch (e: any) {
      console.error(`[Catalogo] ${path.basename(ruta)} corrupto: ${e.message}`);
      return null;
    }
  };

  const snapshot = leer(rutaSnapshot);
  const ligero = leer(rutaLigera);

  if (ligero && snapshot && ligero.productos.length === snapshot.productos.length) {
    return ligero;
  }

  if (ligero && !snapshot) return ligero;
  return snapshot;
}

export async function obtenerCatalogo(opciones?: { raiz?: string; apiUrl?: string }): Promise<CatalogoData> {
  const raiz = opciones?.raiz || process.cwd();
  const apiUrl = opciones?.apiUrl || process.env.CATALOGO_API_URL || 'http://159.112.128.144:3000/api/public/catalogo';

  // Durante la compilación se usa lo que ya está en disco: las imágenes WebP se
  // generan antes (npm run imagenes) y descargar de nuevo el catálogo dejaría el
  // HTML apuntando a fotos que quizá no existen todavía. La sincronización es
  // explícita: `npm run sync` y luego `npm run build`.
  if (process.env.CATALOGO_OFFLINE !== '0') {
    const local = leerCatalogoLocal(raiz);
    if (local && local.productos.length > 0) {
      return local;
    }
  }

  let catalogoFresquito: CatalogoData | null = null;

  try {
    catalogoFresquito = await descargarCatalogoDesdeApi(apiUrl);
  } catch (e: any) {
    console.warn('[Catalogo] Error durante descarga:', e.message);
  }

  if (catalogoFresquito && catalogoFresquito.productos.length > 0) {
    try {
      const rutaSnapshot = path.join(raiz, 'data', 'catalogo.json');
      fs.mkdirSync(path.dirname(rutaSnapshot), { recursive: true });
      fs.writeFileSync(rutaSnapshot, JSON.stringify(catalogoFresquito, null, 2), 'utf8');
      console.log(`[Catalogo] ✓ Catálogo actualizado desde VPS (${catalogoFresquito.productos.length} productos). Snapshot guardado.`);
    } catch (err: any) {
      console.warn('[Catalogo] No se pudo guardar snapshot local:', err.message);
    }
    return catalogoFresquito;
  }

  const local = leerCatalogoLocal(raiz);
  if (local) {
    console.log(`[Catalogo] ℹ Usando snapshot local de respaldo (${local.productos.length} productos).`);
    return local;
  }

  // Fallback de emergencia si ni la API ni el snapshot existen
  console.warn('[Catalogo] ⚠ Usando catálogo vacío de emergencia.');
  return {
    ok: true,
    tienda: {
      nombre: 'FOTOSALBERTH',
      rubro: 'Fotografía, Cuadros y Papelería',
      telefono_whatsapp: '51999999999',
      moneda: 'PEN',
      simbolo: 'S/',
      ciudad: 'Trujillo',
      cobertura: 'Envíos a todo el país y recojo en tienda'
    },
    categorias: [],
    productos: [],
    total_productos: 0,
    generado_en: new Date().toISOString()
  };
}
