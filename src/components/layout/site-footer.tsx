import { getTranslations } from "next-intl/server";

import { brand } from "@/config/brand";

/**
 * Pie de página.
 *
 * Nota honesta: los enlaces de ayuda, vendedores y legales todavía no tienen página. En lugar de poner
 * enlaces que llevarían a un 404, se muestran como texto con la marca «Próximamente» y se convertirán en
 * enlaces cuando existan esas pantallas (F2, F7 y F10).
 */
export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <section aria-labelledby="footer-about">
          <h2 id="footer-about" className="font-heading text-sm font-semibold">
            {t("aboutTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("aboutText")}</p>
          <p className="mt-3 text-sm text-muted-foreground">{brand.supportEmail}</p>
        </section>

        <section aria-labelledby="footer-help">
          <h2 id="footer-help" className="font-heading text-sm font-semibold">
            {t("helpTitle")}
          </h2>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li>{t("help")}</li>
            <li>{t("shipping")}</li>
            <li>{t("trust")}</li>
          </ul>
        </section>

        <section aria-labelledby="footer-sellers">
          <h2 id="footer-sellers" className="font-heading text-sm font-semibold">
            {t("sellersTitle")}
          </h2>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li>{t("sellHere")}</li>
          </ul>
        </section>

        <section aria-labelledby="footer-legal">
          <h2 id="footer-legal" className="font-heading text-sm font-semibold">
            {t("legalLabel")}
          </h2>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li>{t("terms")}</li>
            <li>{t("privacy")}</li>
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            {t("copyright", { year, brand: brand.name })}
          </p>
        </section>
      </div>
    </footer>
  );
}
