import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Envoltorios de las APIs de navegación de Next.js que ya consideran el idioma activo.
 * Usar siempre estos (`Link`, `redirect`, `usePathname`, `useRouter`, `getPathname`) en lugar de los
 * de `next/link` y `next/navigation`, para no olvidar el prefijo del idioma.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
