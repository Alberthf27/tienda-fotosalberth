# Peso de la tienda: fotos fuera del HTML (2026-11-08)

## Problema

La portada pesaba **10.87 MB** y tardaba en cargar. El origen no era el diseño
sino el transporte del catálogo: el endpoint `GET /api/public/catalogo` entrega
cada foto como `data:image/jpeg;base64` (~9 KB), y Astro las insertaba **dos veces
por producto**:

1. en el atributo `src` de la tarjeta;
2. otra vez dentro de `data-producto="{...}"` (el JSON que usa el carrito).

Medición sobre `dist/index.html` (487 productos, 365 con foto):

| Componente | Peso |
|---|---|
| HTML total | 10.87 MB |
| Base64 (730 apariciones: 365 `img` + 365 `data-producto`) | **8.85 MB** |
| Solo el atributo `data-producto` | 4.52 MB |

Además, al ir embebidas el navegador no puede cachear cada foto por separado,
no hay `srcset` y no hay formato moderno.

## Cambio

`scripts/preparar-imagenes.mjs` (nuevo, usa `sharp`):

- lee `data/catalogo.json` (el snapshot fiel del VPS, no se modifica);
- convierte cada foto a **WebP** en dos tamaños: **268 px** y **400 px**;
- escribe los archivos en `public/img/productos/<slug>-268.webp` y `-400.webp`;
- genera `data/catalogo.web.json`, idéntico al original pero con `fotos` y
  `fotos_mini` apuntando a las rutas WebP.

Se ejecuta automáticamente: `npm run build` = `preparar-imagenes && astro build`.
`src/lib/catalogo/snapshot.ts` prefiere `catalogo.web.json` cuando existe y tiene
el mismo número de productos que el snapshot.

`ProductCard.astro` ahora emite `srcset` + `sizes` + `width/height` +
`decoding="async"`, así el móvil descarga la versión de 268 px.

## Resultado medido (mismo catálogo, 487 productos)

| Métrica | Antes | Después | Δ |
|---|---|---|---|
| `dist/index.html` | 10.87 MB | **2.16 MB** | **−80 %** |
| Base64 en el HTML | 8.85 MB | **0** | −100 % |
| `data-producto` (487) | 4.52 MB | 0.17 MB | −96 % |
| Imágenes con `srcset` | 0 | **365** | — |
| Archivos WebP generados | 0 | 730 (4.54 MB en total) | — |
| `dist/` completo | 143 MB | 118 MB | −17 % |
| Build | 20.8 s (con la versión inicial inline) | **7.2 s** | — |

Verificación en navegador (Chrome 156 headless, 1440×950, scroll completo):

```
imágenes: 365   cargadas: 365   rotas: 0   pendientes: 0
data: URIs: 0   fallos HTTP: 0
DOM listo: 388 ms (servidor local)
```

## Lo que queda pendiente (siguiente fase)

**El HTML sigue en 2.16 MB y la página mide 47 654 px** porque los 487 productos
se renderizan en un solo documento. Eso se resuelve con paginación (24 por
página) — es el paso 2 del plan, no parte de este cambio.

Otras fichas: `dist/producto/*` promedia **212 KB** por página (104.7 MB las 507).
Bajaría al quitar el bloque de relacionados o paginándolo.

## Notas de operación

- Las imágenes generadas están en `.gitignore`: se rehacen en cada build a partir
  del snapshot. Si el VPS está caído, `npm run build` funciona igual porque el
  base64 vive en `data/catalogo.json`.
- Para regenerar todo tras cambiar fotos en el POS:
  `npm run sync && IMAGENES_FORZAR=1 npm run imagenes && npm run build`
- `sharp` quedó en `dependencies` (versión 0.34.5, libvips 8.18.7).
