"""Genera un `openapi.json` leyendo el código del backend, sin levantar el servidor.

¿Por qué existe este script?
---------------------------
Los tipos de la API se generan con `openapi-typescript` a partir de
`http://127.0.0.1:8000/openapi.json` (ver el script `pnpm api:types`). Cuando el backend no está
corriendo, este script produce el mismo documento importando la aplicación FastAPI directamente
(`app.openapi()`), que no necesita base de datos ni Redis.

No modifica nada del backend: solo lee su código y escribe el JSON **dentro del proyecto del frontend**.

Uso (desde `E:\\ecommerce-web`):

    uv run --no-sync --directory ..\\ecommerce python scripts\\dump-openapi.py
"""

from __future__ import annotations

import argparse
import json
import pathlib
import sys


def parse_args() -> argparse.Namespace:
    """Lee los argumentos de línea de comandos."""
    project_root = pathlib.Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="Exporta el esquema OpenAPI del backend.")
    parser.add_argument(
        "--backend-dir",
        default=str(project_root.parent / "ecommerce"),
        help="Carpeta del backend (por defecto: ..\\ecommerce).",
    )
    parser.add_argument(
        "--output",
        default=str(project_root / "openapi.json"),
        help="Archivo de salida (por defecto: openapi.json en la raíz del frontend).",
    )
    return parser.parse_args()


def main() -> int:
    """Escribe el esquema OpenAPI y devuelve el código de salida del proceso."""
    args = parse_args()
    backend_dir = pathlib.Path(args.backend_dir).resolve()
    output = pathlib.Path(args.output).resolve()

    if not backend_dir.is_dir():
        print(f"No encuentro la carpeta del backend: {backend_dir}", file=sys.stderr)
        return 1

    sys.path.insert(0, str(backend_dir))

    from app.main import app  # importación tardía a propósito: depende del sys.path de arriba

    schema = app.openapi()
    output.write_text(json.dumps(schema, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"openapi.json escrito en {output} ({len(schema.get('paths', {}))} rutas)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
