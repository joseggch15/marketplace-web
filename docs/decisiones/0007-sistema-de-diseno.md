# 0007 · Sistema de diseño (Fase 1)

**Fecha:** Fase 1 · **Estado:** aceptada

## Qué se construyó

Una página interna **`/design-system`** (con `noindex`, fuera del `sitemap.xml` y bloqueada en `robots.txt`)
que muestra todos los componentes con sus variantes y estados, más nueve componentes de dominio reutilizables
en `src/components/domain/`.

## Decisiones y por qué

### 1. Los componentes de dominio no traducen: reciben los textos por props

Cada componente recibe sus etiquetas ya traducidas (`label`, `labels`, `emptyLabel`…). Motivos:

- Funciona igual en el servidor y en el navegador sin enviar mensajes de i18n al cliente (menos peso).
- Los componentes se pueden probar sin montar el idioma, y el texto que se muestra queda explícito en el
  lugar donde se decide (la página).
- Se puede usar el mismo componente en el panel del vendedor con otro texto.

### 2. El acento se cambia con un solo atributo

El acento vive en `src/styles/tokens.css` en un bloque único (`--brand-accent*`). Las alternativas se activan
con `data-accent` en el `<html>`:

```html
<html data-accent="coral">   <!-- o data-accent="violeta" -->
```

Ventajas: cambiar el acento de todo el sitio es editar **una línea** en el layout, y `/design-system` puede
mostrar los tres lado a lado (los presets también están escritos para un contenedor dentro de una página
oscura) sin falsear los colores.

### 3. Contraste validado por prueba automática (no a ojo)

`src/lib/color/tokens-contrast.test.ts` lee `tokens.css` y comprueba **56 pares** de colores: tokens base,
tokens de los tres presets de acento y el verde relleno con texto encima, en modo claro y oscuro, con los
mínimos de WCAG AA (4,5:1 texto y 3:1 gráficos).

Correcciones que salieron de esta validación:

- El turquesa base se oscureció de `#00a99d` a `#009a8f`: el original daba 2,73:1 sobre el fondo claro y los
  elementos gráficos (estrellas de la calificación, bordes activos) exigen 3:1.
- Se añadió el par `--brand-success-strong` / `--brand-success-on-strong` para el paso completado del
  checkout: el verde brillante con texto blanco solo llegaba a 3,37:1.
- El borde de la miniatura activa de la galería usa `--brand-text` (6,47:1) en lugar del turquesa base.

### 4. Estados: se implementan los que existen de verdad

El proyecto pide seis estados por componente, pero no todos tienen sentido en todos ellos. Para no inventar
estados falsos, cada componente implementa los que aplican y lo documenta:

| Componente | Estados |
|---|---|
| `Price`, `RatingStars`, `DealBadge`, `CheckoutSteps`, `OrderTimeline` | normal · cargando (esqueleto) · vacío/sin dato · error |
| `ProductCard` | normal · hover · foco · agotado · sin imagen · cargando |
| `VariantSelector` | normal · hover · foco · seleccionado · deshabilitado (sin stock) · error · cargando |
| `QuantityStepper` | normal · hover · foco · deshabilitado · cargando · error (límite superado) |
| `ImageGallery` | normal · hover · foco · miniatura activa · sin imágenes · error de carga · cargando |

### 5. Decisiones de producto que protegen al usuario

- **No hay insignias de urgencia ni de escasez.** No existe «¡quedan 2!», ni contadores, ni descuentos que
  caducan en 5 minutos. Si algún día se muestra el stock, será el stock real del backend.
- **Nada de comprar más de lo que hay:** los límites del selector de cantidad vienen del stock real, y al
  intentar pasarse se avisa con `role="alert"` (no se ignora en silencio).
- **El estado nunca depende solo del color:** insignias, pasos y línea de tiempo llevan icono + texto, y el
  texto de estado se anuncia a lectores de pantalla.
- **El foco siempre es visible** (contorno sólido de 2 px, 4,6:1 de contraste) incluso en componentes que
  ocultan su borde por defecto.

### 6. Pruebas

- **Unitarias (Vitest + Testing Library):** formato de dinero y fechas con `Intl`, comportamiento de los
  componentes interactivos (teclado, límites, estados deshabilitados) y accesibilidad básica (nombres
  accesibles, `aria-current`, `role="alert"`).
- **End-to-end (Playwright + axe):** `/design-system` en español e inglés, en modo claro y oscuro, a 375 px y
  1280 px, con comprobaciones de `noindex`, de nombres accesibles en todos los botones y de interacción real
  con el teclado.
- **Dobles de prueba** (`src/tests/mocks/`): `next/navigation`, `next/link` y `next/image` se sustituyen por
  versiones mínimas porque no existen en jsdom. `next-intl` se procesa con Vite (`server.deps.inline`) para
  que los alias se apliquen.

### 7. Interpretación de la regla «ningún texto visible en los componentes»

La regla protege el **texto para el usuario**. En la página interna `/design-system` sí aparecen
identificadores técnicos (nombres de tokens como `--primary`, `font-heading`, nombres de componentes como
`ProductCard`): son documentación del sistema, no copia de producto, y no se traducen a propósito para que el
equipo los reconozca.

## Consecuencias

- Añadir una pantalla nueva del marketplace es componer piezas ya probadas, con los estados resueltos.
- Elegir acento no puede romper la accesibilidad: la prueba de contraste falla si un preset baja del mínimo.
- Pendiente para el dueño del producto: elegir el acento definitivo (turquesa, coral o violeta).
