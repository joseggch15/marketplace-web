/**
 * Sembrador de datos de prueba para el marketplace (**solo desarrollo local**).
 *
 * Crea, usando la API pública del backend (nunca tocando su código ni su base de datos):
 *   1. un administrador de demo (usando el mecanismo oficial del backend:
 *      `uv run python -m app.scripts.promote_admin <email>`);
 *   2. un vendedor con su tienda, aprobada por el administrador;
 *   3. cuatro categorías y doce productos con variantes, precios, descuentos y stock;
 *   4. una imagen por producto, **generada en el propio script** (PNG de color plano, sin descargar nada);
 *   5. los productos publicados, para que aparezcan en la búsqueda.
 *
 * Es **idempotente**: si vuelve a ejecutarse, reutiliza lo que ya existe y no duplica nada.
 *
 * Uso:
 *   node scripts/seed-demo.mjs
 *   node scripts/seed-demo.mjs --api http://127.0.0.1:8000
 *
 * Requisitos: el backend en marcha y `uv` disponible (solo para ascender al administrador).
 */
/* eslint-disable no-console -- es un script de terminal: los mensajes por consola son su salida normal */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { deflateSync } from "node:zlib";

const run = promisify(execFile);

const args = process.argv.slice(2);
const apiIndex = args.indexOf("--api");
const API = (apiIndex >= 0 ? args[apiIndex + 1] : undefined) ?? process.env.SEED_API_URL ?? "http://127.0.0.1:8000";
const BACKEND_DIR = process.env.SEED_BACKEND_DIR ?? "E:\\ecommerce";

// Correos de demostración. Ojo: no se puede usar `@demo.local` ni `@example.com`
// (son dominios reservados y el backend los rechaza con un 422 de validación).
const ADMIN = { email: "admin@tienda-demo.com", fullName: "Administración de demo" };
const SELLER = { email: "vendedor@tienda-demo.com", fullName: "Vendedor de demo" };
const PASSWORD = "demo-marketplace-2026";

/** Resumen de lo que pasó, para imprimirlo al final. */
const summary = { creados: 0, reutilizados: 0, omitidos: 0, errores: [] };

/** Llama a la API y devuelve el estado y el cuerpo (nunca lanza por un 4xx). */
async function api(method, path, { token, body } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      accept: "application/json",
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;

  if (text.length > 0) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  return { status: response.status, data };
}

/** Registra un usuario si no existe (409 = ya existe) y devuelve su token de acceso. */
async function ensureUser({ email, fullName }) {
  const registro = await api("POST", "/api/v1/auth/register", {
    body: { email, password: PASSWORD, full_name: fullName },
  });

  if (registro.status === 201) {
    console.log(`  + usuario creado: ${email}`);
  } else if (registro.status === 409) {
    console.log(`  = usuario ya existía: ${email}`);
  } else {
    throw new Error(`No se pudo registrar ${email}: HTTP ${registro.status} ${JSON.stringify(registro.data)}`);
  }

  return login(email);
}

async function login(email) {
  const { status, data } = await api("POST", "/api/v1/auth/login", {
    body: { email, password: PASSWORD },
  });

  if (status !== 200) {
    throw new Error(`No se pudo entrar como ${email}: HTTP ${status} ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

/** PNG de color plano, construido a mano (sin dependencias ni descargas). */
function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

/** Genera un PNG cuadrado con una banda de color distinta por producto. */
function pngSquare(size, [red, green, blue]) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bits por canal
  header[9] = 2; // color: RGB
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const row = Buffer.alloc(1 + size * 3);
  for (let x = 0; x < size; x += 1) {
    const tone = 0.75 + 0.25 * (x / size);
    row[1 + x * 3] = Math.round(red * tone);
    row[2 + x * 3] = Math.round(green * tone);
    row[3 + x * 3] = Math.round(blue * tone);
  }

  const raw = Buffer.concat(Array.from({ length: size }, () => row));

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/**
 * Asciende a administrador con el script que ya trae el backend.
 * No modifica nada de `E:\ecommerce`: solo ejecuta su comando oficial.
 */
async function promoteAdmin(email) {
  try {
    const { stdout } = await run("uv", ["run", "python", "-m", "app.scripts.promote_admin", email], {
      cwd: BACKEND_DIR,
      windowsHide: true,
    });
    console.log(`  ${stdout.trim()}`);
  } catch (error) {
    throw new Error(
      `No se pudo ascender a administrador (¿'uv' instalado y backend listo?): ${error.message}`,
    );
  }
}

/** Crea la tienda del vendedor, o reutiliza la que ya tenga. */
async function ensureStore(token) {
  const existente = await api("GET", "/api/v1/sellers/me", { token });

  if (existente.status === 200 && existente.data?.id) {
    console.log(`  = tienda ya existía: ${existente.data.name} (${existente.data.status})`);
    summary.reutilizados += 1;
    return existente.data;
  }

  const { status, data } = await api("POST", "/api/v1/sellers/me", {
    token,
    body: { name: "Tienda Demo", description: "Tienda de prueba con datos de demostración." },
  });

  if (status !== 201) {
    throw new Error(`No se pudo crear la tienda: HTTP ${status} ${JSON.stringify(data)}`);
  }

  console.log(`  + tienda creada: ${data.name} (${data.status})`);
  summary.creados += 1;
  return data;
}

/** Aprueba la tienda con el administrador. Sin aprobarla no se pueden crear productos. */
async function approveStore(adminToken, store) {
  if (store.status === "approved") {
    console.log("  = la tienda ya estaba aprobada");
    return;
  }

  const { status, data } = await api("POST", `/api/v1/sellers/${store.id}/approve`, {
    token: adminToken,
  });

  if (status !== 200) {
    throw new Error(`No se pudo aprobar la tienda: HTTP ${status} ${JSON.stringify(data)}`);
  }

  console.log(`  + tienda aprobada (${data.status ?? "approved"})`);
}

/** Categorías de demo. Se reutilizan por nombre si ya existen. */
const CATEGORIES = [
  { key: "tech", name: "Tecnología" },
  { key: "home", name: "Hogar" },
  { key: "clothes", name: "Ropa" },
  { key: "sports", name: "Deportes" },
];

async function ensureCategories(adminToken, sellerToken) {
  const { data: existentes } = await api("GET", "/api/v1/catalog/categories");
  const porNombre = new Map((existentes ?? []).map((categoria) => [categoria.name, categoria]));
  const ids = {};

  for (const categoria of CATEGORIES) {
    const yaEsta = porNombre.get(categoria.name);

    if (yaEsta !== undefined) {
      console.log(`  = categoría ya existía: ${categoria.name}`);
      ids[categoria.key] = yaEsta.id;
      summary.reutilizados += 1;
      continue;
    }

    let { status, data } = await api("POST", "/api/v1/catalog/categories", {
      token: adminToken,
      body: { name: categoria.name },
    });

    // Si el backend las reserva al vendedor, se intenta con el token del vendedor.
    if (status === 403) {
      ({ status, data } = await api("POST", "/api/v1/catalog/categories", {
        token: sellerToken,
        body: { name: categoria.name },
      }));
    }

    if (status !== 201) {
      throw new Error(
        `No se pudo crear la categoría ${categoria.name}: HTTP ${status} ${JSON.stringify(data)}`,
      );
    }

    console.log(`  + categoría creada: ${data.name}`);
    ids[categoria.key] = data.id;
    summary.creados += 1;
  }

  return ids;
}
/**
 * Catálogo de demo: 12 productos, con variantes, precios en COP (texto, nunca float), descuentos en algunos y
 * stock variado. Los colores son solo para que cada imagen generada se distinga a simple vista.
 */
const PRODUCTS = [
  {
    title: "Audífonos inalámbricos con cancelación de ruido",
    brand: "Sonic", categoryKey: "tech", color: [40, 90, 160],
    description: "Bluetooth 5.3, 30 horas de batería y estuche de carga rápida.",
    variants: [
      { sku: "AUD-NEG", price: "299900.00", compareAt: "399900.00", stock: 25 },
      { sku: "AUD-BLA", price: "319900.00", stock: 12 },
    ],
  },
  {
    title: "Teclado mecánico compacto 65%",
    brand: "KeyLab", categoryKey: "tech", color: [70, 70, 90],
    description: "Interruptores táctiles, doble conexión y teclas intercambiables.",
    variants: [{ sku: "TEC-65", price: "249900.00", stock: 18 }],
  },
  {
    title: "Monitor 27 pulgadas 144 Hz",
    brand: "ViewMax", categoryKey: "tech", color: [25, 60, 120],
    description: "Panel IPS, 1 ms de respuesta y soporte ajustable en altura.",
    variants: [
      { sku: "MON-27", price: "989900.00", compareAt: "1199900.00", stock: 7 },
      { sku: "MON-32", price: "1349900.00", stock: 4 },
    ],
  },
  {
    title: "Cafetera de goteo con molinillo",
    brand: "CasaFina", categoryKey: "home", color: [150, 90, 60],
    description: "Muele al momento, 12 tazas y filtro permanente lavable.",
    variants: [{ sku: "CAF-12", price: "329900.00", stock: 9 }],
  },
  {
    title: "Juego de sartenes antiadherentes (3 piezas)",
    brand: "CasaFina", categoryKey: "home", color: [90, 100, 110],
    description: "Aluminio forjado, apto para todo tipo de cocina y lavavajillas.",
    variants: [
      { sku: "SAR-3", price: "189900.00", compareAt: "249900.00", stock: 21 },
      { sku: "SAR-5", price: "289900.00", stock: 6 },
    ],
  },
  {
    title: "Lámpara de escritorio LED regulable",
    brand: "Lumio", categoryKey: "home", color: [220, 190, 90],
    description: "Tres temperaturas de luz, brazo articulado y puerto USB.",
    variants: [{ sku: "LAM-LED", price: "89900.00", stock: 34 }],
  },
  {
    title: "Chaqueta impermeable de montaña",
    brand: "Ruta Andina", categoryKey: "clothes", color: [30, 110, 90],
    description: "Costuras selladas, capucha ajustable y bolsillos con cierre.",
    variants: [
      { sku: "CHA-S", price: "259900.00", stock: 5 },
      { sku: "CHA-M", price: "259900.00", compareAt: "319900.00", stock: 11 },
      { sku: "CHA-L", price: "269900.00", stock: 8 },
    ],
  },
  {
    title: "Camiseta de algodón orgánico",
    brand: "Ruta Andina", categoryKey: "clothes", color: [200, 200, 205],
    description: "Algodón orgánico peinado, corte recto y cuello reforzado.",
    variants: [
      { sku: "CAM-S", price: "79900.00", stock: 40 },
      { sku: "CAM-M", price: "79900.00", stock: 52 },
    ],
  },
  {
    title: "Zapatillas urbanas ligeras",
    brand: "Paso Firme", categoryKey: "clothes", color: [180, 60, 60],
    description: "Malla transpirable, plantilla acolchada y suela antideslizante.",
    variants: [
      { sku: "ZAP-39", price: "219900.00", compareAt: "279900.00", stock: 14 },
      { sku: "ZAP-41", price: "219900.00", stock: 16 },
      { sku: "ZAP-43", price: "229900.00", stock: 3 },
    ],
  },
  {
    title: "Bicicleta de montaña rin 29 (21 cambios)",
    brand: "Altura", categoryKey: "sports", color: [45, 130, 70],
    description: "Cuadro de aluminio, frenos de disco y suspensión delantera.",
    variants: [{ sku: "BIC-29", price: "1899900.00", compareAt: "2199900.00", stock: 5 }],
  },
  {
    title: "Mancuernas ajustables (par, 20 kg)",
    brand: "Altura", categoryKey: "sports", color: [60, 60, 65],
    description: "Discos intercambiables, agarre antideslizante y base incluida.",
    variants: [{ sku: "MAN-20", price: "459900.00", stock: 8 }],
  },
  {
    title: "Balón de fútbol profesional nº5",
    brand: "Cancha", categoryKey: "sports", color: [230, 230, 225],
    description: "Cosido a máquina, cámara de látex y acabado resistente al agua.",
    variants: [
      { sku: "BAL-5", price: "129900.00", stock: 30 },
      { sku: "BAL-4", price: "119900.00", stock: 12 },
    ],
  },
];

/** Crea un producto con sus variantes, si no existe ya uno con el mismo título. */
async function ensureProduct(sellerToken, titulosExistentes, producto, categoryId) {
  if (titulosExistentes.has(producto.title)) {
    console.log(`  = producto ya existía: ${producto.title}`);
    summary.reutilizados += 1;
    return null;
  }

  const { status, data } = await api("POST", "/api/v1/catalog/products", {
    token: sellerToken,
    body: {
      title: producto.title,
      description: producto.description,
      brand: producto.brand,
      category_id: categoryId,
      // El precio viaja como texto: el backend usa Decimal y el proyecto prohíbe el punto flotante.
      variants: producto.variants.map((variant) => ({
        sku: variant.sku,
        price: variant.price,
        ...(variant.compareAt === undefined ? {} : { compare_at_price: variant.compareAt }),
        stock: variant.stock,
      })),
    },
  });

  if (status !== 201) {
    summary.errores.push(`${producto.title}: HTTP ${status} ${JSON.stringify(data)}`);
    console.error(`  ! no se pudo crear ${producto.title}: HTTP ${status} ${JSON.stringify(data)}`);
    return null;
  }

  summary.creados += 1;
  return data;
}

/**
 * Genera una imagen PNG local, la sube al almacenamiento por el flujo oficial
 * (`upload-url` → `PUT` → adjuntar) y la deja como imagen principal del producto.
 */
async function uploadImage(sellerToken, product, color) {
  const url = await api("POST", "/api/v1/catalog/images/upload-url", {
    token: sellerToken,
    body: { content_type: "image/png", extension: "png" },
  });

  if (url.status !== 200) {
    summary.errores.push(`imagen de ${product.title}: URL HTTP ${url.status}`);
    return;
  }

  const png = pngSquare(600, color);
  const subida = await fetch(url.data.upload_url, {
    method: "PUT",
    headers: { "content-type": "image/png" },
    body: png,
  });

  if (!subida.ok) {
    summary.errores.push(`imagen de ${product.title}: subida HTTP ${subida.status}`);
    return;
  }

  const adjunta = await api("POST", `/api/v1/catalog/products/${product.id}/images`, {
    token: sellerToken,
    body: { object_key: url.data.object_key, alt: product.title, position: 0 },
  });

  if (adjunta.status !== 201) {
    summary.errores.push(`imagen de ${product.title}: adjuntar HTTP ${adjunta.status}`);
  }
}

async function main() {
  console.log(`Sembrador de datos de prueba → ${API}`);

  const salud = await api("GET", "/api/v1/health");

  if (salud.status !== 200) {
    throw new Error(
      `El backend no responde en ${API} (HTTP ${salud.status}). Arráncalo antes de sembrar los datos.`,
    );
  }

  console.log(`  backend: ${JSON.stringify(salud.data)}`);

  console.log("Usuarios:");
  const sellerToken = await ensureUser(SELLER);
  await ensureUser(ADMIN);

  console.log("Rol de administrador (con el script del propio backend):");
  await promoteAdmin(ADMIN.email);
  // Se entra de nuevo: el token anterior se emitió antes de ser administrador.
  const adminToken = await login(ADMIN.email);

  console.log("Tienda:");
  const store = await ensureStore(sellerToken);
  await approveStore(adminToken, store);

  console.log("Categorías:");
  const categories = await ensureCategories(adminToken, sellerToken);

  const { data: actuales } = await api("GET", "/api/v1/catalog/products", { token: sellerToken });
  const titulos = new Set((actuales ?? []).map((producto) => producto.title));

  console.log("Productos:");
  for (const producto of PRODUCTS) {
    const creado = await ensureProduct(sellerToken, titulos, producto, categories[producto.categoryKey]);

    if (creado === null) {
      continue;
    }

    await uploadImage(sellerToken, creado, producto.color);

    const publicado = await api("POST", `/api/v1/catalog/products/${creado.id}/publish`, {
      token: sellerToken,
    });

    if (publicado.status !== 200) {
      summary.errores.push(`publicar ${producto.title}: HTTP ${publicado.status}`);
    }

    console.log(`  + ${producto.title} (${producto.variants.length} variante/s)`);
  }

  console.log(`\nResumen: ${JSON.stringify(summary)}`);

  const busqueda = await api("GET", "/api/v1/catalog/search?limit=3");
  console.log(`Búsqueda de comprobación: ${JSON.stringify(busqueda.data)}`);

  if (summary.errores.length > 0) {
    console.error("\nHubo errores; revisa la lista de arriba.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`\nEl sembrador falló: ${error.message}`);
  process.exitCode = 1;
});

