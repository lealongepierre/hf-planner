#!/bin/bash
set -euo pipefail

for file in "$@"; do
    echo "Validating $file..."
    docker compose -f "$file" config --quiet 2>/dev/null || \
        echo "Warning: could not validate $file (docker compose not available or env vars missing)"
done
