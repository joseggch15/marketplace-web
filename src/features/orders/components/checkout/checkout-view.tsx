"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Loader2,
  MapPin,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { CheckoutSteps } from "@/components/domain/checkout-steps";
import { Price } from "@/components/domain/price";
import { Button } from "@/components/ui/button";
import { CheckboxField, TextAreaField, TextField } from "@/features/auth/components/fields";
import { useAddresses } from "@/features/auth/hooks";
import { useCart, useCartPending } from "@/features/cart/hooks";
import { Link, useRouter } from "@/i18n/navigation";
import { formatDate } from "@/lib/format/date";
import { formatMoney } from "@/lib/format/money";

import { couponErrorKey, checkoutErrorKey } from "../../error-codes";
import {
  addressFormSchema,
  asFieldError,
  EMPTY_ADDRESS_FORM,
  type AddressFormValues,
} from "../../forms";
import {
  useCreateOrder,
  useCreatePayment,
  useShippingEstimate,
  useSimulatePayment,
  useValidateCoupon,
} from "../../hooks";
import { newIdempotencyKey, toShippingAddressValues } from "../../schemas";
import { paymentSucceeded } from "../../status";
import type { CouponPreview, Order, Payment } from "../../types";
import { CheckoutSummaryPanel } from "./checkout-summary-panel";
import { ErrorNotice, SuccessNotice } from "../notice";

/**
 * Checkout en tres pasos: **dirección → envío y cupón → pago**.
 *
 * Decisiones de esta pantalla (y por qué):
 * - **El pedido se crea al final**, cuando el comprador confirma el pago. Así, quien abandona el checkout no deja
 *   pedidos pendientes ni stock reservado.
 * - **La clave de idempotencia se genera una vez**, al entrar en el paso de pago, y se reutiliza en los
 *   reintentos: si la red falla y el usuario vuelve a pulsar, el backend devuelve el mismo pedido.
 * - **Los importes son del servidor**: el subtotal y el descuento del cupón vienen de `/coupons/validate`, y el
 *   total que se cobra es el `total` del pedido. El navegador no suma ni multiplica dinero.
 * - **El pago está marcado como «modo de prueba»** y se resuelve con dos botones (aprobar o rechazar), porque el
 *   prototipo no cobra dinero real. No se piden datos de tarjeta: nunca se guardan.
 * - El resumen es **pegajoso** en escritorio y se coloca al final en móvil (donde el flujo se lee de arriba abajo).
 */
export function CheckoutView() {
  const t = useTranslations("Checkout");
  const locale = useLocale();
  const router = useRouter();
  const { cart, loading, failed, reload } = useCart();
  const { addresses, loading: addressesLoading } = useAddresses();
  const cartPending = useCartPending();

  const [step, setStep] = useState(0);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponPreview | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  /** Claves de idempotencia del intento en curso (se generan una vez y se reutilizan al reintentar). */
  const [orderKey, setOrderKey] = useState<string | null>(null);
  const [paymentKey, setPaymentKey] = useState<string | null>(null);

  const validateCoupon = useValidateCoupon();
  const createOrder = useCreateOrder();
  const createPayment = useCreatePayment();
  const simulate = useSimulatePayment();

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: EMPTY_ADDRESS_FORM,
  });

  const watchedCountry = form.watch("country");
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) ?? null;
  const country = (useNewAddress ? watchedCountry : (selectedAddress?.country ?? ""))
    .trim()
    .toUpperCase();
  const firstProductId = cart?.items[0]?.product_id ?? null;
  const {
    estimate,
    loading: estimateLoading,
    failed: estimateFailed,
  } = useShippingEstimate(step >= 1 ? firstProductId : null, country);

  /** Dirección elegida, ya en la forma que espera la API (`ShippingAddressIn`). */
  const addressValues: AddressFormValues = useNewAddress
    ? form.getValues()
    : selectedAddress === null
      ? EMPTY_ADDRESS_FORM
      : {
          ...EMPTY_ADDRESS_FORM,
          ...toShippingAddressValues(selectedAddress),
        };

  /** Aplica el cupón: el cálculo lo hace el backend sobre el carrito actual. */
  async function applyCoupon() {
    setCouponError(null);
    const code = couponCode.trim();

    if (code.length === 0) {
      return;
    }

    const result = await validateCoupon.mutateAsync(code);

    if (!result.ok) {
      setCoupon(null);
      setCouponError(t(`coupon.errors.${couponErrorKey(result.code)}`));
      return;
    }

    setCoupon(result.data.coupon);
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponCode("");
    setCouponError(null);
  }

  /**
   * Crea el pedido y el intento de pago, y deja la pantalla esperando la decisión del comprador.
   *
   * Si algo falla antes de tener pedido, se muestra el error traducido y **no** se crea nada más: no se inventa un
   * pedido «a medias».
   */
  async function startPayment() {
    setFailure(null);
    setPaying(true);

    const key = orderKey ?? newIdempotencyKey();
    setOrderKey(key);

    try {
      const created = await createOrder.mutateAsync({
        body: {
          shipping_address: {
            recipient: addressValues.recipient,
            phone: addressValues.phone.length > 0 ? addressValues.phone : null,
            line1: addressValues.line1,
            line2: addressValues.line2.length > 0 ? addressValues.line2 : null,
            city: addressValues.city,
            state: addressValues.state.length > 0 ? addressValues.state : null,
            postal_code: addressValues.postalCode.length > 0 ? addressValues.postalCode : null,
            country: addressValues.country,
          },
          coupon_code: coupon?.code ?? null,
          notes: notes.trim().length > 0 ? notes : null,
          save_address: useNewAddress && saveAddress,
        },
        idempotencyKey: key,
      });

      if (!created.ok) {
        setFailure(t(`errors.${checkoutErrorKey(created.code)}`));
        return;
      }

      setOrder(created.data.order);

      const payKey = paymentKey ?? newIdempotencyKey();
      setPaymentKey(payKey);

      const started = await createPayment.mutateAsync({
        orderId: created.data.order.id,
        idempotencyKey: payKey,
      });

      if (!started.ok) {
        setFailure(t(`errors.${checkoutErrorKey(started.code)}`));
        return;
      }

      setPayment(started.data.payment);
    } finally {
      setPaying(false);
    }
  }

  /** Aprueba o rechaza el pago de prueba y lleva a la confirmación cuando se confirma. */
  async function resolvePayment(outcome: "succeeded" | "failed") {
    if (payment === null || order === null) {
      return;
    }

    setFailure(null);
    setPaying(true);

    try {
      const result = await simulate.mutateAsync({ paymentId: payment.id, outcome });

      if (!result.ok) {
        setFailure(t(`errors.${checkoutErrorKey(result.code)}`));
        return;
      }

      setPayment(result.data.payment);

      if (paymentSucceeded(result.data.payment.status)) {
        router.push(`/orders/${order.id}?paid=1`);
        router.refresh();
        return;
      }

      setFailure(t("result.failedDescription"));
    } finally {
      setPaying(false);
    }
  }

  if (loading || addressesLoading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
        <span className="h-40 animate-pulse rounded-xl border border-border bg-muted" />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 px-4 py-10">
        <h1 className="font-heading text-2xl font-bold">{t("unavailable.title")}</h1>
        <p className="text-muted-foreground">{t("unavailable.description")}</p>
        <Button size="lg" variant="outline" onClick={reload}>
          {t("unavailable.retry")}
        </Button>
      </div>
    );
  }

  if (cart === null || cart.items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-3 px-4 py-10">
        <h1 className="font-heading text-2xl font-bold">{t("empty.title")}</h1>
        <p className="text-muted-foreground">{t("empty.description")}</p>
        <Button asChild size="lg">
          <Link href="/search">{t("empty.action")}</Link>
        </Button>
      </div>
    );
  }

  const steps = [
    { id: "address", label: t("steps.address") },
    { id: "shipping", label: t("steps.shipping") },
    { id: "payment", label: t("steps.payment") },
  ];
  /** Importe que se cobrará: el total real del pedido, o el total del cupón sobre el carrito. */
  const chargeTotal = order?.total ?? coupon?.total ?? cart.subtotal;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">{t("title")}</h1>
        <CheckoutSteps
          steps={steps}
          currentIndex={step}
          completedLabel={t("steps.completed")}
          currentLabel={t("steps.current")}
        />
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          {failure === null ? null : <ErrorNotice message={failure} />}

          {step === 0 ? (
            <section
              aria-labelledby="checkout-address-title"
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-6"
            >
              <header className="flex flex-col gap-1">
                <h2
                  id="checkout-address-title"
                  className="flex items-center gap-2 font-heading text-lg font-semibold"
                >
                  <MapPin aria-hidden className="size-4" />
                  {t("address.title")}
                </h2>
                <p className="text-sm text-muted-foreground">{t("address.subtitle")}</p>
              </header>

              {addresses.length > 0 && !useNewAddress ? (
                <fieldset className="flex flex-col gap-2">
                  <legend className="sr-only">{t("address.savedTitle")}</legend>
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-checked:border-brand has-checked:bg-brand-surface/40"
                    >
                      <input
                        type="radio"
                        name="checkout-address"
                        value={address.id}
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                        className="mt-1 size-4 accent-primary"
                      />
                      <span className="flex flex-col gap-0.5 text-sm">
                        <span className="font-medium">
                          {address.recipient_name}
                          {address.is_default ? (
                            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                              {t("address.defaultBadge")}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-muted-foreground">
                          {[
                            address.line1,
                            address.line2,
                            address.city,
                            address.state,
                            address.country,
                          ]
                            .filter((part) => part !== null && part.length > 0)
                            .join(", ")}
                        </span>
                      </span>
                    </label>
                  ))}
                </fieldset>
              ) : null}

              {addresses.length > 0 ? (
                <CheckboxField
                  id="checkout-use-new-address"
                  label={t("address.useNew")}
                  checked={useNewAddress}
                  onChange={(event) => setUseNewAddress(event.target.checked)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{t("address.empty")}</p>
              )}

              {useNewAddress || addresses.length === 0 ? (
                <form
                  noValidate
                  className="flex flex-col gap-4"
                  onSubmit={form.handleSubmit(() => setStep(1))}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      id="checkout-recipient"
                      label={t("address.fields.recipient")}
                      placeholder={t("address.placeholders.recipient")}
                      autoComplete="name"
                      error={asFieldError(form.formState.errors.recipient?.message)}
                      {...form.register("recipient")}
                    />
                    <TextField
                      id="checkout-phone"
                      label={t("address.fields.phone")}
                      placeholder={t("address.placeholders.phone")}
                      autoComplete="tel"
                      error={asFieldError(form.formState.errors.phone?.message)}
                      {...form.register("phone")}
                    />
                    <TextField
                      id="checkout-line1"
                      label={t("address.fields.line1")}
                      placeholder={t("address.placeholders.line1")}
                      autoComplete="address-line1"
                      error={asFieldError(form.formState.errors.line1?.message)}
                      {...form.register("line1")}
                    />
                    <TextField
                      id="checkout-line2"
                      label={t("address.fields.line2")}
                      autoComplete="address-line2"
                      error={asFieldError(form.formState.errors.line2?.message)}
                      {...form.register("line2")}
                    />
                    <TextField
                      id="checkout-city"
                      label={t("address.fields.city")}
                      placeholder={t("address.placeholders.city")}
                      autoComplete="address-level2"
                      error={asFieldError(form.formState.errors.city?.message)}
                      {...form.register("city")}
                    />
                    <TextField
                      id="checkout-state"
                      label={t("address.fields.state")}
                      autoComplete="address-level1"
                      error={asFieldError(form.formState.errors.state?.message)}
                      {...form.register("state")}
                    />
                    <TextField
                      id="checkout-postal"
                      label={t("address.fields.postalCode")}
                      autoComplete="postal-code"
                      error={asFieldError(form.formState.errors.postalCode?.message)}
                      {...form.register("postalCode")}
                    />
                    <TextField
                      id="checkout-country"
                      label={t("address.fields.country")}
                      hint={t("address.countryHint")}
                      maxLength={2}
                      autoComplete="country"
                      error={asFieldError(form.formState.errors.country?.message)}
                      {...form.register("country")}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <CheckboxField
                      id="checkout-save-address"
                      label={t("address.save")}
                      checked={saveAddress}
                      onChange={(event) => setSaveAddress(event.target.checked)}
                    />
                    <p className="text-xs text-muted-foreground">{t("address.saveHint")}</p>
                  </div>

                  <Button type="submit" size="lg" className="sm:w-fit">
                    {t("address.continue")}
                    <ArrowRight aria-hidden />
                  </Button>
                </form>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  className="sm:w-fit"
                  disabled={selectedAddress === null}
                  onClick={() => setStep(1)}
                >
                  {t("address.continue")}
                  <ArrowRight aria-hidden />
                </Button>
              )}
            </section>
          ) : null}

          {step === 1 ? (
            <section
              aria-labelledby="checkout-shipping-title"
              className="flex flex-col gap-5 rounded-xl border border-border bg-card p-4 sm:p-6"
            >
              <header className="flex flex-col gap-1">
                <h2
                  id="checkout-shipping-title"
                  className="flex items-center gap-2 font-heading text-lg font-semibold"
                >
                  <Truck aria-hidden className="size-4" />
                  {t("shipping.title")}
                </h2>
                <p className="text-sm text-muted-foreground">{t("shipping.subtitle")}</p>
              </header>

              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <p className="font-medium">{t("shipping.standard")}</p>
                {estimateLoading ? (
                  <p className="mt-1 text-muted-foreground">{t("summary.processing")}</p>
                ) : estimateFailed || estimate === null ? (
                  <p className="mt-1 text-muted-foreground">{t("shipping.unavailable")}</p>
                ) : (
                  <>
                    <p className="mt-1 tabular-nums">
                      {t("shipping.estimate", {
                        from:
                          formatDate(estimate.estimated_delivery_min, locale) ??
                          estimate.estimated_delivery_min,
                        to:
                          formatDate(estimate.estimated_delivery_max, locale) ??
                          estimate.estimated_delivery_max,
                      })}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{t("shipping.source")}</p>
                  </>
                )}
              </div>

              <TextAreaField
                id="checkout-notes"
                label={t("shipping.notesLabel")}
                placeholder={t("shipping.notesPlaceholder")}
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />

              <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
                <p className="font-heading text-sm font-semibold">{t("coupon.title")}</p>

                {coupon === null ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <TextField
                        id="checkout-coupon"
                        label={t("coupon.label")}
                        placeholder={t("coupon.placeholder")}
                        value={couponCode}
                        onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      disabled={validateCoupon.isPending || couponCode.trim().length === 0}
                      onClick={() => void applyCoupon()}
                    >
                      {validateCoupon.isPending ? t("coupon.pending") : t("coupon.apply")}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <SuccessNotice message={t("coupon.applied", { code: coupon.code })} />
                    <Button type="button" variant="ghost" size="sm" onClick={removeCoupon}>
                      {t("coupon.remove")}
                    </Button>
                  </div>
                )}

                {couponError === null ? null : <ErrorNotice message={couponError} />}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="lg" onClick={() => setStep(0)}>
                  <ArrowLeft aria-hidden />
                  {t("shipping.back")}
                </Button>
                <Button type="button" size="lg" onClick={() => setStep(2)}>
                  {t("shipping.continue")}
                  <ArrowRight aria-hidden />
                </Button>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section
              aria-labelledby="checkout-payment-title"
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-6"
            >
              <header className="flex flex-col gap-2">
                <h2
                  id="checkout-payment-title"
                  className="flex items-center gap-2 font-heading text-lg font-semibold"
                >
                  <CreditCard aria-hidden className="size-4" />
                  {t("payment.title")}
                </h2>
                <p className="flex items-center gap-2 rounded-lg bg-warning-surface px-3 py-2 text-sm text-warning-text">
                  <ShieldCheck aria-hidden className="size-4 shrink-0" />
                  <span>
                    <strong className="font-semibold">{t("payment.testMode")}.</strong>{" "}
                    {t("payment.testNote")}
                  </span>
                </p>
              </header>

              <dl className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">{t("payment.amountLabel")}</dt>
                  <dd className="font-heading text-lg font-semibold tabular-nums">
                    <Price
                      amount={chargeTotal}
                      currency={cart.currency}
                      locale={locale}
                      unavailableLabel="-"
                      size="lg"
                    />
                  </dd>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("payment.currencyNote", { currency: cart.currency })}
                </p>
                {payment === null ? null : (
                  <p className="text-xs text-muted-foreground">
                    {t("payment.provider", { provider: payment.provider })}
                  </p>
                )}
              </dl>

              <div className="flex flex-col gap-1 rounded-lg border border-dashed border-border p-3 text-sm">
                <p className="font-medium">{t("payment.cardLabel")}</p>
                <p aria-hidden className="font-mono tracking-widest text-muted-foreground">
                  •••• •••• •••• 4242
                </p>
                <p className="text-xs text-muted-foreground">{t("payment.noCardData")}</p>
              </div>

              {payment === null ? (
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    size="lg"
                    className="w-full sm:w-fit"
                    disabled={paying || cartPending}
                    onClick={() => void startPayment()}
                  >
                    {paying ? (
                      <>
                        <Loader2 aria-hidden className="animate-spin" />
                        {t("payment.preparing")}
                      </>
                    ) : (
                      t("payment.pay", {
                        amount: formatMoney(chargeTotal, cart.currency, locale) ?? chargeTotal,
                      })
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      size="lg"
                      disabled={paying}
                      onClick={() => void resolvePayment("succeeded")}
                    >
                      {paying ? (
                        <>
                          <Loader2 aria-hidden className="animate-spin" />
                          {t("payment.confirming")}
                        </>
                      ) : (
                        t("payment.approve")
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      disabled={paying}
                      onClick={() => void resolvePayment("failed")}
                    >
                      {t("payment.reject")}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {payment.status === "failed"
                      ? t("result.failedDescription")
                      : t("payment.testNote")}
                  </p>
                </div>
              )}

              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="w-fit"
                disabled={paying}
                onClick={() => setStep(1)}
              >
                <ArrowLeft aria-hidden />
                {t("payment.back")}
              </Button>
            </section>
          ) : null}
        </div>

        <CheckoutSummaryPanel
          cart={cart}
          coupon={coupon}
          shippingTotal={order?.shipping_total ?? null}
          total={order?.total ?? coupon?.total ?? null}
          pending={paying || cartPending}
        />
      </div>
    </div>
  );
}
