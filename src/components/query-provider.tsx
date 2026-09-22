"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Proveedor de TanStack Query.
 *
 * Se crea el cliente dentro de `useState` para que sea **uno por navegador** (si se creara en el cuerpo del
 * componente, cada render tendría su propia caché y se perdería el estado).
 *
 * Ajustes pensados para una tienda:
 * - `staleTime` corto (30 s): los datos del catálogo cambian con frecuencia, pero no queremos repetir la
 *   misma petición al navegar entre páginas.
 * - `retry: 0`: si la sesión caducó, reintentar no arregla nada; el usuario debe volver a entrar.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 0, refetchOnWindowFocus: false },
          mutations: { retry: 0 },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
