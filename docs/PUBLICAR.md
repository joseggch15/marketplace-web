# Cómo publicar el marketplace (F10)

**Este documento no ejecuta nada: prepara la publicación.** No se ha creado ninguna cuenta, no se ha publicado
nada y no se ha gastado dinero. Los pasos que requieren cuentas o pagos los hace el dueño.

## Qué hay que publicar

| Pieza           | Qué es                                                        | Necesita                                                |
| --------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| **Frontend**    | Next.js 16 (App Router) + React, en `E:\ecommerce-web`        | Node.js 20+ y acceso al backend por red                 |
| **Backend**     | FastAPI (monolito modular) en `E:\ecommerce`, contenedor Docker | 1 vCPU / 512 MB–1 GB, y las tres dependencias de abajo |
| **PostgreSQL**  | Base de datos (datos de negocio)                              | Versión 16, con extensiones estándar                    |
| **Redis**       | Carrito, reservas y limitadores de frecuencia                 | 25 MB sobran para empezar                               |
| **S3 / MinIO**  | Imágenes de productos (el backend devuelve claves, no URLs)   | Un bucket privado público por proxy                     |
| **SMTP**        | Correos de verificación y avisos de pedido                    | Un proveedor transaccional                              |

El frontend es **BFF**: el navegador solo habla con Next.js, que guarda los tokens en cookies httpOnly y llama al
backend. Es decir, el servidor de Next.js tiene que poder alcanzar la URL pública del backend.

## Costos mensuales aproximados

Precios de referencia para un **prototipo con poco tráfico**. Los planes gratuitos cambian y algunos no permiten
uso comercial: hay que leerlos antes de elegir.

| Servicio                              | Opción gratuita                                        | Opción recomendada para empezar      | Costo aprox./mes |
| ------------------------------------- | ------------------------------------------------------ | ------------------------------------ | ---------------- |
| Frontend (Vercel)                     | Hobby (solo uso personal/no comercial)                 | Pro (20 USD por usuario)             | 0–20 USD         |
| Backend (Render / Railway / Fly.io)   | Render Free (se duerme; sirve para demos)              | Render Starter o Fly `shared-cpu-1x` | 0–7 USD          |
| PostgreSQL (Neon / Supabase / Render) | Neon Free (0.5 GB) o Supabase Free                     | Neon Launch (0.5–10 USD)             | 0–10 USD         |
| Redis (Upstash)                       | Free (10 000 comandos/día)                             | Pay-as-you-go                        | 0–5 USD          |
| Imágenes (Cloudflare R2)              | 10 GB gratis y sin costo de salida                     | R2 (0,015 USD/GB)                    | 0–1 USD          |
| Correo (Resend / Brevo)               | 3 000 correos/mes                                      | Resend Pro o Brevo Starter           | 0–20 USD         |
| Dominio                               | —                                                      | `.com` con Cloudflare Registrar      | 10–15 USD/año    |
| **Total de arranque**                 | **0 USD** (con las limitaciones de los planes gratuitos) | **Vercel Pro + backend + base + correo** | **≈ 35–60 USD** |

Alternativa de bajo costo: un **VPS** (por ejemplo Hetzner CX22, ≈ 5 USD/mes) con Docker Compose para backend,
PostgreSQL, Redis y MinIO, y el frontend en Vercel. Es más barato y más trabajo de mantenimiento (copias de
seguridad, actualizaciones y TLS los gestiona el dueño).

## Cuentas que hay que crear (las crea el dueño)

1. **Vercel** (frontend) — plan Hobby o Pro.
2. **Render** (o Railway / Fly.io) (backend en contenedor).
3. **Neon** o **Supabase** (PostgreSQL gestionado).
4. **Upstash** (Redis).
5. **Cloudflare R2** (o AWS S3) (imágenes) + un dominio propio o el subdominio del proveedor.
6. **Resend** o **Brevo** (correo) y verificar el dominio remitente (SPF y DKIM).
7. **Registrador de dominio** (Cloudflare Registrar, Namecheap…).

Ninguna de estas cuentas requiere tarjeta si se empieza por los planes gratuitos.

## Pasos exactos

### 1. Base de datos y Redis

1. Crear la base en Neon (o Supabase) y copiar su **cadena de conexión** (`postgresql+asyncpg://…`; el backend usa
   SQLAlchemy asíncrono).
2. Crear la base de **datos de prueba** en la misma instancia (o en otra), para no mezclar.
3. Crear la base de Redis en Upstash y copiar su URL (`rediss://…` con contraseña).
4. Anotar que el backend **necesita PostgreSQL 16** y que las migraciones las aplica el propio despliegue con
   `alembic upgrade head`.

### 2. Backend (Render, ejemplo)

1. Nuevo **Web Service** apuntando al repositorio del backend; entorno **Docker** (usa el `Dockerfile` del repo).
2. Plan Starter (el Free se duerme y el primer pedido tardaría ~30 s en responder).
3. Variables de entorno (todas son secretos, van en el panel del proveedor, **nunca** en el repositorio):

   - `DATABASE_URL` — cadena de Neon/Supabase.
   - `REDIS_URL` — URL de Upstash.
   - `JWT_SECRET` (o el nombre que use el backend) — cadena aleatoria de 64 caracteres, distinta de la de
     desarrollo.
   - `S3_ENDPOINT_URL`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_ACCESS_KEY`, `S3_REGION` — del bucket de imágenes.
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` — del proveedor de correo.
   - `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` —
     **claves de sandbox** mientras el prototipo no cobre de verdad.
   - `CORS_ORIGINS` — la URL pública del frontend (una sola, sin comodines).
   - `DEFAULT_CURRENCY=COP`, `REQUIRE_VERIFIED_EMAIL=true`.

4. Comando de arranque: el `Dockerfile` ya lo trae; si el proveedor pide uno, `alembic upgrade head && uvicorn
   app.main:app --host 0.0.0.0 --port $PORT`.
5. Comprobar `https://<backend>/api/v1/health` (tiene que responder `ok` con `database` y `redis`).

### 3. Frontend (Vercel)

1. Importar el repositorio del frontend; framework detectado: **Next.js**; sin comandos personalizados
   (`pnpm build` y `pnpm start` son los del `package.json`).
2. Variables de entorno:
   - `BACKEND_URL=https://<backend>` (solo servidor: es la URL que usa el BFF).
   - `NEXT_PUBLIC_SITE_URL=https://<dominio>` (público: lo usan el canonical, `hreflang`, `sitemap.xml` y las
     imágenes).
   - Las de medios (`S3_*`) **solo** si el proxy de medios las necesita para leer los objetos.
3. Dominio: añadir el dominio propio en Vercel y apuntar los DNS del registrador.
4. Comprobar `/es`, `/es/search`, `/es/seller` y `/sitemap.xml`.

### 4. Webhooks de la pasarela (sandbox)

1. En Mercado Pago (sandbox) y Stripe (modo prueba), configurar la URL de webhook:
   `https://<backend>/api/v1/webhooks/payments/<proveedor>`.
2. Copiar el **secreto de firma** de cada proveedor a las variables del backend y **reiniciar** el servicio.
3. Probar con el simulador de pagos de la aplicación (`POST /api/v1/payments/<id>/simulate?outcome=succeeded`), que
   recorre el mismo camino que un webhook real.

### 5. Cuentas de demostración y datos

- En producción **no** se ejecuta `scripts/seed-demo.mjs`: crea cuentas con contraseñas conocidas. Si se quieren
  datos de muestra, se hacen a mano o en un entorno aparte.
- La cuenta de administración se crea registrándose y ejecutando en el servidor
  `uv run python -m app.scripts.promote_admin <correo>`.

## Comprobaciones después de publicar

1. `GET /api/v1/health` en verde y **latencia** razonable (desde el mismo país).
2. `/es` carga, el buscador encuentra productos y las imágenes salen por `/api/media/...` (no enlazan a S3).
3. Registro, verificación por correo (llega el correo), inicio de sesión y cierre de sesión.
4. Compra completa con **pago de prueba** y pedido visible en «Mis compras».
5. Panel del vendedor: crear un producto, publicarlo, cambiar stock y preparar un envío.
6. Panel de administración: aprobar una tienda de prueba y moderar una pregunta.
7. `sitemap.xml` y `robots.txt` accesibles; el panel y la cuenta responden `noindex`.
8. HTTPS en los dos dominios, cookies `Secure` (el frontend las marca así cuando `NODE_ENV=production`).
9. Copia de seguridad de la base activada en el proveedor y una **restauración de prueba** hecha al menos una vez.

## Lo que este prototipo **no** hace todavía

- **No cobra dinero real**: las pasarelas están en modo de prueba y solo se aprueba o rechaza desde el simulador.
- **No envía correos reales** si no se configura SMTP: en desarrollo se leen en Mailpit.
- **No tiene despliegue continuo programado**: se publica a mano cuando el dueño lo decida.
- **No incluye observabilidad externa** (Sentry, métricas): hay logs JSON con `request_id` y un health check.
