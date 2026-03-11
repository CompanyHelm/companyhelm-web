#!/bin/sh
set -eu

CONFIG_PATH="${COMPANYHELM_CONFIG_PATH:-}"

if [ -z "$CONFIG_PATH" ]; then
  echo "Missing COMPANYHELM_CONFIG_PATH. Container startup requires an explicit runtime config path." >&2
  exit 1
fi

if [ -n "${COMPANYHELM_CONFIG_S3_URI:-}" ]; then
  mkdir -p "$(dirname "$CONFIG_PATH")"
  aws s3 cp "$COMPANYHELM_CONFIG_S3_URI" "$CONFIG_PATH"
  export COMPANYHELM_CONFIG_PATH="$CONFIG_PATH"
fi

exec npm run preview:container -- "$@"
