#!/bin/sh
set -eu

CONFIG_PATH="${COMPANYHELM_CONFIG_PATH:-/run/companyhelm/config.yaml}"

if [ -n "${COMPANYHELM_CONFIG_S3_URI:-}" ]; then
  mkdir -p "$(dirname "$CONFIG_PATH")"
  aws s3 cp "$COMPANYHELM_CONFIG_S3_URI" "$CONFIG_PATH"
  export COMPANYHELM_CONFIG_PATH="$CONFIG_PATH"
fi

exec npm run preview:container -- "$@"
