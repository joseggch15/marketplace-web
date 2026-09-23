# 0018 · Preparación para publicar (F10)

- **Fecha:** 22 de septiembre de 2026
- **Estado:** aceptada

## Qué se decidió

1. **Esta fase no crea nada en la nube.** El dueño lo pidió así: no se crean cuentas, no se publica y no se gasta
   dinero. Lo que se entrega es el **recorrido completo probado**, la **auditoría** y `docs/PUBLICAR.md` con
   hosting, costos aproximados, cuentas a crear y los pasos exactos.
2. **Una sola prueba para el recorrido completo** (`e2e/journey.spec.ts`): registrarse, comprar, vender y
   administrar. Las cuatro fases ya están probadas por separado; lo que se comprueba aquí es que **el hilo
   encaja** con datos reales (la cuenta registrada aparece en el directorio de administración y la venta que se
   paga es la que el vendedor prepara). Solo en escritorio: repetirlo en móvil no aportaría información nueva.
3. **La auditoría se hace con lo que ya hay en el proyecto**, sin añadir herramientas que nadie va a mantener:
   `@axe-core/playwright` (WCAG 2.2 AA en páginas nuevas, claro y oscuro), el resumen de rutas y tamaños del
   `next build`, la revisión de metadatos, `sitemap.xml` y `robots.txt`, y la revisión de los avisos de ESLint y
   del compilador. Lighthouse o paquetes de métricas no se añaden en esta fase (no aportan nada que no se pueda
   medir ya en el despliegue real del dueño).
4. **Los costos son una tabla de referencia, no una promesa.** Los planes gratuitos cambian y algunos no permiten
   uso comercial: `docs/PUBLICAR.md` lo dice y remite a las condiciones de cada proveedor.
5. **`PUBLICAR.md` separa lo que ya funciona de lo que falta**: el prototipo no cobra dinero real, no envía
   correos reales sin SMTP y no trae observabilidad externa. Decirlo antes de publicar es más útil que descubrirlo
   después.
6. **Las capturas de la F10 se limitan a lo visible que cambia**: la portada y «mis compras» (las pantallas que
   tocó la F8/F9 y que el dueño quiere ver en el estado final). El resto de capturas de fases anteriores siguen
   valiendo.
