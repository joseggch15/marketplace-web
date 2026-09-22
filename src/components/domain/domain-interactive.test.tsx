import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ImageGallery } from "@/components/domain/image-gallery";
import { QuantityStepper } from "@/components/domain/quantity-stepper";
import { VariantSelector } from "@/components/domain/variant-selector";

/**
 * Pruebas de los componentes interactivos (los que tienen estado y se usan con el teclado).
 *
 * Se comprueban las reglas del proyecto: nada de comprar más de lo que hay, aviso claro cuando se pasa un
 * límite, variantes sin stock deshabilitadas y galería navegable sin ratón.
 */

const quantityLabels = {
  quantity: "Cantidad",
  decrement: "Quitar una unidad",
  increment: "Agregar una unidad",
  maxMessage: "Solo hay 5 disponibles",
  minMessage: "El mínimo de compra es 1",
};

describe("QuantityStepper", () => {
  it("suma y resta con los botones", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <QuantityStepper value={2} min={1} max={5} onChange={onChange} labels={quantityLabels} />,
    );

    await user.click(screen.getByRole("button", { name: "Agregar una unidad" }));
    expect(onChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole("button", { name: "Quitar una unidad" }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("no deja pasar del máximo real de stock y avisa por qué", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <QuantityStepper value={4} min={1} max={5} onChange={onChange} labels={quantityLabels} />,
    );

    // Al llegar al máximo, el botón de sumar queda deshabilitado.
    await user.click(screen.getByRole("button", { name: "Agregar una unidad" }));
    expect(onChange).toHaveBeenCalledWith(5);

    render(
      <QuantityStepper value={5} min={1} max={5} onChange={onChange} labels={quantityLabels} />,
    );
    expect(screen.getAllByRole("button", { name: "Agregar una unidad" })[1]).toBeDisabled();

    // Si se escribe un número mayor, se ajusta al máximo y se explica con un aviso.
    await user.clear(screen.getAllByLabelText("Cantidad")[1]);
    await user.type(screen.getAllByLabelText("Cantidad")[1], "9");

    expect(onChange).toHaveBeenLastCalledWith(5);
    expect(screen.getByRole("alert")).toHaveTextContent("Solo hay 5 disponibles");
  });

  it("se deshabilita por completo cuando no hay stock", () => {
    render(
      <QuantityStepper
        value={1}
        min={1}
        max={1}
        onChange={() => {}}
        labels={quantityLabels}
        disabled
      />,
    );

    expect(screen.getByRole("button", { name: "Agregar una unidad" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Quitar una unidad" })).toBeDisabled();
    expect(screen.getByLabelText("Cantidad")).toBeDisabled();
  });
});

describe("VariantSelector", () => {
  const options = [
    { value: "s", label: "S (36-38)", available: false },
    { value: "m", label: "M (39-41)", available: true },
  ];

  it("es un grupo de opciones accesible y las variantes sin stock quedan deshabilitadas", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <VariantSelector
        groupLabel="Talla"
        options={options}
        value={null}
        onChange={onChange}
        labels={{ unavailable: "sin stock" }}
      />,
    );

    // La variante sin stock queda deshabilitada (y se avisa con texto, no solo con color).
    expect(screen.getByRole("radio", { name: /S \(36-38\)/ })).toBeDisabled();
    expect(screen.getByText("(sin stock)")).toBeVisible();

    await user.click(screen.getByRole("radio", { name: /M \(39-41\)/ }));
    expect(onChange).toHaveBeenCalledWith("m");
  });

  it("muestra el error cuando no se pudo cargar la disponibilidad", () => {
    render(
      <VariantSelector
        groupLabel="Color"
        options={[{ value: "black", label: "Negro", available: true }]}
        value={null}
        onChange={() => {}}
        labels={{ unavailable: "sin stock" }}
        errorMessage="No se pudieron cargar las opciones"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudieron cargar las opciones");
  });
});

describe("ImageGallery", () => {
  const labels = {
    previous: "Imagen anterior",
    next: "Imagen siguiente",
    thumbnail: "Ver imagen",
    noImage: "Este producto todavía no tiene fotos",
    loadError: "No se pudo cargar la imagen",
  };

  const images = [
    { src: "/demo/product-1.png", alt: "Vista 1" },
    { src: "/demo/product-2.png", alt: "Vista 2" },
  ];

  it("cambia de imagen con las miniaturas y con el teclado", async () => {
    const user = userEvent.setup();

    render(<ImageGallery images={images} labels={labels} />);

    expect(screen.getByAltText("Vista 1")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Ver imagen 2" }));
    expect(screen.getByAltText("Vista 2")).toBeVisible();

    // Flecha izquierda: vuelve a la primera sin tocar el ratón.
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByAltText("Vista 1")).toBeVisible();
  });

  it("tiene estado vacío cuando el producto no tiene fotos", () => {
    render(<ImageGallery images={[]} labels={labels} />);

    expect(screen.getByText("Este producto todavía no tiene fotos")).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
