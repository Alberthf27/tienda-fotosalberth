import type { CatalogoData, ProductoCatalogo } from './tipos';

export interface SubcategoriaItem {
  nombre: string;
  total: number;
  slug: string;
}

export interface CategoriaConSubcategorias {
  id: number;
  nombre: string;
  nombreCorto: string;
  slug: string;
  total: number;
  icono: string;
  subcategorias: SubcategoriaItem[];
}

function generarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatearNombre(nombre: string): string {
  // Convierte nombres en mayúsculas a Title Case limpio
  return nombre
    .toLowerCase()
    .split(' ')
    .map(p => {
      if (['&', 'y', 'de', 'para', 'en', 'con', 'a', 'la', 'el', 'los', 'las'].includes(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join(' ');
}

function resolverIcono(catNombre: string): string {
  const norm = catNombre.toUpperCase();
  if (norm.includes('CABLE') || norm.includes('CONECTIVIDAD')) return 'cables';
  if (norm.includes('PARLANTE') || norm.includes('RADIO')) return 'parlantes';
  if (norm.includes('AUDÍFONO') || norm.includes('AUDIFONO')) return 'audifonos';
  if (norm.includes('MOUSE') || norm.includes('TECLADO') || norm.includes('PAD')) return 'computo';
  if (norm.includes('MEMORIA') || norm.includes('ALMACENAMIENTO')) return 'almacenamiento';
  if (norm.includes('CARGADOR')) return 'cargadores';
  if (norm.includes('ADAPTADOR')) return 'adaptadores';
  if (norm.includes('CELULAR')) return 'celulares';
  if (norm.includes('TINTA') || norm.includes('IMPRESI')) return 'tintas';
  if (norm.includes('LIBRERÍA') || norm.includes('ÚTILES') || norm.includes('UTILES')) return 'libreria';
  if (norm.includes('LINTERNA') || norm.includes('ILUMINACI')) return 'iluminacion';
  if (norm.includes('PILA') || norm.includes('BATERIA')) return 'baterias';
  if (norm.includes('CALCULADORA')) return 'calculadoras';
  if (norm.includes('CONTROL')) return 'controles';
  if (norm.includes('VENTILADOR')) return 'ventiladores';
  if (norm.includes('MICRÓFONO') || norm.includes('MICROFONO')) return 'microfonos';
  if (norm.includes('ANTENA')) return 'antenas';
  return 'general';
}

export function construirTaxonomia(productos: ProductoCatalogo[]): CategoriaConSubcategorias[] {
  const mapaCategorias = new Map<string, {
    id: number;
    nombre: string;
    total: number;
    familias: Map<string, number>;
  }>();

  for (const prod of productos) {
    const catNom = (prod.categoria || 'Otras Categorías').trim();
    const famNom = (prod.familia || 'General').trim();
    const catId = prod.categoria_id || 0;

    if (!mapaCategorias.has(catNom)) {
      mapaCategorias.set(catNom, {
        id: catId,
        nombre: catNom,
        total: 0,
        familias: new Map<string, number>()
      });
    }

    const catData = mapaCategorias.get(catNom)!;
    catData.total++;
    catData.familias.set(famNom, (catData.familias.get(famNom) || 0) + 1);
  }

  const resultado: CategoriaConSubcategorias[] = [];

  for (const [catNom, datos] of mapaCategorias.entries()) {
    const subcategorias: SubcategoriaItem[] = [];

    for (const [famNom, total] of datos.familias.entries()) {
      subcategorias.push({
        nombre: famNom,
        total,
        slug: generarSlug(famNom)
      });
    }

    // Ordenar subcategorías por mayor número de productos
    subcategorias.sort((a, b) => b.total - a.total);

    resultado.push({
      id: datos.id,
      nombre: catNom,
      nombreCorto: formatearNombre(catNom),
      slug: generarSlug(catNom),
      total: datos.total,
      icono: resolverIcono(catNom),
      subcategorias
    });
  }

  // Ordenar categorías principales por volumen de productos
  resultado.sort((a, b) => b.total - a.total);

  return resultado;
}
