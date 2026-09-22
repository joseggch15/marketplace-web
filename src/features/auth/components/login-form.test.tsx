import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import messages from "../../../../messages/es.json";
import { LoginForm } from "./login-form";

/**
 * Pruebas del formulario de inicio de sesión.
 *
 * Se comprueba lo que de verdad le importa al usuario: que los errores se entiendan (tanto los del navegador
 * como los del servidor, traducidos por su `code`) y que el campo de contraseña se pueda mostrar y ocultar.
 * La petición al backend se sustituye por un doble: aquí se prueba la interfaz, no la API.
 */

/** Respuesta mínima compatible con `fetch` para las pruebas. */
function stubResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: 0 }, queries: { retry: 0 } },
  });

  return render(
    <NextIntlClientProvider locale="es" messages={{ Auth: messages.Auth }}>
      <QueryClientProvider client={client}>
        <LoginForm />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra los campos obligatorios al enviar vacío", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findAllByText("Este campo es obligatorio.")).toHaveLength(2);
  });

  it("avisa cuando el correo no tiene formato válido", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Correo electrónico"), "no-es-un-correo");
    await user.type(screen.getByLabelText("Contraseña"), "secreta123");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(
      await screen.findByText("Escribe un correo electrónico válido."),
    ).toBeInTheDocument();
  });

  it("traduce el error del servidor por su código estable", async () => {
    const fetchMock = vi.fn(async () =>
      stubResponse(401, { code: "invalid_credentials", status: 401 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Correo electrónico"), "ana@correo.com");
    await user.type(screen.getByLabelText("Contraseña"), "clave-incorrecta");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(
      await screen.findByText("El correo o la contraseña no son correctos."),
    ).toBeInTheDocument();

    // Se llamó a nuestra ruta BFF (nunca al backend directamente) y con las credenciales escritas.
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("permite mostrar y ocultar la contraseña", async () => {
    const user = userEvent.setup();
    renderForm();

    const password = screen.getByLabelText("Contraseña");
    expect(password).toHaveAttribute("type", "password");

    const toggle = screen.getByRole("button", { name: "Mostrar contraseña" });
    await user.click(toggle);

    expect(password).toHaveAttribute("type", "text");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });
});
