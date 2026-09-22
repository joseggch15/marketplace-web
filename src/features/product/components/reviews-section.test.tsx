import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import type { ProductReview } from "../types";
import { ReviewsSection, type ReviewsSectionLabels } from "./reviews-section";

/**
 * Pruebas de la sección de reseñas.
 *
 * Se protegen las reglas del proyecto: la reseña verificada solo se marca si el backend lo dice, sin reseñas
 * no se pinta ninguna nota, y los tres estados (con datos, vacío y no disponible) existen.
 */

const labels: ReviewsSectionLabels = {
  title: "Reseñas",
  average: "4,5 de 5 estrellas, 12 reseñas",
  empty: "Todavía no hay reseñas de este producto.",
  unavailable: "No pudimos cargar las reseñas.",
  verified: "Compra verificada",
  ratingOf: (rating) => `${rating} de 5 estrellas`,
  more: "Ver más reseñas",
  reset: "Volver a las más recientes",
};

const review: ProductReview = {
  id: "r1",
  product_id: "p1",
  user_id: "u1",
  store_id: "s1",
  rating: 5,
  title: "Excelente calidad",
  body: "Llegó rápido y bien empacado.",
  verified_purchase: true,
  created_at: "2026-03-12T10:00:00Z",
  updated_at: "2026-03-12T10:00:00Z",
};

function renderSection(ui: ReactElement) {
  return render(<NextIntlClientProvider locale="es">{ui}</NextIntlClientProvider>);
}

describe("ReviewsSection", () => {
  it("muestra la nota media, la reseña verificada y el texto", () => {
    renderSection(
      <ReviewsSection
        reviews={{ items: [review], rating_average: "4.5", rating_count: 12 }}
        labels={labels}
        locale="es-CO"
        moreHref={null}
        resetHref={null}
      />,
    );

    expect(screen.getByRole("heading", { name: "Reseñas" })).toBeVisible();
    expect(screen.getByRole("img", { name: labels.average })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Excelente calidad" })).toBeVisible();
    expect(screen.getByText("Llegó rápido y bien empacado.")).toBeVisible();
    expect(screen.getByText("Compra verificada")).toBeVisible();
  });

  it("marca la reseña como verificada solo cuando el backend lo dice", () => {
    renderSection(
      <ReviewsSection
        reviews={{
          items: [{ ...review, verified_purchase: false }],
          rating_average: "5",
          rating_count: 1,
        }}
        labels={labels}
        locale="es-CO"
        moreHref={null}
        resetHref={null}
      />,
    );

    expect(screen.queryByText("Compra verificada")).toBeNull();
  });

  it("sin reseñas no pinta ninguna nota e invita a que llegue la primera", () => {
    renderSection(
      <ReviewsSection
        reviews={{ items: [], rating_average: null, rating_count: 0 }}
        labels={labels}
        locale="es-CO"
        moreHref={null}
        resetHref={null}
      />,
    );

    expect(screen.getByText(labels.empty)).toBeVisible();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("si no se pudieron cargar lo dice", () => {
    renderSection(
      <ReviewsSection
        reviews={null}
        labels={labels}
        locale="es-CO"
        moreHref={null}
        resetHref={null}
      />,
    );

    expect(screen.getByText(labels.unavailable)).toBeVisible();
  });

  it("ofrece ver más reseñas y volver a las más recientes", () => {
    renderSection(
      <ReviewsSection
        reviews={{ items: [review], rating_average: "5", rating_count: 40 }}
        labels={labels}
        locale="es-CO"
        moreHref="/p/p1?reviews_cursor=abc"
        resetHref="/p/p1"
      />,
    );

    expect(screen.getByRole("link", { name: "Ver más reseñas" })).toHaveAttribute(
      "href",
      // Las rutas se pasan **sin** idioma: el `Link` de next-intl lo añade (`/es/p/p1…`).
      "/es/p/p1?reviews_cursor=abc",
    );
    expect(screen.getByRole("link", { name: "Volver a las más recientes" })).toHaveAttribute(
      "href",
      "/es/p/p1",
    );
  });
});
