import { ModerationActions } from "@/features/admin/components/moderation-actions";
import { StoreCard } from "@/features/admin/components/store-card";
import type { AdminStore } from "@/features/admin/types";

/**
 * Qué se puede hacer con una tienda **según su estado**.
 *
 * Se decide aquí y no en el JSX para que las tres pantallas del panel ofrezcan exactamente lo mismo y para que
 * no haya que repetir la regla: una tienda pendiente se aprueba o se rechaza; una aprobada se suspende; una
 * suspendida se reactiva. Una rechazada no ofrece nada: el backend no tiene un endpoint para aprobarla desde
 * ese estado.
 */
export function storeActions(store: AdminStore): ("approve" | "reject" | "suspend" | "restore")[] {
  switch (store.status) {
    case "pending":
      return ["approve", "reject"];
    case "approved":
      return ["suspend"];
    case "suspended":
      return ["restore"];
    default:
      return [];
  }
}

/** Ficha de tienda con sus acciones, lista para renderizar desde una pantalla de servidor. */
export function StoreCardWithActions({
  store,
  statusLabel,
  sinceLabel,
}: {
  store: AdminStore;
  statusLabel: string;
  sinceLabel: string;
}) {
  const actions = storeActions(store);

  return (
    <StoreCard store={store} statusLabel={statusLabel} sinceLabel={sinceLabel}>
      {actions.length === 0 ? null : <ModerationActions targetId={store.id} kinds={actions} />}
    </StoreCard>
  );
}
