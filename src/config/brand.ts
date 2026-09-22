/**
 * Datos de marca centralizados.
 *
 * ⚠️ TODO(marca): el nombre es **provisional**. Antes de fijarlo hay que verificar que el dominio
 * esté libre y que la marca no esté registrada ante la Superintendencia de Industria y Comercio.
 * Cambiar el nombre aquí (y en `messages/*.json`) es todo lo que hace falta.
 */
export const brand = {
  /** Nombre visible en el encabezado, el pie y los títulos de página. */
  name: "Mercado Vivo",
  /** Nombre corto para el logotipo de texto y espacios reducidos (móvil). */
  shortName: "MercadoVivo",
  /** Descripción por defecto para SEO cuando una página no define la suya. */
  tagline: "marketplace",
  /** Correo de contacto mostrado en el pie. */
  supportEmail: "soporte@mercado-vivo.local",
} as const;

/**
 * Identificadores de la dirección visual «Mercado Vivo».
 *
 * Los colores viven en variables CSS (`src/styles/tokens.css`); aquí solo se documenta la intención
 * para que ningún componente invente un color propio.
 *
 * TODO(F1): proponer 2 alternativas al acento actual (turquesa) y validar contraste AA.
 */
export const visualDirection = {
  name: "Mercado Vivo",
  primary: "azul de confianza (transmite seguridad al comprar a vendedores desconocidos)",
  accent: "turquesa (reemplaza el amarillo de Mercado Libre para tener identidad propia)",
} as const;
