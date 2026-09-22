import { formatDate } from "@/lib/format/date";

import type { QuestionList } from "../types";

/**
 * Preguntas y respuestas del producto (componente de servidor: solo pinta).
 *
 * Qué se muestra y por qué:
 * - La pregunta y **las respuestas del vendedor** (el backend solo deja responder al dueño de la tienda, así
 *   que se pueden etiquetar así sin mentir).
 * - **No se muestra el nombre de quien pregunta**: la API pública no lo devuelve.
 * - Solo se pide la primera página (la API no acepta cursor en este endpoint), así que no se ofrece "ver más".
 *
 * Estados: con preguntas · sin preguntas (vacío, con la invitación a preguntar) · no se pudieron cargar.
 */
export type QuestionsSectionLabels = {
  title: string;
  empty: string;
  unavailable: string;
  sellerAnswer: string;
};

export function QuestionsSection({
  questions,
  labels,
  locale,
  timeZone,
  children,
}: {
  /** `null` cuando las preguntas no se pudieron cargar. */
  questions: QuestionList | null;
  labels: QuestionsSectionLabels;
  locale: string;
  timeZone?: string;
  /** El formulario de pregunta o, si no hay sesión, la invitación a entrar. */
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby="questions-title"
      className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:p-6"
    >
      <h2 id="questions-title" className="font-heading text-xl font-semibold">
        {labels.title}
      </h2>

      {questions === null ? (
        <p className="text-muted-foreground">{labels.unavailable}</p>
      ) : questions.items.length === 0 ? (
        <p className="text-muted-foreground">{labels.empty}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {questions.items.map((question) => (
            <li key={question.id} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
              <p className="text-sm whitespace-pre-line text-foreground">{question.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                <time dateTime={question.created_at}>
                  {formatDate(question.created_at, locale, timeZone)}
                </time>
              </p>

              {question.answers.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-3 border-l-2 border-border pl-3">
                  {question.answers.map((answer) => (
                    <li key={answer.id}>
                      <p className="text-xs font-medium text-foreground">{labels.sellerAnswer}</p>
                      <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
                        {answer.body}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <time dateTime={answer.created_at}>
                          {formatDate(answer.created_at, locale, timeZone)}
                        </time>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {children}
    </section>
  );
}
