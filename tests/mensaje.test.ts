import { describe, it, expect } from 'vitest';
import { generarMensajePedido, generarEnlaceWhatsApp } from '../src/lib/pedido/mensaje';
import type { ItemCarrito } from '../src/lib/carrito/tipos';
import type { InfoTienda } from '../src/lib/catalogo/tipos';

describe('Generador de Mensaje de Pedido para WhatsApp', () => {
  const tiendaDemo: InfoTienda = {
    nombre: 'FOTOSALBERTH',
    rubro: 'Fotografía y Cuadros',
    telefono_whatsapp: '51987654321',
    moneda: 'PEN',
    simbolo: 'S/',
    ciudad: 'Trujillo',
    cobertura: 'Envíos a todo el país'
  };

  const itemsDemo: ItemCarrito[] = [
    {
      id: 1,
      sku: 'CUAD-01',
      nombre: 'Cuadro 20x30 cm',
      slug: 'cuadro-20x30-cm',
      precio: 35.0,
      cantidad: 2,
      stockMaximo: 10
    },
    {
      id: 2,
      sku: 'FOT-02',
      nombre: 'Pack 10 Fotos 10x15',
      slug: 'pack-10-fotos',
      precio: 15.5,
      cantidad: 1,
      stockMaximo: 50
    }
  ];

  it('calcula subtotales y total correctamente', () => {
    const mensaje = generarMensajePedido(itemsDemo, tiendaDemo);
    expect(mensaje).toContain('FOTOSALBERTH');
    expect(mensaje).toContain('• *2x* Cuadro 20x30 cm _[CUAD-01]_');
    expect(mensaje).toContain('S/ 35.00 c/u  ➜  *S/ 70.00*');
    expect(mensaje).toContain('• *1x* Pack 10 Fotos 10x15 _[FOT-02]_');
    expect(mensaje).toContain('S/ 15.50 c/u  ➜  *S/ 15.50*');
    // Total: 70 + 15.5 = 85.50
    expect(mensaje).toContain('TOTAL A PAGAR: S/ 85.50');
  });

  it('genera un enlace de WhatsApp codificado y válido con prefijo 51', () => {
    const url = generarEnlaceWhatsApp(itemsDemo, tiendaDemo);
    expect(url).toMatch(/^https:\/\/wa\.me\/51987654321\?text=/);
    expect(url).toContain(encodeURIComponent('TOTAL A PAGAR: S/ 85.50'));
  });

  it('maneja cliente con nombre y notas adicionales', () => {
    const mensaje = generarMensajePedido(itemsDemo, tiendaDemo, {
      nombre: 'Carlos Mendoza',
      notas: 'Enviar en papel fotográfico mate por favor'
    });
    expect(mensaje).toContain('*Cliente:* Carlos Mendoza');
    expect(mensaje).toContain('*Notas:* Enviar en papel fotográfico mate por favor');
  });

  it('devuelve cadena vacía si no hay productos', () => {
    const mensaje = generarMensajePedido([], tiendaDemo);
    expect(mensaje).toBe('');
    const url = generarEnlaceWhatsApp([], tiendaDemo);
    expect(url).toBe('');
  });
});
