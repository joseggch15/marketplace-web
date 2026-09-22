# Ideas fuera del alcance del prototipo

Aquí se anota **todo lo que se decidió no construir** (regla del dueño: si una funcionalidad no está en la lista
del alcance de prototipo, se escribe aquí y no se construye). No es una lista de deseos vacía: son cosas que la
API ya soporta en parte o que son naturales en un marketplace real, y que se retomarán cuando el prototipo esté
publicado y verificado.

| Idea | Por qué no entra ahora | Qué haría falta |
|---|---|---|
| Favoritos / lista de deseos | No está en el alcance de ninguna fase | Endpoint de favoritos en la API (hoy no existe) |
| Centro de notificaciones in-app | La API ya tiene `/notifications`, pero no es esencial para comprar ni para vender | Una campana en la cabecera y una página `/notifications` |
| Devoluciones y reembolsos desde la interfaz | El prototipo no cobra dinero real | Flujo de solicitud de devolución en la API y estados de reembolso visibles |
| Chat comprador–vendedor | Las preguntas públicas ya cubren la duda previa a la compra | Mensajería privada en la API (no existe) |
| Página de administración de cupones | El cupón del checkout ya se prueba con un código real | Enlazar `/coupons` (solo admin) en el panel |
| Selector de moneda y conversión informativa | Todo el prototipo se cobra y se muestra en COP | Consumir `/currencies` y guardar la preferencia en el perfil |
| Autocompletado con historial de búsqueda | La búsqueda ya es compartible por URL | Consumir `/catalog/search/suggest` y guardar el historial en el navegador |
| Logotipo de la tienda | No aporta a la compra ni a la venta del prototipo | Subida a `stores/` y el proxy ya reserva ese prefijo |
| Respuestas del vendedor a preguntas | El alcance del panel del vendedor no lo incluye | Pantalla de preguntas del vendedor (`POST /questions/{id}/answers` ya existe) |
| Promociones por tiempo limitado en la portada | Exigiría datos y reglas que el prototipo no tiene | Reglas de promoción en la API |
| Panel de administración de categorías y atributos | El catálogo de demostración ya trae categorías | Formularios sobre `/catalog/categories` y `/catalog/attributes` |
| Comparador de productos | No está en el alcance | Página propia con selección en el navegador |
| Reseñas con fotos y preguntas destacadas | Las reseñas ya se pueden dejar y moderar | Subida de imágenes en reseñas (la API no lo soporta) |
| 2FA y verificación de correo obligatoria | El prototipo no bloquea por correo verificado | Encender `REQUIRE_VERIFIED_EMAIL` y añadir el segundo factor |
