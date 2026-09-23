import { cn } from "@/lib/utils";

/**
 * Tarjeta de una cifra del tablero del vendedor (presentación, sin estado propio).
 *
 * El panel del prototipo tiene **tres cifras y ningún gráfico**: cada tarjeta enseña el número, qué significa y
 * de dónde sale. Los textos llegan ya traducidos y los importes ya formateados por el servidor, así este
 * componente no sabe de monedas ni de idiomas.
 */

export type MetricCard = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "brand";
};

export function MetricCards({ cards, className }: { cards: MetricCard[]; className?: string }) {
  return (
    <ul className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {cards.map((card) => (
        <li
          key={card.id}
          className={cn(
            "flex flex-col gap-1 rounded-xl border p-4",
            card.tone === "brand" ? "border-brand/30 bg-brand-surface/50" : "border-border bg-card",
          )}
        >
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {card.label}
          </p>
          <p className="font-heading text-2xl font-bold">{card.value}</p>
          {card.hint === undefined ? null : (
            <p className="text-xs text-muted-foreground">{card.hint}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
