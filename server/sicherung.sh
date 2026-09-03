#!/usr/bin/env bash
#
# Taegliche Sicherung des Datenstands.
#
# Legt eine datierte Kopie ab und loescht Kopien, die aelter als
# sieben Tage sind. Laeuft einmal taeglich per Cron.
#
set -euo pipefail

ORDNER="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# In den eigenen Ordner wechseln: find scheitert sonst, wenn das Skript
# aus einem Verzeichnis gestartet wird, das dem Dienstbenutzer verwehrt
# ist - bei Cron ist das typischerweise /root.
cd "$ORDNER"
QUELLE="$ORDNER/daten.json"
ZIEL_ORDNER="$ORDNER/sicherungen"
TAGE_AUFHEBEN=7

[ -f "$QUELLE" ] || { echo "Noch nichts gespeichert - nichts zu sichern."; exit 0; }

mkdir -p "$ZIEL_ORDNER"
ZIEL="$ZIEL_ORDNER/daten-$(date +%F).json"

# Am selben Tag mehrfach ausgefuehrt wird die Kopie einfach ueberschrieben.
cp "$QUELLE" "$ZIEL"
echo "Gesichert: $ZIEL ($(wc -c < "$ZIEL") Bytes)"

# Alles aelter als sieben Tage verschwindet von selbst.
GELOESCHT=$(find "$ZIEL_ORDNER" -name 'daten-*.json' -type f -mtime +"$TAGE_AUFHEBEN" -print -delete | wc -l | tr -d ' ')
echo "Alte Sicherungen entfernt: $GELOESCHT"
echo "Vorrat: $(find "$ZIEL_ORDNER" -name 'daten-*.json' -type f | wc -l | tr -d ' ') Stueck"
