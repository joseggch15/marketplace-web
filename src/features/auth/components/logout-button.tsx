"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { useLogout } from "../hooks";

/**
 * Botón de cerrar sesión.
 *
 * No hay diálogo de confirmación a propósito: cerrar sesión es una acción reversible (volver a entrar) y
 * preguntar por ella solo añade fricción. La petición avisa al backend para que invalide el refresh token y
 * después borra las cookies.
 */
export function LogoutButton({ className }: { className?: string }) {
  const t = useTranslations("Auth");
  const logout = useLogout();

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className={className}
      disabled={logout.isPending}
      onClick={() => logout.mutate()}
    >
      <LogOut aria-hidden />
      {t("actions.logout")}
    </Button>
  );
}
