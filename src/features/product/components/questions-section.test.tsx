import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import type { ProductQuestion } from "../types";
import { QuestionsSection, type QuestionsSectionLabels } from "./questions-section";

/**
 * Pruebas de la sección de preguntas.
 *
 * Se comprueba que la respuesta se etiqueta como **del vendedor** (el backend solo deja responder al dueño de
 * la tienda), que el nombre de quien pregunta no aparece (la API no lo devuelve) y que los tres estados
 * existen.
 */

const labels: QuestionsSectionLabels = {
  title: "Preguntas y respuestas",
  empty: "Todavía no hay preguntas sobre este producto. Puedes hacer la primera.",
  unavailable: "No pudimos cargar las preguntas.",
  sellerAnswer: "Respuesta del vendedor",
};

const question: ProductQuestion = {
  id: "q1",
  product_id: "p1",
  user_id: "u1",
  body: "¿Tiene garantía del vendedor?",
  created_at: "2026-03-12T10:00:00Z",
  answers: [
    {
      id: "a1",
      store_id: "s1",
      body: "Sí, un año de garantía directa con la tienda.",
      created_at: "2026-03-13T09:30:00Z",
    },
  ],
};

function renderSection(ui: ReactElement) {
  return render(<NextIntlClientProvider locale="es">{ui}</NextIntlClientProvider>);
}

describe("QuestionsSection", () => {
  it("muestra la pregunta y la respuesta del vendedor con sus fechas", () => {
    renderSection(
      <QuestionsSection
        questions={{ items: [question], next_cursor: null }}
        labels={labels}
        locale="es-CO"
      >
        <p>formulario</p>
      </QuestionsSection>,
    );

    expect(screen.getByRole("heading", { name: "Preguntas y respuestas" })).toBeVisible();
    expect(screen.getByText("¿Tiene garantía del vendedor?")).toBeVisible();
    expect(screen.getByText("Respuesta del vendedor")).toBeVisible();
    expect(screen.getByText("Sí, un año de garantía directa con la tienda.")).toBeVisible();
    // Las dos fechas van en elementos `time` con la fecha ISO original en el atributo.
    expect(
      screen.getByText("¿Tiene garantía del vendedor?").closest("li")?.querySelectorAll("time"),
    ).toHaveLength(2);
  });

  it("no muestra el nombre de quien pregunta (la API no lo devuelve)", () => {
    renderSection(
      <QuestionsSection
        questions={{ items: [question], next_cursor: null }}
        labels={labels}
        locale="es-CO"
      >
        <p>formulario</p>
      </QuestionsSection>,
    );

    expect(screen.queryByText("u1")).toBeNull();
  });

  it("invita a preguntar cuando todavía no hay preguntas", () => {
    renderSection(
      <QuestionsSection questions={{ items: [], next_cursor: null }} labels={labels} locale="es-CO">
        <p>formulario</p>
      </QuestionsSection>,
    );

    expect(screen.getByText(labels.empty)).toBeVisible();
    expect(screen.getByText("formulario")).toBeVisible();
  });

  it("si no se pudieron cargar lo dice y aun así deja preguntar", () => {
    renderSection(
      <QuestionsSection questions={null} labels={labels} locale="es-CO">
        <p>formulario</p>
      </QuestionsSection>,
    );

    expect(screen.getByText(labels.unavailable)).toBeVisible();
    expect(screen.getByText("formulario")).toBeVisible();
  });
});
