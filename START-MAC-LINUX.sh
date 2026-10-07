#!/usr/bin/env sh
cd "$(dirname "$0")" || exit 1
printf 'VOLTÉO : ouvrez http://localhost:8080 dans votre navigateur.\n'
exec python3 server/app.py --serve
