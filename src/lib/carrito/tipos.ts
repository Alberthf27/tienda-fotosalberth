export interface ItemCarrito {
  id: number;
  sku: string;
  nombre: string;
  slug: string;
  precio: number;
  cantidad: number;
  stockMaximo: number;
  foto?: string;
  categoria?: string;
}

export interface EstadoCarrito {
  items: ItemCarrito[];
  totalItems: number;
  subtotal: number;
  total: number;
}
