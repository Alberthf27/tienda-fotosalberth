# TIENDA FOTOSALBERTH

Catálogo web interactivo y tienda virtual para **FOTOSALBERTH** con costo de servidor **$0 en Cloudflare** y pedidos directos a **WhatsApp**.

```
┌────────────────────────────────────────┐       ┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│        VPS (Oracle Cloud)              │       │     Cloudflare Workers / Pages       │       │          Cliente (Móvil/PC)          │
│     POS FOTOSALBERTH (MySQL 8)         │       │                                      │       │                                      │
│                                        │       │    Astro 5 (output: 'static')        │ HTML  │   Catálogo instantáneo (< 0.5s)      │
│   GET /api/public/catalogo ────────────┼──────▶│    Snapshot: data/catalogo.json      │──────▶│   Buscador + Filtros en vivo         │
│                                        │ Build │    Tailwind CSS 4                    │       │   Carrito en localStorage            │
│   Deploy Hook (Webhook POST) ──────────┼──────▶│    Rebuild automático en 45 seg      │       │   Finalizar ➔ wa.me/519...           │
└────────────────────────────────────────┘       └──────────────────────────────────────┘       └──────────────────────────────────────┘
```

---

## Características Principales

1. **Ultra Rápido (< 500 ms)**: Sitio estático pre-compilado servido desde el CDN global de Cloudflare. 100/100 en Google Lighthouse.
2. **Costo $0 Permanente**: Ancho de banda ilimitado y SSL gratuito usando Cloudflare Static Assets.
3. **Resiliencia de Catálogo**: Si el VPS se apaga, reinicia o no tiene internet, la tienda **nunca se cae**; sirve el último snapshot guardado en `data/catalogo.json`.
4. **Carrito Interactivo**:
   - Persistencia local en `localStorage`.
   - Control de stock en tiempo real (bloquea agregado si el producto está "Agotado").
   - Slide-over drawer fluido con controles de cantidad y subtotal/total.
5. **Checkout Directo por WhatsApp**:
   - Genera enlace `https://wa.me/51...` con mensaje estructurado: saludo, resumen de ítems con precio unitario, notas del cliente y total en Soles (S/).
6. **Código Limpio y Probado**: 100% TypeScript con suite de pruebas unitarias en Vitest.

---

## Comandos Rápidos

```bash
# Instalar dependencias
npm install

# Modo desarrollo local (http://localhost:4321)
npm run dev

# Ejecutar pruebas unitarias
npm test

# Compilar producción (descarga catálogo del VPS y genera dist/)
npm run build

# Vista previa de la compilación
npm run preview
```

---

## Despliegue en Cloudflare ($0)

### Opción A: Despliegue Directo con Wrangler
```bash
npx wrangler deploy
```

### Opción B: Cloudflare Pages / Workers Builds (Automático con Git)
1. Conectar el repositorio en el panel de Cloudflare.
2. Comando de build: `npm run build`
3. Directorio de salida: `dist`
4. Variable de entorno: `CATALOGO_API_URL = http://159.112.128.144:3000/api/public/catalogo`
5. Crear un **Deploy Hook** en *Settings > Builds > Deploy Hooks* y configurarlo en el VPS para que cada venta o cambio de precio reconstruya la tienda en segundos.
