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

export async function obtenerCatalogo(opciones?: { raiz?: string; apiUrl?: string }): Promise<CatalogoData> {
  const raiz = opciones?.raiz || process.cwd();
  const rutaSnapshot = path.join(raiz, 'data', 'catalogo.json');
  const apiUrl = opciones?.apiUrl || process.env.CATALOGO_API_URL || 'http://159.112.128.144:3000/api/public/catalogo';

  let catalogoFresquito: CatalogoData | null = null;

  try {
    catalogoFresquito = await descargarCatalogoDesdeApi(apiUrl);
  } catch (e: any) {
    console.warn('[Catalogo] Error durante descarga:', e.message);
  }

  if (catalogoFresquito && catalogoFresquito.productos.length > 0) {
    try {
      fs.mkdirSync(path.dirname(rutaSnapshot), { recursive: true });
      fs.writeFileSync(rutaSnapshot, JSON.stringify(catalogoFresquito, null, 2), 'utf8');
      console.log(`[Catalogo] ✓ Catálogo actualizado desde VPS (${catalogoFresquito.productos.length} productos). Snapshot guardado.`);
      return catalogoFresquito;
    } catch (err: any) {
      console.warn('[Catalogo] No se pudo guardar snapshot local:', err.message);
      return catalogoFresquito;
    }
  }

  // Fallback al snapshot local
  if (fs.existsSync(rutaSnapshot)) {
    try {
      const contenido = fs.readFileSync(rutaSnapshot, 'utf8');
      const data = JSON.parse(contenido) as CatalogoData;
      console.log(`[Catalogo] ℹ Usando snapshot local de respaldo (${data.productos.length} productos).`);
      return data;
    } catch (e: any) {
      console.error('[Catalogo] Snapshot corrupto:', e.message);
    }
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
