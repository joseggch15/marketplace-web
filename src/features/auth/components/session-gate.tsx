"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { useRouter } from "@/i18n/navigation";

import { useSession } from "../hooks";

/**
 * Evita que alguien con la sesión abierta vea los formularios de entrar o registrarse.
 *
 * Si hay sesión, lleva al usuario a `next` (o a /account). Mientras se comprueba, se muestra el formulario
 * igualmente: así la página aparece al instante en lugar de parpadear con un esqueleto.
 */
export function SessionGate({ next, children }: { next?: string; children: React.ReactNode }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const { user } = useSession();
  const moved = useRef(false);

  useEffect(() => {
    if (user === null || moved.current) {
      return;
    }

    moved.current = true;
    router.replace(next ?? "/account");
    router.refresh();
  }, [next, router, user]);

  if (user !== null) {
    return (
      <p role="status" className="text-muted-foreground">
        {t("messages.redirecting")}
      </p>
    );
  }

  return <>{children}</>;
}
