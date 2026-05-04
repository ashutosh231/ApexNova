#!/usr/bin/env bash
# Run Laravel backend setup with Homebrew PHP (avoids XAMPP 8.2 / wrong PATH).
set -euo pipefail
cd "$(dirname "$0")"

resolve_php() {
  local c
  for c in \
    "${PHP_BINARY:-}" \
    /opt/homebrew/opt/php/bin/php \
    /usr/local/opt/php/bin/php; do
    [[ -n "$c" && -x "$c" ]] || continue
    echo "$c"
    return 0
  done
  return 1
}

PHP_BIN="$(resolve_php)" || {
  echo "Homebrew PHP not found. Install it, then re-run:"
  echo "  brew install php"
  exit 1
}

COMPOSER_BIN="$(command -v composer 2>/dev/null || true)"
[[ -n "$COMPOSER_BIN" ]] || {
  echo "composer not found in PATH. Install: https://getcomposer.org/download/"
  exit 1
}

echo "Using: $PHP_BIN"
"$PHP_BIN" -v | sed -n '1p'

"$PHP_BIN" "$COMPOSER_BIN" install

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

"$PHP_BIN" artisan key:generate
echo "OK: dependencies installed and APP_KEY set."
