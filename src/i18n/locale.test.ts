import { describe, expect, it } from "vitest";

import { defaultLocale, isLocale, localeFromCookieString } from "@/i18n/locale";
import { routing } from "@/i18n/routing";

describe("idiomas", () => {
  it("declara español e inglés, con español por defecto", () => {
    expect(routing.locales).toEqual(["es", "en"]);
    expect(routing.defaultLocale).toBe("es");
  });

  it("reconoce solo los idiomas soportados", () => {
    expect(isLocale("es")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(null)).toBe(false);
  });

  it("lee el idioma de la cookie NEXT_LOCALE y cae al idioma por defecto", () => {
    expect(localeFromCookieString("NEXT_LOCALE=en")).toBe("en");
    expect(localeFromCookieString("otra=1; NEXT_LOCALE=en; mas=2")).toBe("en");
    expect(localeFromCookieString("NEXT_LOCALE=fr")).toBe(defaultLocale());
    expect(localeFromCookieString("")).toBe(defaultLocale());
  });
});
