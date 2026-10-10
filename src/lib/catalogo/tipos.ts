export interface InfoTienda {
  nombre: string;
  rubro: string;
  telefono_whatsapp: string;
  moneda: string;
  simbolo: string;
  ciudad: string;
  cobertura: string;
}

export interface CategoriaCatalogo {
  id: number;
  nombre: string;
  slug: string;
  total_productos: number;
}

export interface ProductoCatalogo {
  id: number;
  sku: string;
  nombre: string;
  slug: string;
  categoria: string;
  categoria_id: number;
  familia: string;
  precio: number;
  precio_anterior: number | null;
  stock: number;
  disponible: boolean;
  descripcion: string;
  fotos: string[];
  specs: Record<string, string> | null;
}

export interface CatalogoData {
  ok: boolean;
  tienda: InfoTienda;
  categorias: CategoriaCatalogo[];
  productos: ProductoCatalogo[];
  total_productos: number;
  generado_en: string;
}
