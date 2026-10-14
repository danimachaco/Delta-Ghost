#!/usr/bin/env bash
# Junta todos los archivos de docs/memoria en un solo PDF: docs/memoria.pdf
# Orden: portada e introducción (00-, 01-, ...), luego cada sprint
# (_sprint.md y después las entradas por fecha) y al final 99-conclusiones.md
set -euo pipefail

cd "$(dirname "$0")/.."
DIR="docs/memoria"
SALIDA="docs/memoria.pdf"
ARCHIVOS=()

# Secciones fijas del principio (00- a 98-)
for f in "$DIR"/[0-8][0-9]-*.md "$DIR"/9[0-8]-*.md; do
  [ -e "$f" ] && ARCHIVOS+=("$f")
done

# Sprints en orden (sprint-01, sprint-02, ...)
for s in $(ls -d "$DIR"/sprint-*/ 2>/dev/null | sort); do
  [ -e "$s/_sprint.md" ] && ARCHIVOS+=("$s/_sprint.md")
  for e in $(ls "$s"*.md 2>/dev/null | grep -v '/_' | sort); do
    ARCHIVOS+=("$e")
  done
done

# Conclusiones al final
for f in "$DIR"/99-*.md; do
  [ -e "$f" ] && ARCHIVOS+=("$f")
done

echo "Archivos incluidos en la memoria:"
printf '  %s\n' "${ARCHIVOS[@]}"

pandoc "${ARCHIVOS[@]}" \
  --resource-path="$DIR" \
  --pdf-engine=xelatex \
  --number-sections \
  -V geometry:margin=2.5cm \
  -V papersize=a4 \
  -V classoption=titlepage \
  -V fontsize=11pt \
  -V mainfont="DejaVu Sans" \
  -V monofont="DejaVu Sans Mono" \
  -V colorlinks=true \
  -V linkcolor=blue \
  -V toc-depth=2 \
  -o "$SALIDA"

echo "PDF generado en $SALIDA"
