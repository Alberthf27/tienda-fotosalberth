# Diagnóstico UI — Tienda virtual FOTOSALBERTH vs Sercoplus

**Fecha:** 2026-10-22
**Objeto:** `tienda-fotosalberth` (Astro 5 + Tailwind 4, commit `1800b5a` "réplica fiel diseño retail estilo Sercoplus")
**Sitio auditado:** https://tienda-fotosalberth.alberthflores47.workers.dev
**Referencia:** https://sercoplus.com (PrestaShop, tema `v1_electro_105`)
**Método:** render real con Chrome 140 headless (puppeteer), viewport 1440×950 y 390×844, medición del DOM computed (alturas, tipografías, imágenes, conteo de nodos) + lectura del código fuente en `src/`.

> Sin interpretación subjetiva: todos los números de abajo salen de medir la página renderizada, no de "mirarla".

---

## 1. Veredicto

No es un problema de "colores mal elegidos". La tienda tiene **la pintura de Sercoplus** (barra roja `#e52e2e`, buscador con botón amarillo `#ffd741`, sidebar de departamentos) pero **no tiene el sistema de retail** que hace que Sercoplus se vea profesional: paginación, fotografía de producto optimizada, tipografía legible y densidad controlada.

El resultado se siente amateur por tres razones medibles:

1. **Entrega el catálogo completo (487 productos) en un solo documento de 11 MB**, con una página de 47 654 px en escritorio y **107 941 px en móvil**.
2. **El primer pantallazo no muestra ni un producto**: la primera tarjeta empieza en `y=905` de 950 px (escritorio) y en `y=1024` de 866 px (móvil).
3. **La tipografía dominante es de 10 px** y está rellena de señales comerciales inventadas (5 estrellas en los 487 productos, precio en dólares con tipo de cambio fijo).

---

## 2. Evidencia medida

### 2.1 Peso y estructura

| Métrica | Tienda FOTOSALBERTH | Sercoplus | Factor |
|---|---|---|---|
| HTML de la home | **11 158 KB** (11.4 MB) | 798 KB | **14×** |
| Alto de página (escritorio 1440) | **47 654 px** | 6 076 px | **7.8×** |
| Alto de página (móvil 390) | **107 941 px** | 9 698 px | **11×** |
| Tarjetas de producto en el DOM | **487** | ~40 por página | — |
| Imágenes en el DOM | 365 | 218 | — |
| Imágenes en base64 (`data:image`) | **365** | 0 | — |

`dist/producto/` = **487 páginas, 116 MB** (238 KB promedio por ficha).
`dist/categoria/` = 18 páginas, 15 MB.

### 2.2 Tipografía (caracteres visibles por tamaño)

| Tienda | Sercoplus |
|---|---|
| **10px/400 → 18 389 car.** | 15px/500 → 4 456 car. |
| **14px/700 → 15 488 car.** | 14px/400 → 3 223 car. |
| **10px/600 → 13 297 car.** | 15px/900 → 1 372 car. |
| 12px/700 → 9 422 car. | 14px/600 → 952 car. |
| 11px/600 → 8 687 car. | 13px/400 → 866 car. |
| 9px/700 → 1 503 car. | 11px/400 → 152 car. |
| **Elementos con texto < 12px: 4 583** | **30** |

El **37 % del texto visible de la tienda está a 10 px**. Sercoplus no baja de 13 px salvo 152 caracteres. Eso es lo que hace que la página se lea como una planilla y no como una tienda.

### 2.3 Primer pantallazo (lo que ve el cliente al entrar)

Escritorio 1440×950:

| Bloque | Top | Alto |
|---|---|---|
| Barra superior (moneda/teléfono) | 0 | 32 |
| Header (logo + buscador + carrito) | 32 | 124 |
| Nav roja | 111 | 44 |
| Vitrina principal (sidebar + banner) | 176 | 460 |
| Términos frecuentes | 667 | 30 |
| Catálogo y filtros | 721 | 159 |
| **Listado de productos** | **905** | 45 981 |

Móvil 390×866:

| Bloque | Top | Alto |
|---|---|---|
| Vitrina principal (banner) | 187 | 459 |
| Términos frecuentes | 678 | 30 |
| Catálogo y filtros | 732 | 267 |
| **Listado de productos** | **1024** | 105 304 |

En móvil hay que scrollear **1 024 px (más de una pantalla completa)** antes de ver el primer producto.

### 2.4 Las tarjetas

| | Tienda | Sercoplus |
|---|---|---|
| Tamaño | 232 × **454** px | 262 × 439 px |
| Imagen mostrada | 184 × 184 | 218 × 218 |
| Imagen natural | 400 × 400 | 268 × 268 |
| Escala | 0.49 (se reduce, correcto) | 0.87 |
| Productos sin foto | **122 de 487** → caja blanca con icono | 0 |

La tarjeta mide 454 px de alto para mostrar un cable de S/ 3.50. Ahí entra: foto cuadrada, familia, SKU, 5 estrellas, título, precio en soles, precio en dólares, stock, "Garantía taller" y botón.

### 2.5 Señales comerciales inventadas

| Señal | Cantidad medida | ¿Existe el dato en el POS? |
|---|---|---|
| Glifos ★ | **2 438** (487 × 5 estrellas, todas 5.0) | **No** — no hay sistema de reseñas |
| Precio en USD `($ x.xx)` | **487** | **No** — se calcula dividiendo entre **3.75 fijo** (`ProductCard.astro:19-20`) |
| "En stock" | 419 | Sí (`stock_actual`) |
| "¡En oferta!" | 1 | Sí (`precio_anterior`), pero el badge se repite en todas las tarjetas donde aplica |

Esto es lo que produce la sensación de "tienda de mentira": el 100 % de los productos tiene 5.0 estrellas, incluido un adaptador OTG.

### 2.6 Contraste de contenido (lo que de verdad diferencia a Sercoplus)

Medición de las capturas (1 440×950, misma ventana):

| | Tienda | Sercoplus |
|---|---|---|
| Peso del PNG | 238 KB | **929 KB** |
| Colores únicos | 20 015 | **70 381** |
| % casi-negro | **0.0 %** | 27.6 % |
| % casi-blanco | 32.2 % | 11 % |
| Franjas muertas en la 1ª pantalla | **sí** (`y≈480–720`) | ninguna |

Sercoplus construye la primera pantalla sobre fotografía (banners 1920×850 y fotos de producto); la tienda la construye sobre planos de color, y el banner principal **no tiene imagen**: es un gradiente `slate-900 → #0e3e7a` con un patrón de puntos (`index.astro:82-83`).

---

## 3. Causa raíz (ordenadas por impacto)

### C1 — Volcó el catálogo entero en un solo documento
`index.astro:291` hace `{productos.map(...)}` sobre los 487 productos, sin paginación ni carga incremental. En escritorio son 122 filas; en móvil, 244. Ninguna tienda de retail hace esto: Sercoplus pagina y usa carruseles de 20.

**Efecto:** página de 47 654 px / 107 941 px, HTML de 11 MB, primera pintura lenta y scroll infinito sin fin.

### C2 — Incrustó las fotos en base64 dentro del HTML
`data/catalogo.json` (5 MB) trae 365 `data:image/jpeg;base64`; el build los mete en cada `<img src>` (`ProductCard.astro:56`). Consecuencia: **11.4 MB de HTML que no se puede cachear por imagen** (cada visita vuelve a bajar las fotos dentro del documento), sin `srcset`, sin WebP, sin dimensiones.

**Efecto:** el peso no se reparte, se concentra en el documento principal.

### C3 — Copió la paleta, no el sistema tipográfico
La tienda usa `text-[9px]`, `text-[10px]`, `text-[11px]` en cascada y la fuente del sistema (`-apple-system, Segoe UI…`). Sercoplus usa **Roboto**, base **14–15 px**, tres pesos (400/500/900) y solo 30 elementos por debajo de 12 px.

**Efecto:** se lee como dashboard, no como tienda; en Windows el sistema cae a Segoe UI y los 10 px se ven aún más frágiles.

### C4 — Rellenó con datos comerciales que no existen
5 estrellas fijas en todas las tarjetas, precio en dólares con TC fijo 3.75, "Garantía taller" hardcodeada en cada card (`ProductCard.astro:84-87, 129`). Sercoplus no muestra estrellas: muestra "¡En Oferta!" solo cuando hay oferta real (20 casos en la home).

**Efecto:** credibilidad. Un catálogo con 487 productos perfectos de 5 estrellas se lee como maqueta.

### C5 — La primera pantalla no vende
Header 176 + banner 460 + filtros 159 = **825 px de 950** sin un solo producto. En móvil, 1 024 px. El banner además es un rectángulo oscuro sin producto ni oferta concreta.

**Efecto:** el cliente entra y no ve qué se vende.

### C6 — 122 productos sin foto se muestran como caja vacía
`ProductCard.astro:61-70`: cuando no hay foto, se dibuja un rectángulo blanco bordeado con un icono de 40 px y el texto "FOTOSALBERTH". No es un placeholder de categoría: parece un error de carga.

**Efecto:** una de cada cuatro tarjetas se ve rota. En la primera fila, 2 de 6.

### C7 — El catálogo no es el de Sercoplus (problema de encaje)
Taxonomía real: **Útiles y Librería 235** de 487 productos, Parlantes 46, Cables 38, Audífonos 22, Cargadores 15. La home se titula "Tecnología, Cómputo & Audio en Trujillo" y usa un lenguaje visual de retail de hardware (negro, rojo, banners gaming).

**Efecto:** aunque el CSS fuera perfecto, el diseño promete una tienda de laptops y muestra cuadernos y tintas. El "no se parece a Sercoplus" también es un problema de **qué se vende**, no solo de cómo se pinta.

### C8 — Detalles de acabado
- 3 `<h1>` en la home (hero, taller, carrito) → jerarquía rota y SEO débil.
- Iconos con emoji (🛡️ 🏬 🛵 💳 ☰) → dependen de la fuente de emoji del sistema, cambian de forma entre Windows/Android/iOS.
- Logo = cuadrado rojo con "FA"; no hay logotipo real ni banners.
- `border`, `shadow-xs`, `shadow-2xs` mezclados con `rounded-lg`/`rounded-xl` sin escala fija.

---

## 4. Qué copió y qué no

| Elemento de Sercoplus | ¿Está? | Comentario |
|---|---|---|
| Barra roja `#e52e2e` | Sí | Color correcto |
| Buscador con botón amarillo `#ffd741` | Sí | Correcto |
| Sidebar de departamentos a la izquierda | Sí | Pero solo 10 de 18 y sin subcategorías |
| Mega-menú de categorías | Sí | Sobredimensionado (min-height 360 px) |
| Precio doble S/ + USD | **Copiado mal** | Sercoplus muestra el precio real en la moneda elegida, no una conversión inventada |
| Paginación / carruseles de 20 | **No** | Se volcaron 487 |
| Fotografía de producto optimizada | **No** | base64, sin WebP ni tamaños |
| Tipografía Roboto 14–15 px | **No** | 10 px y fuente del sistema |
| Banners fotográficos 1920×850 | **No** | gradiente con puntitos |
| Bloque "OFERTAS ESPECIALES" con ofertas reales | Parcial | 1 oferta real en la home |
| Estrellas de valoración | **Inventado** | Sercoplus no las usa |

---

## 5. Plan de corrección propuesto (sin ejecutar aún)

**Fase 0 — Datos (bloqueante)**
1. `scripts/sync-catalogo.mjs`: descargar cada foto, redimensionar a 400×400 WebP, guardar en `public/img/productos/<sku>.webp`, y dejar en el JSON solo la ruta. Elimina los 5 MB de base64 y los 11 MB de HTML.
2. Añadir `precio_anterior` real desde el POS (ya existe la columna) y `stock`.

**Fase 1 — Estructura**
3. Home = escaparate: hero de 320 px con banner real + 4 bloques de 8 productos ("Ofertas", "Nuevos", "Más vendidos", "Por categoría") + accesos a departamentos.
4. Catálogo en `/catalogo` con **paginación de 24** (o "cargar más") y filtros server-side por query string (`?cat=&sub=&orden=&pagina=`).
5. Ficha de producto: 2 columnas (foto grande + datos), sin estrellas.

**Fase 2 — Sistema visual**
6. Una sola fuente (Inter o Roboto), base 15 px, escala 12/13/15/18/24/32; **eliminar todo `text-[9px]`, `text-[10px]`, `text-[11px]`**.
7. Tarjeta 240 px: foto 200×200, familia 12 px, título 14 px/600 a 2 líneas, precio 18 px/800, stock 12 px, botón 14 px.
8. Placeholder honesto: icono de la categoría + "Foto próximamente", nunca el nombre de la tienda.

**Fase 3 — Contenido**
9. Quitar estrellas y el USD inventado (o mostrar "≈ US$ x" con TC real y fecha).
10. Reetiquetar la propuesta: si 235 de 487 son librería, la home no puede decir "Cómputo & Audio" como titular.
11. Logo y 3 banners reales (fotos del taller/productos).

**Métrica de éxito:** HTML de la home < 250 KB, LCP < 2.5 s en 4G, primer producto visible antes de `y=600`, cero elementos con texto < 12 px, y 0 productos con `5.0` falso.

---

## 6. Anexo — cómo se reprodujo

```powershell
# capturas + métricas (Chrome 140 headless vía puppeteer del repo POS)
$env:NODE_PATH = 'E:\ALBERTH ALM\DOCUMENTOS\PROYECTOS\POS_FOTOSALBERTH\node_modules'
node C:\Users\ALBERTH\AppData\Local\Temp\shot\shot.cjs    # capturas
node C:\Users\ALBERTH\AppData\Local\Temp\shot\medir.cjs   # tipografía, imágenes, señales
node C:\Users\ALBERTH\AppData\Local\Temp\shot\layout.cjs  # bloques y primer pantallazo
```

Capturas en `E:\ALBERTH ALM\DOCUMENTOS\PROYECTOS\_diag-tienda\`:
`tienda-desktop-top.png`, `tienda-mobile-top.png`, `sercoplus-desktop-top.png`, `sercoplus-mobile-top.png`.

> Limitación del informe: el modelo que redacta no tiene entrada de imagen, así que **no se describieron visualmente las capturas**; las conclusiones visuales se derivan de geometría, estilos computados y estadística de píxeles (Pillow), no de mirar los PNG.
