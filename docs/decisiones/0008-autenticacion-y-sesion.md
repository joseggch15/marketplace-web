# 0008 · Autenticación y sesión (BFF con cookies httpOnly)

- **Fecha:** 22 de septiembre de 2026 (Fase 2)
- **Estado:** aceptada

## Contexto

El backend expone `POST /api/v1/auth/login` (devuelve un par de tokens: access de 15 minutos y refresh de 7
días), `/auth/refresh`, `/auth/logout`, verificación de correo, recuperación de contraseña y las rutas de
perfil y direcciones (`GET/PATCH /api/v1/users/me`, CRUD de `/users/me/addresses`). Los tokens son JWT y el
backend los valida con `Authorization: Bearer`.

Regla no negociable del proyecto: **el navegador nunca ve ni guarda tokens**. Además, todas las respuestas de
error de la API siguen RFC 9457 con un campo `code` estable.

## Decisión

1. **Patrón BFF (Backend For Frontend).** El navegador solo habla con rutas propias (`/api/auth/*`,
   `/api/account/*`). Esas rutas, que corren en el servidor de Next.js, llaman al backend con el cliente
   generado (`openapi-fetch`) y son las únicas que ven los tokens.
2. **Los tokens viven en cookies `httpOnly`.** `mv_access` (15 minutos) y `mv_refresh` (7 días), con
   `Secure` en producción, `SameSite=Lax` y `Path=/`. `localStorage` y `sessionStorage` quedan prohibidos para
   cualquier cosa relacionada con la sesión (hay una prueba end-to-end que lo comprueba).
3. **Quién renueva la sesión.** En Next.js solo pueden escribir cookies las **rutas BFF** y las Server
   Actions, no los Server Components. Por eso `getCurrentUser()` (usado por las páginas) es de **solo
   lectura**: si el access token caducó, devuelve `null` y la página privada redirige a `/login?next=…`. La
   renovación real la hace `GET /api/auth/session` y `POST /api/auth/refresh`, que sí tienen respuesta donde
   escribir la cookie nueva, y `withAccessToken()` (para las operaciones del área privada) que reintenta una
   vez tras renovar.
4. **El refresh token rota y se guarda siempre.** El backend invalida el refresh anterior en cada uso; si la
   respuesta no se guardara, el usuario quedaría fuera. `refreshSession()` guarda el par nuevo en la misma
   operación.
5. **El navegador mantiene la sesión viva con un latido.** El hook `useSession()` consulta
   `/api/auth/session` cada 10 minutos, que renueva el access token si hace falta. Así, navegando por el
   sitio, el usuario no vuelve a escribir su contraseña.
6. **Errores traducidos por `code`.** `authErrorMessageKey()` valida el código contra una lista conocida
   (`invalid_credentials`, `email_already_registered`, `invalid_refresh_token`, `invalid_token`,
   `too_many_requests`, `validation_error`, `unauthorized`) y los textos viven en `messages/*.json`
   (`Auth.errors`). Si el código es desconocido, se muestra un mensaje genérico y **nunca** el texto en inglés
   ni el código crudo.
7. **Validación duplicada a propósito.** Los esquemas Zod del navegador copian los límites del backend
   (contraseña de 8 a 128, país de 2 letras, moneda de 3) y el correo se normaliza a minúsculas igual que allá.
   El servidor BFF **vuelve a validar** cada cuerpo: la validación del navegador es comodidad, no seguridad.
8. **Sin auto-login después del registro.** `POST /auth/register` no devuelve tokens, así que tras crear la
   cuenta se invita a iniciar sesión. El login **no** exige tener el correo verificado (el backend tampoco lo
   exige), y la cuenta muestra el estado de verificación para poder recordarlo antes de comprar.

## Alternativas descartadas

- **Guardar el token en el navegador (`localStorage`) y llamar al backend directamente.** Descartada: un
  XSS se lleva la sesión completa y contradice la regla del proyecto.
- **Renovar la sesión desde un Server Component.** Descartada: Next.js no permite escribir cookies ahí, así
  que habría que perder el token nuevo o mantener estado paralelo. El latido del navegador lo resuelve sin
  trucos.
- **Renovar dentro del middleware (`src/proxy.ts`).** Es viable (el middleware sí puede escribir cookies) y
  sería la evolución natural si el latido del navegador no bastara. Se descarta por ahora para no mezclar la
  detección de idioma de next-intl con la sesión en el mismo archivo.
- **Recuperar la contraseña con el token en la URL de nuestra propia API.** Descartada: los tokens de un solo
  uso viajan en el **cuerpo** de la petición para no quedar en los registros del servidor ni en el historial
  del navegador.

## Consecuencias

- Cada endpoint nuevo del área privada debe llamar a `withAccessToken()`, nunca leer la cookie a mano.
- Las páginas privadas deben leer al usuario con `getCurrentUser()` y redirigir si es `null`; el guardia vive
  en `src/app/[locale]/account/layout.tsx`.
- Los mensajes que usan los componentes cliente viajan en `NextIntlClientProvider` (hoy: `Error` y `Auth`); al
  añadir un namespace nuevo para un componente cliente hay que incluirlo en `clientMessages` del layout.
