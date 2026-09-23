# 0017 · Panel de administración (F9)

- **Fecha:** 22 de septiembre de 2026
- **Estado:** aceptada

## Qué se decidió

1. **Guardia de rol en el servidor, con 404 y no 403.** El marco del panel (`/es/admin`) lee la sesión antes de
   pintar nada: sin sesión se va a `/login?next=/admin` y con una cuenta que **no** es administradora se responde
   **404**. El motivo: a un comprador no se le cuenta que existe un panel de administración. La comprobación de
   verdad la hace cada endpoint del backend (`403 forbidden`), que es quien manda.
2. **Rutas BFF de moderación con una pieza compartida** (`src/features/admin/bff.ts`): validar el identificador,
   leer el **motivo opcional**, pedir la sesión y traducir el error. Son ocho endpoints con el mismo ritual y
   escribirlo ocho veces garantiza que una de las ocho se olvide de algo.
3. **El motivo de moderación es opcional y no se inventa.** Cuando el administrador lo escribe, viaja en el
   cuerpo; cuando no, no se manda. El backend lo guarda en su libro de auditoría junto con quién lo hizo.
4. **Solo se ofrecen las acciones que tienen sentido** según el estado: una tienda pendiente se aprueba o se
   rechaza, una aprobada se suspende, una suspendida se reactiva, una rechazada no ofrece nada (el backend no
   tiene endpoint para aprobarla desde ahí).
5. **Las acciones destructivas piden confirmación** en el propio botón (el primer clic lo «arma» con otro texto y
   el segundo ejecuta). Es el mismo patrón que cancelar un pedido en «Mis compras», y evita modales.
6. **Tarjeta de tienda reutilizada** por la cola de trabajo (`/es/admin`) y el listado completo
   (`/es/admin/stores`), con el filtro por estado **en la URL** (`?status=pending`), como el resto de listados del
   proyecto.
7. **Preguntas: ciclo completo** (ocultar y volver a publicar). La API **sí** permite listar las ocultas
   (`?published=false`), así que el panel no tiene ninguna limitación aquí.
8. **Reseñas: dos pasos y una limitación dicha en voz alta.** La API no tiene listado global de reseñas ni filtro
   por visibilidad: las reseñas se piden **por producto** y solo devuelve las publicadas. Así que la pantalla
   busca el producto y muestra sus reseñas, y solo ofrece **ocultar**. Volver a publicar una reseña oculta no es
   posible desde la interfaz porque no hay forma de listarlas: queda anotado en `docs/PENDIENTES-BACKEND.md` y la
   propia pantalla lo dice, en lugar de ofrecer un botón que no puede funcionar.
9. **Usuarios: solo lectura.** Correo, rol, si el correo está verificado y, si vende, el nombre y el estado de su
   tienda. **Nunca** contraseñas, tokens ni datos de pago: la API no los consulta siquiera para ese listado. La
   búsqueda (`q`) y el filtro de rol son un formulario `GET`, así que quedan en la URL sin JavaScript.
10. **Sin gráficos**, como pidió el dueño: son listados y acciones. Lo que se enseña es lo que hay que hacer.
11. **La cuenta de administración la crea la semilla** (`node scripts/seed-demo.mjs`): registra
    `admin@tienda-demo.com` y la asciende con el mecanismo oficial del backend
    (`uv run python -m app.scripts.promote_admin <email>`), porque el rol no se puede cambiar desde la API. Es una
    cuenta **local**: no se crean cuentas en ningún servicio, no se publica nada y no se gasta dinero.
12. **Las e2e se omiten si no hay administrador** (`signInAsAdmin` en `e2e/support/demo.ts`), con un mensaje que
    explica cómo crear la cuenta. Es preferible omitir a fallar por una condición del entorno.
13. **Las tiendas no se suspenden en las pruebas**: suspender la tienda de demostración dejaría el catálogo sin
    productos y rompería el resto de la suite. La pantalla de tiendas se comprueba leyendo; la **moderación de
    verdad** se prueba con una pregunta (crear como comprador → ocultar → volver a publicar), que es reversible y
    no afecta a nadie más.

## Lo que lo encontró la compilación y las pruebas

- **`sellerErrorKey` no sirve para el panel**: los códigos `review_not_found` y `question_not_found` no existen en
  los mensajes del vendedor, y añadirlos allí habría dejado códigos que ninguna pantalla de compra usa. El panel
  tiene su **propia lista** (`ADMIN_ERROR_CODES`) con lo que sabe explicar; lo demás se cuenta como `unknown`.
- **`redirect()` no estrecha el tipo**: después de `if (user === null) redirect(...)` el compilador sigue pensando
  que `user` puede ser `null`, así que el marco devuelve `null` explícitamente después de redirigir.

## Lagunas del backend que quedan anotadas

1. **No hay listado de reseñas ocultas** (ni filtro de visibilidad en las reseñas): limita la moderación a
   ocultar, como se explica en el punto 8.
