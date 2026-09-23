import { Badge } from "@/components/ui/badge";

import type { AdminStore } from "../types";

/**
 * Ficha de una tienda en el panel de administración (presentación, sin estado propio).
 *
 * Enseña lo que hace falta para decidir: cómo se llama, qué vende, cuándo lo pidió y en qué estado está. Las
 * **acciones** llegan como `children` (las pone la pantalla, que es quien sabe qué se puede hacer según el
 * estado) y el texto del estado y la fecha llegan ya traducidos.
 *
 * Nunca se enseña el `user_id` ni ningún dato interno del vendedor: no aportan a la decisión.
 */
export function StoreCard({
  store,
  statusLabel,
  sinceLabel,
  children,
}: {
  store: AdminStore;
  statusLabel: string;
  sinceLabel: string;
  /** Acciones de moderación (componente cliente) ya compuestas por la pantalla. */
  children?: React.ReactNode;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-base font-semibold">{store.name}</h3>
          {store.description === null ? null : (
            <p className="text-sm text-muted-foreground">{store.description}</p>
          )}
          <p className="text-xs text-muted-foreground">{sinceLabel}</p>
        </div>

        <Badge variant={store.status === "approved" ? "secondary" : "outline"}>{statusLabel}</Badge>
      </div>

      {children}
    </article>
  );
}
