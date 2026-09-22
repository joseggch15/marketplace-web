import { describe, expect, it } from "vitest";

import { addressFormSchema, asFieldError } from "./forms";
import {
  couponCodeBodySchema,
  createOrderBodySchema,
  newIdempotencyKey,
  reviewBodySchema,
  toShippingAddressValues,
} from "./schemas";

/**
 * Pruebas de la validación del checkout.
 *
 * Se protege la frontera con el backend: lo que se guarda es **lo que el servidor espera** (cadena vacía → `null`,
 * país en mayúsculas, cantidades dentro de rango) y lo que no encaja se rechaza antes de gastar una petición.
 */

describe("addressFormSchema", () => {
  it("exige destinatario, dirección, ciudad y un país de dos letras", () => {
    const result = addressFormSchema.safeParse({
      recipient: "",
      phone: "",
      line1: "Calle 1 # 2-34",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Colombia",
    });

    expect(result.success).toBe(false);
    const errors = result.success ? {} : result.error.flatten().fieldErrors;
    expect(errors.recipient).toBeDefined();
    expect(errors.city).toBeDefined();
    expect(errors.country).toBeDefined();
  });

  it("acepta una dirección completa y normaliza el país a mayúsculas", () => {
    const result = addressFormSchema.safeParse({
      recipient: "Ana Pérez",
      phone: "+57 300 000 0000",
      line1: "Calle 1 # 2-34",
      line2: "Apto 501",
      city: "Bogotá",
      state: "Cundinamarca",
      postalCode: "110111",
      country: "co",
    });

    expect(result.success).toBe(true);
    expect(result.success ? result.data.country : null).toBe("CO");
  });
});

describe("asFieldError", () => {
  it("traduce solo las claves que existen en el sistema de campos", () => {
    expect(asFieldError("required")).toBe("required");
    expect(asFieldError("countryCode")).toBe("countryCode");
    expect(asFieldError("loQueSea")).toBeUndefined();
    expect(asFieldError(undefined)).toBeUndefined();
  });
});

describe("createOrderBodySchema", () => {
  const body = {
    shipping_address: {
      recipient: "Ana Pérez",
      phone: "",
      line1: "Calle 1 # 2-34",
      line2: "",
      city: "Bogotá",
      state: "",
      postal_code: "",
      country: "co",
    },
    coupon_code: " bienvenida10 ",
    notes: "",
  };

  it("convierte los campos vacíos en null y el cupón en mayúsculas", () => {
    const result = createOrderBodySchema.safeParse(body);

    expect(result.success).toBe(true);
    const data = result.success ? result.data : null;

    expect(data?.shipping_address.phone).toBeNull();
    expect(data?.shipping_address.postal_code).toBeNull();
    expect(data?.shipping_address.country).toBe("CO");
    expect(data?.coupon_code).toBe("BIENVENIDA10");
    expect(data?.notes).toBeNull();
  });

  it("por defecto no guarda la dirección en la cuenta", () => {
    const result = createOrderBodySchema.safeParse(body);
    expect(result.success ? result.data.save_address : true).toBe(false);
  });
});

describe("couponCodeBodySchema", () => {
  it("rechaza un cupón vacío o demasiado largo", () => {
    expect(couponCodeBodySchema.safeParse({ code: "   " }).success).toBe(false);
    expect(couponCodeBodySchema.safeParse({ code: "a".repeat(41) }).success).toBe(false);
    expect(couponCodeBodySchema.safeParse({ code: "BIENVENIDA10" }).success).toBe(true);
  });
});

describe("reviewBodySchema", () => {
  it("exige un identificador válido y una nota de 1 a 5", () => {
    const uuid = "3f7804b5-a2e5-434a-9362-5eb12d0f9ec1";

    expect(reviewBodySchema.safeParse({ product_id: uuid, rating: 5 }).success).toBe(true);
    expect(reviewBodySchema.safeParse({ product_id: uuid, rating: 0 }).success).toBe(false);
    expect(reviewBodySchema.safeParse({ product_id: uuid, rating: 6 }).success).toBe(false);
    expect(reviewBodySchema.safeParse({ product_id: "no-es-uuid", rating: 4 }).success).toBe(false);
  });

  it("deja el título y el texto como null cuando vienen vacíos", () => {
    const result = reviewBodySchema.safeParse({
      product_id: "3f7804b5-a2e5-434a-9362-5eb12d0f9ec1",
      rating: 4,
      title: "  ",
      body: "",
    });

    expect(result.success ? result.data.title : "sin datos").toBeNull();
    expect(result.success ? result.data.body : "sin datos").toBeNull();
  });
});

describe("toShippingAddressValues", () => {
  it("convierte la dirección guardada en los valores del formulario", () => {
    const values = toShippingAddressValues({
      id: "a1",
      label: "Casa",
      recipient_name: "Ana Pérez",
      line1: "Calle 1",
      line2: null,
      city: "Bogotá",
      state: null,
      postal_code: "110111",
      country: "CO",
      phone: null,
      is_default: true,
    });

    expect(values.recipient).toBe("Ana Pérez");
    expect(values.postalCode).toBe("110111");
    expect(values.line2).toBe("");
    expect(values.country).toBe("CO");
  });
});

describe("newIdempotencyKey", () => {
  it("genera claves distintas (para que dos pedidos no se confundan)", () => {
    expect(newIdempotencyKey()).not.toBe(newIdempotencyKey());
  });
});
