"use client";

import { Loader2, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { ErrorNotice } from "@/components/domain/notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { mediaUrl } from "@/lib/media/url";

import { sellerErrorKey } from "../error-codes";
import { useDeleteImage, useUploadImage } from "../hooks";
import { MAX_IMAGE_BYTES, UPLOADABLE_IMAGE_TYPES, type ProductImage } from "../types";

/**
 * Imágenes del producto: subir y quitar.
 *
 * Reglas de seguridad que aplica el servidor y que la pantalla ayuda a cumplir antes de gastar una petición:
 * - Solo los tipos de la **lista blanca** (`UPLOADABLE_IMAGE_TYPES`: jpeg, png, webp, avif y gif). **SVG queda
 *   fuera**: es un formato `image/` que puede llevar JavaScript dentro y, servido desde nuestro dominio, se
 *   ejecutaría con la sesión de quien lo mire.
 * - Máximo 5 MB por archivo.
 *
 * El archivo viaja al servidor de Next.js (`FormData`), que pide la URL firmada, sube los bytes y adjunta la
 * imagen: el navegador no habla con el almacenamiento ni ve la URL firmada. El **texto alternativo** es un campo
 * de verdad: es lo que oye quien usa un lector de pantalla.
 */
export function ProductImages({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const t = useTranslations("Seller");
  const router = useRouter();
  const upload = useUploadImage(productId);
  const remove = useDeleteImage(productId);
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  function chooseFile(selected: File | null) {
    setFailure(null);

    if (selected === null) {
      setFile(null);
      return;
    }

    if (!(UPLOADABLE_IMAGE_TYPES as readonly string[]).includes(selected.type.toLowerCase())) {
      setFailure(t("errors.unsupported_image_type"));
      setFile(null);
      return;
    }

    if (selected.size > MAX_IMAGE_BYTES) {
      setFailure(t("errors.image_too_large"));
      setFile(null);
      return;
    }

    setFile(selected);
  }

  async function submit() {
    if (file === null) {
      setFailure(t("images.chooseFile"));
      return;
    }

    setFailure(null);
    const result = await upload.mutateAsync({
      file,
      alt: alt.trim().length > 0 ? alt.trim() : file.name,
      position: images.length,
    });

    if (!result.ok) {
      setFailure(t(`errors.${sellerErrorKey(result.code)}`));
      return;
    }

    setFile(null);
    setAlt("");

    if (fileInput.current !== null) {
      fileInput.current.value = "";
    }

    router.refresh();
  }

  async function drop(imageId: string) {
    setFailure(null);
    setRemovingId(imageId);
    const result = await remove.mutateAsync(imageId);
    setRemovingId(null);

    if (!result.ok) {
      setFailure(t(`errors.${sellerErrorKey(result.code)}`));
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {failure === null ? null : <ErrorNotice message={failure} />}

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("images.empty")}</p>
      ) : (
        <ul className="flex flex-wrap gap-3">
          {images.map((image) => {
            const url = mediaUrl(image.object_key);

            return (
              <li
                key={image.id}
                className="flex w-32 flex-col gap-2 rounded-xl border border-border p-2"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  {url === null ? (
                    <span className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                      {t("images.unsupported")}
                    </span>
                  ) : (
                    <Image
                      src={url}
                      alt={image.alt ?? ""}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={removingId !== null}
                  onClick={() => void drop(image.id)}
                >
                  {removingId === image.id ? (
                    <Loader2 aria-hidden className="animate-spin" />
                  ) : (
                    <Trash2 aria-hidden />
                  )}
                  {t("images.remove")}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-border p-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-image-file">{t("images.file")}</Label>
          <Input
            id="product-image-file"
            ref={fileInput}
            type="file"
            accept={UPLOADABLE_IMAGE_TYPES.join(",")}
            onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">{t("images.fileHint")}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-image-alt">{t("images.alt")}</Label>
          <Input
            id="product-image-alt"
            value={alt}
            maxLength={200}
            placeholder={t("images.altPlaceholder")}
            onChange={(event) => setAlt(event.target.value)}
          />
        </div>

        <Button
          type="button"
          size="lg"
          className="sm:w-fit"
          disabled={upload.isPending}
          onClick={() => void submit()}
        >
          {upload.isPending ? (
            <>
              <Loader2 aria-hidden className="animate-spin" />
              {t("images.uploading")}
            </>
          ) : (
            <>
              <Upload aria-hidden />
              {t("images.upload")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
