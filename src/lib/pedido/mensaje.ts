import type { ItemCarrito } from '../carrito/tipos';
import type { InfoTienda } from '../catalogo/tipos';

export interface DatosCliente {
  nombre?: string;
  notas?: string;
}

/**
 * Formatea un número como moneda peruana o configurada.
 */
export function formatearPrecio(monto: number, simbolo: string = 'S/'): string {
  return `${simbolo} ${monto.toFixed(2)}`;
}

/**
 * Genera el texto del mensaje formal para enviar a WhatsApp.
 */
export function generarMensajePedido(
  items: ItemCarrito[],
  tienda: InfoTienda,
  cliente?: DatosCliente
): string {
  if (!items || items.length === 0) {
    return '';
  }

  const simbolo = tienda.simbolo || 'S/';
  const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const lineas: string[] = [];

  lineas.push(`👋 *¡Hola ${tienda.nombre}! Quisiera realizar el siguiente pedido:*`);
  lineas.push('');

  if (cliente?.nombre && cliente.nombre.trim()) {
    lineas.push(`👤 *Cliente:* ${cliente.nombre.trim()}`);
    lineas.push('');
  }

  lineas.push('📦 *DETALLE DEL PEDIDO:*');
  lineas.push('────────────────────────');

  for (const item of items) {
    const subtotal = item.precio * item.cantidad;
    const skuInfo = item.sku ? ` _[${item.sku}]_` : '';
    lineas.push(`• *${item.cantidad}x* ${item.nombre}${skuInfo}`);
    lineas.push(`   ${formatearPrecio(item.precio, simbolo)} c/u  ➜  *${formatearPrecio(subtotal, simbolo)}*`);
  }

  lineas.push('────────────────────────');
  lineas.push(`💰 *TOTAL A PAGAR: ${formatearPrecio(total, simbolo)}*`);
  lineas.push('');

  if (cliente?.notas && cliente.notas.trim()) {
    lineas.push(`📝 *Notas:* ${cliente.notas.trim()}`);
    lineas.push('');
  }

  lineas.push('📍 *Ciudad:* ' + (tienda.ciudad || 'Trujillo'));
  lineas.push('¿Me confirman la disponibilidad para coordinar el pago y entrega? ¡Muchas gracias!');

  return lineas.join('\n');
}

/**
 * Genera la URL directa de WhatsApp con el mensaje codificado limpiamente.
 */
export function generarEnlaceWhatsApp(
  items: ItemCarrito[],
  tienda: InfoTienda,
  cliente?: DatosCliente
): string {
  const mensaje = generarMensajePedido(items, tienda, cliente);
  if (!mensaje) return '';

  // Limpiar número de teléfono (solo dígitos)
  let telefonoLimpio = (tienda.telefono_whatsapp || '').replace(/\D/g, '');
  if (!telefonoLimpio.startsWith('51') && telefonoLimpio.length === 9) {
    telefonoLimpio = '51' + telefonoLimpio;
  }

  return `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
}
