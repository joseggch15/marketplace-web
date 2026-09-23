import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { StateCard } from "@/components/domain/state-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModerationActions } from "@/features/admin/components/moderation-actions";
import { isUuid, parseCursor, parseQuery } from "@/features/admin/params";
import { loadAdminSession } from "@/features/admin/server";
import { listPublicProducts } from "@/features/catalog/api";
import { fetchReviews } from "@/features/product/api";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { formatDateTime } from "@/lib/format/date";

/**
 * Moderar reseñas (`/es/admin/reviews`).
 *
 * Comprobación honesta de límites: la API **no** tiene un listado global de reseñas ni un filtro por
 * visibilidad; las reseñas se piden **por producto** y ese listado solo devuelve las publicadas. Así que la
 * pantalla funciona en dos pasos: se busca el producto (por nombre) y se moderan sus reseñas. Eso implica que
 * una reseña oculta desaparece de la lista y no hay forma de volver a publicarla desde aquí: se puede ocultar,
 * que es lo urgente, y queda anotado como laguna del backend en `docs/PENDIENTES-BACKEND.md`.
 *
 * La búsqueda es un formulario `GET` sobre la propia página: el texto va en la URL y la pantalla se pinta entera
 * en el servidor.
 */
export default async function AdminReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const session = await loadAdminSession();

  if (session === null) {
    notFound();
  }

  const t = await getTranslations("Admin");
  const activeLocale = await getLocale();
  const query = await searchParams;
  const q = parseQuery(query.q);
  const productParam = query.product;
  const productId = Array.isArray(productParam) ? productParam[0] : productParam;
  const cursor = parseCursor(query.cursor);

  const reviews =
    productId !== undefined && isUuid(productId)
      ? await fetchReviews(productId, { limit: 20, cursor })
      : null;

  const products =
    reviews === null && q !== null ? await listPublicProducts({ q, limit: 10 }) : null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-xl font-semibold">{t("reviews.title")}</h2>
      <p className="text-sm text-muted-foreground">{t("reviews.searchHint")}</p>

      <form
        action={`/${locale}/admin/reviews`}
        method="get"
        className="flex flex-wrap items-end gap-3"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reviews-q">{t("reviews.searchLabel")}</Label>
          <Input
            id="reviews-q"
            name="q"
            defaultValue={q ?? ""}
            maxLength={120}
            placeholder={t("reviews.searchPlaceholder")}
          />
        </div>
        <Button type="submit" size="lg">
          {t("reviews.search")}
        </Button>
      </form>

      {products !== null && products.ok
        ? products.data.items.length > 0 && (
            <ul className="flex flex-col gap-2">
              {products.data.items.map((product) => (
                <li
                  key={product.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <span className="font-medium">{product.title}</span>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/reviews?product=${product.id}`}>
                      {t("reviews.seeReviews")}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )
        : null}

      {products !== null && products.ok && products.data.items.length === 0 ? (
        <StateCard
          title={t("reviews.noProductsTitle")}
          description={t("reviews.noProductsDescription")}
        />
      ) : null}

      {reviews !== null ? (
        !reviews.ok ? (
          <StateCard
            tone="danger"
            title={t("unavailable.title")}
            description={t("unavailable.description")}
          />
        ) : reviews.data.items.length === 0 ? (
          <StateCard title={t("reviews.emptyTitle")} description={t("reviews.emptyDescription")} />
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{t("reviews.hiddenNote")}</p>

            <ul className="flex flex-col gap-3">
              {reviews.data.items.map((review) => (
                <li key={review.id}>
                  <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium">
                        {t("reviews.rating", { value: review.rating })}
                        {review.title === null ? null : ` · ${review.title}`}
                      </p>
                      {review.body === null ? null : (
                        <p className="text-sm text-muted-foreground">{review.body}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {t("reviews.written", {
                          date: formatDateTime(review.created_at, activeLocale) ?? "",
                        })}
                      </p>
                    </div>

                    <ModerationActions targetId={review.id} kinds={["hideReview"]} />
                  </article>
                </li>
              ))}
            </ul>

            {reviews.data.next_cursor === null ? null : (
              <div className="flex justify-center">
                <Button asChild variant="outline" size="lg">
                  <Link
                    href={`/admin/reviews?product=${productId ?? ""}&cursor=${encodeURIComponent(reviews.data.next_cursor)}`}
                  >
                    {t("more")}
                  </Link>
                </Button>
              </div>
            )}
          </>
        )
      ) : null}
    </section>
  );
}
