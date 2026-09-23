import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { StateCard } from "@/components/domain/state-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listQuestions } from "@/features/admin/api";
import { ModerationActions } from "@/features/admin/components/moderation-actions";
import { parseCursor } from "@/features/admin/params";
import { loadAdminSession } from "@/features/admin/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { formatDateTime } from "@/lib/format/date";

/**
 * Preguntas de los compradores (`/es/admin/questions`), con filtro por visibilidad.
 *
 * La API **sí** permite listar las preguntas ocultas (`published=false`), así que aquí se puede hacer el ciclo
 * completo: ocultar una pregunta que incumple las normas y volver a publicarla cuando se corrija. Es el mismo
 * listado que alimenta la ficha del producto, con el título del producto al lado para saber de qué se habla.
 *
 * El filtro y el cursor viven en la URL: la vista es compartible y el botón «atrás» funciona.
 */
export default async function AdminQuestionsPage({
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
  const publishedParam = Array.isArray(query.published) ? query.published[0] : query.published;
  const published = publishedParam === "true" ? true : publishedParam === "false" ? false : null;
  const cursor = parseCursor(query.cursor);

  const questions = await listQuestions(session.accessToken, { published, cursor, limit: 20 });

  if (!questions.ok) {
    return (
      <StateCard
        tone="danger"
        title={t("unavailable.title")}
        description={t("unavailable.description")}
      />
    );
  }

  const filterHref = (value: "all" | "true" | "false") =>
    value === "all" ? "/admin/questions" : `/admin/questions?published=${value}`;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-heading text-xl font-semibold">{t("questions.title")}</h2>
        <Badge variant="outline">{questions.data.items.length}</Badge>
      </div>

      <nav aria-label={t("questions.filterLabel")} className="flex flex-wrap gap-3 text-sm">
        <Link href={filterHref("all")} className="text-primary underline-offset-4 hover:underline">
          {t("questions.filterAll")}
        </Link>
        <Link href={filterHref("true")} className="text-primary underline-offset-4 hover:underline">
          {t("questions.filterPublished")}
        </Link>
        <Link
          href={filterHref("false")}
          className="text-primary underline-offset-4 hover:underline"
        >
          {t("questions.filterHidden")}
        </Link>
      </nav>

      {questions.data.items.length === 0 ? (
        <StateCard
          title={t("questions.emptyTitle")}
          description={t("questions.emptyDescription")}
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {questions.data.items.map((question) => (
              <li key={question.id}>
                <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{question.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("questions.asked", {
                        date: formatDateTime(question.created_at, activeLocale) ?? "",
                      })}
                      {" · "}
                      {t("questions.answers", { count: question.answer_count })}
                    </p>
                    {question.product_id === null ? null : (
                      <Link
                        href={`/p/${question.product_id}`}
                        className="w-fit text-sm text-primary underline-offset-4 hover:underline"
                      >
                        {t("questions.product", {
                          title: question.product_title ?? t("questions.unknownProduct"),
                        })}
                      </Link>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant={question.is_published ? "secondary" : "outline"}>
                      {question.is_published ? t("questions.published") : t("questions.hidden")}
                    </Badge>
                    <ModerationActions
                      targetId={question.id}
                      kinds={[question.is_published ? "hideQuestion" : "publishQuestion"]}
                    />
                  </div>
                </article>
              </li>
            ))}
          </ul>

          {questions.data.next_cursor === null ? null : (
            <div className="flex justify-center">
              <Button asChild variant="outline" size="lg">
                <Link
                  href={`/admin/questions?published=${published === null ? "" : String(published)}&cursor=${encodeURIComponent(questions.data.next_cursor)}`}
                >
                  {t("more")}
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
