import type { ItemCarrito, EstadoCarrito } from './tipos';
import type { ProductoCatalogo } from '../catalogo/tipos';

/**
 * Calcula los totales consolidados a partir de una lista de ítems.
 */
export function calcularTotales(items: ItemCarrito[]): EstadoCarrito {
  let totalItems = 0;
  let total = 0;

  for (const item of items) {
    totalItems += item.cantidad;
    total += item.precio * item.cantidad;
  }

  const totalRedondeado = Math.round(total * 100) / 100;

  return {
    items,
    totalItems,
    subtotal: totalRedondeado,
    total: totalRedondeado
  };
}

/**
 * Agrega un producto al carrito respetando stock máximo y disponibilidad.
 */
export function agregarProducto(
  items: ItemCarrito[],
  producto: ProductoCatalogo,
  cantidad: number = 1
): { items: ItemCarrito[]; error?: string } {
  if (cantidad <= 0) {
    return { items, error: 'La cantidad debe ser mayor a 0' };
  }

  if (producto.stock <= 0 || !producto.disponible) {
    return { items, error: `"${producto.nombre}" se encuentra agotado` };
  }

  const indiceExistente = items.findIndex(i => i.id === producto.id);

  if (indiceExistente >= 0) {
    const itemActual = items[indiceExistente];
    const nuevaCantidad = itemActual.cantidad + cantidad;

    if (nuevaCantidad > producto.stock) {
      return {
        items,
        error: `No puedes agregar más de ${producto.stock} unidades de "${producto.nombre}" (stock máximo alcanzado)`
      };
    }

    const nuevosItems = [...items];
    nuevosItems[indiceExistente] = {
      ...itemActual,
      cantidad: nuevaCantidad,
      precio: producto.precio,
      stockMaximo: producto.stock
    };

    return { items: nuevosItems };
  }

  const cantidadFinal = Math.min(cantidad, producto.stock);

  const nuevoItem: ItemCarrito = {
    id: producto.id,
    sku: producto.sku,
    nombre: producto.nombre,
    slug: producto.slug,
    precio: producto.precio,
    cantidad: cantidadFinal,
    stockMaximo: producto.stock,
    foto: producto.fotos[0] || '',
    categoria: producto.categoria
  };

  return { items: [...items, nuevoItem] };
}

/**
 * Actualiza la cantidad de un ítem en el carrito.
 */
export function actualizarCantidad(
  items: ItemCarrito[],
  productoId: number,
  nuevaCantidad: number
): ItemCarrito[] {
  if (nuevaCantidad <= 0) {
    return items.filter(i => i.id !== productoId);
  }

  return items.map(item => {
    if (item.id === productoId) {
      const cantidadAjustada = Math.min(nuevaCantidad, item.stockMaximo);
      return { ...item, cantidad: cantidadAjustada };
    }
    return item;
  });
}

/**
 * Elimina un ítem específico del carrito.
 */
export function eliminarItem(items: ItemCarrito[], productoId: number): ItemCarrito[] {
  return items.filter(i => i.id !== productoId);
}

/**
 * Reconcilia los productos guardados en localStorage contra el catálogo fresco.
 * Ajusta precios y reduce cantidades si el stock disminuyó en tienda.
 */
export function reconciliarCarrito(
  itemsGuardados: ItemCarrito[],
  catalogoProductos: ProductoCatalogo[]
): { items: ItemCarrito[]; avisos: string[] } {
  const avisos: string[] = [];
  const itemsActualizados: ItemCarrito[] = [];
  const mapaProductos = new Map(catalogoProductos.map(p => [p.id, p]));

  for (const item of itemsGuardados) {
    const prodCatalogo = mapaProductos.get(item.id);

    if (!prodCatalogo || prodCatalogo.stock <= 0 || !prodCatalogo.disponible) {
      avisos.push(`"${item.nombre}" se agotó y fue retirado de tu carrito.`);
      continue;
    }

    let cant = item.cantidad;
    if (cant > prodCatalogo.stock) {
      cant = prodCatalogo.stock;
      avisos.push(`La cantidad de "${item.nombre}" se ajustó a ${cant} por stock disponible.`);
    }

    if (item.precio !== prodCatalogo.precio) {
      avisos.push(`El precio de "${item.nombre}" se actualizó a S/ ${prodCatalogo.precio.toFixed(2)}.`);
    }

    itemsActualizados.push({
      ...item,
      nombre: prodCatalogo.nombre,
      precio: prodCatalogo.precio,
      stockMaximo: prodCatalogo.stock,
      cantidad: cant,
      foto: prodCatalogo.fotos[0] || item.foto,
      categoria: prodCatalogo.categoria
    });
  }

  return { items: itemsActualizados, avisos };
}
