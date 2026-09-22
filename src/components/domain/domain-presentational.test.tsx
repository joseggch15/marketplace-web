import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { DealBadge } from "@/components/domain/deal-badge";
import { Price } from "@/components/domain/price";
import { ProductCard } from "@/components/domain/product-card";
import { RatingStars } from "@/components/domain/rating-stars";

/**
 * Pruebas de los componentes de presentación del sistema de diseño.
 *
 * Se comprueba lo que de verdad importa para el usuario: que el dato salga bien formateado, que los estados
 * vacíos existan y que el texto llegue a lectores de pantalla.
 */

const LOCALE = "es-CO";

/**
 * La tarjeta de producto usa el `Link` de next-intl (que añade el idioma a la URL), y ese enlace necesita
 * el proveedor de i18n. Este envoltorio lo aporta.
 */
function renderWithIntl(ui: ReactElement) {
  return render(<NextIntlClientProvider locale="es">{ui}</NextIntlClientProvider>);
}

describe("Price", () => {
  it("formatea el monto en la moneda del vendedor", () => {
    render(<Price amount={125000} currency="COP" locale={LOCALE} unavailableLabel="Sin precio" />);

    expect(screen.getByText(/125/)).toBeVisible();
  });

  it("muestra el descuento calculado y el precio anterior tachado", () => {
    render(
      <Price
        amount={125000}
        currency="COP"
        locale={LOCALE}
        compareAt={162000}
        unavailableLabel="Sin precio"
      />,
    );

    expect(screen.getByText("-23%")).toBeVisible();
    expect(screen.getByText(/162/)).toBeVisible();
  });

  it("marca el precio convertido con «≈» porque es informativo", () => {
    render(
      <Price
        amount={125000}
        currency="COP"
        locale={LOCALE}
        converted={{ amount: 31.5, currency: "USD" }}
        unavailableLabel="Sin precio"
      />,
    );

    expect(screen.getByText(/^≈/)).toBeVisible();
  });

  it("no inventa un descuento cuando no lo hay", () => {
    render(
      <Price
        amount={125000}
        currency="COP"
        locale={LOCALE}
        compareAt={100000}
        unavailableLabel="Sin precio"
      />,
    );

    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("muestra el estado sin precio cuando el monto no es válido", () => {
    render(<Price amount="—" currency="COP" locale={LOCALE} unavailableLabel="Sin precio" />);

    expect(screen.getByText("Sin precio")).toBeVisible();
  });
});

describe("RatingStars", () => {
  it("expone la calificación como texto para lectores de pantalla", () => {
    render(
      <RatingStars
        average={4.5}
        count={128}
        label="4,5 de 5 estrellas, 128 reseñas"
        emptyLabel="Sin reseñas todavía"
        locale={LOCALE}
      />,
    );

    expect(screen.getByRole("img", { name: "4,5 de 5 estrellas, 128 reseñas" })).toBeVisible();
    expect(screen.getByText("(128)")).toBeVisible();
  });

  it("tiene un estado vacío cuando no hay reseñas", () => {
    render(
      <RatingStars average={0} count={0} label="" emptyLabel="Sin reseñas todavía" locale={LOCALE} />,
    );

    expect(screen.getByText("Sin reseñas todavía")).toBeVisible();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("sin cantidad de reseñas pinta solo la nota (valoración de una reseña suelta)", () => {
    render(<RatingStars average={4} label="4 de 5 estrellas" emptyLabel="" locale={LOCALE} />);

    expect(screen.getByRole("img", { name: "4 de 5 estrellas" })).toBeVisible();
    expect(screen.queryByText(/\(\d/)).toBeNull();
  });
});

describe("DealBadge", () => {
  it("lleva texto además del icono y del color", () => {
    render(<DealBadge kind="free-shipping" label="Envío gratis" />);

    expect(screen.getByText("Envío gratis")).toBeVisible();
  });
});

describe("ProductCard", () => {
  const baseProps = {
    href: "/design-system",
    title: "Zapatillas urbanas ligeras",
    noImageLabel: "Sin imagen",
    price: <Price amount={125000} currency="COP" locale={LOCALE} unavailableLabel="Sin precio" />,
  };

  it("es un solo enlace con el título, para que sea fácil de tocar", () => {
    renderWithIntl(
      <ProductCard
        {...baseProps}
        image={{ src: "/demo/product-1.png", alt: "Zapatillas urbanas ligeras" }}
      />,
    );

    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName("Zapatillas urbanas ligeras");
    expect(screen.getByAltText("Zapatillas urbanas ligeras")).toBeVisible();
  });

  it("muestra el marcador cuando el producto no tiene imágenes", () => {
    renderWithIntl(<ProductCard {...baseProps} image={null} />);

    expect(screen.getByText("Sin imagen")).toBeVisible();
  });

  it("avisa cuando está agotado", () => {
    renderWithIntl(
      <ProductCard
        {...baseProps}
        image={{ src: "/demo/product-1.png", alt: "Zapatillas urbanas ligeras" }}
        outOfStock
        outOfStockLabel="Agotado"
      />,
    );

    expect(screen.getByText("Agotado")).toBeVisible();
  });
});
