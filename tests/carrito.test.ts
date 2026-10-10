import { describe, it, expect } from 'vitest';
import {
  agregarProducto,
  actualizarCantidad,
  eliminarItem,
  calcularTotales,
  reconciliarCarrito
} from '../src/lib/carrito/estado';
import type { ProductoCatalogo } from '../src/lib/catalogo/tipos';
import type { ItemCarrito } from '../src/lib/carrito/tipos';

describe('Lógica del Carrito de Compras', () => {
  const prodDisponible: ProductoCatalogo = {
    id: 10,
    sku: 'CUAD-10',
    nombre: 'Cuadro 30x40',
    slug: 'cuadro-30x40',
    categoria: 'Cuadros',
    categoria_id: 2,
    familia: 'Madera',
    precio: 45.0,
    precio_anterior: null,
    stock: 5,
    disponible: true,
    descripcion: 'Cuadro grande',
    fotos: ['https://ejemplo.com/cuadro.jpg'],
    specs: null
  };

  const prodAgotado: ProductoCatalogo = {
    id: 20,
    sku: 'FOT-20',
    nombre: 'Llavero Foto',
    slug: 'llavero-foto',
    categoria: 'Accesorios',
    categoria_id: 3,
    familia: 'Llaveros',
    precio: 8.0,
    precio_anterior: null,
    stock: 0,
    disponible: false,
    descripcion: 'Llavero acrílico',
    fotos: [],
    specs: null
  };

  it('agrega un producto correctamente', () => {
    const { items, error } = agregarProducto([], prodDisponible, 2);
    expect(error).toBeUndefined();
    expect(items.length).toBe(1);
    expect(items[0].cantidad).toBe(2);
    expect(items[0].precio).toBe(45.0);
  });

  it('no permite agregar un producto agotado (stock 0)', () => {
    const { items, error } = agregarProducto([], prodAgotado, 1);
    expect(error).toContain('agotado');
    expect(items.length).toBe(0);
  });

  it('no permite exceder el stock disponible al sumar cantidades', () => {
    const r1 = agregarProducto([], prodDisponible, 3);
    expect(r1.items[0].cantidad).toBe(3);

    // Intentar agregar 3 más (3 + 3 = 6 > stock 5)
    const r2 = agregarProducto(r1.items, prodDisponible, 3);
    expect(r2.error).toContain('stock máximo');
    expect(r2.items[0].cantidad).toBe(3); // Se mantiene en 3
  });

  it('actualiza y elimina cantidades', () => {
    let items: ItemCarrito[] = [
      {
        id: 10,
        sku: 'CUAD-10',
        nombre: 'Cuadro 30x40',
        slug: 'cuadro-30x40',
        precio: 45.0,
        cantidad: 2,
        stockMaximo: 5
      }
    ];

    items = actualizarCantidad(items, 10, 4);
    expect(items[0].cantidad).toBe(4);

    // Si se pasa del stock máximo lo capea
    items = actualizarCantidad(items, 10, 10);
    expect(items[0].cantidad).toBe(5);

    // Si se pasa a 0 se elimina
    items = actualizarCantidad(items, 10, 0);
    expect(items.length).toBe(0);
  });

  it('elimina ítem explícitamente', () => {
    const items: ItemCarrito[] = [
      { id: 1, sku: 'A', nombre: 'A', slug: 'a', precio: 10, cantidad: 1, stockMaximo: 5 },
      { id: 2, sku: 'B', nombre: 'B', slug: 'b', precio: 20, cantidad: 1, stockMaximo: 5 }
    ];
    const res = eliminarItem(items, 1);
    expect(res.length).toBe(1);
    expect(res[0].id).toBe(2);
  });

  it('calcula totales y subtotal con precisión monetaria', () => {
    const items: ItemCarrito[] = [
      { id: 1, sku: 'A', nombre: 'A', slug: 'a', precio: 19.99, cantidad: 2, stockMaximo: 5 },
      { id: 2, sku: 'B', nombre: 'B', slug: 'b', precio: 5.5, cantidad: 1, stockMaximo: 5 }
    ];
    const estado = calcularTotales(items);
    expect(estado.totalItems).toBe(3);
    // 19.99 * 2 = 39.98 + 5.50 = 45.48
    expect(estado.total).toBe(45.48);
  });

  it('reconcilia productos con el catálogo fresco (ajusta precio o elimina agotados)', () => {
    const itemsGuardados: ItemCarrito[] = [
      { id: 10, sku: 'CUAD-10', nombre: 'Cuadro 30x40', slug: 'cuadro-30x40', precio: 40.0, cantidad: 6, stockMaximo: 10 },
      { id: 20, sku: 'FOT-20', nombre: 'Llavero Foto', slug: 'llavero-foto', precio: 8.0, cantidad: 1, stockMaximo: 5 }
    ];

    const catalogoActual: ProductoCatalogo[] = [
      { ...prodDisponible, precio: 50.0, stock: 4 }, // Subió a 50 y stock bajó a 4
      prodAgotado // Stock 0
    ];

    const { items, avisos } = reconciliarCarrito(itemsGuardados, catalogoActual);
    expect(items.length).toBe(1); // Llavero fue retirado porque stock es 0
    expect(items[0].id).toBe(10);
    expect(items[0].precio).toBe(50.0); // Precio actualizado
    expect(items[0].cantidad).toBe(4); // Cantidad ajustada de 6 a 4
    expect(avisos.length).toBe(3);
  });
});
