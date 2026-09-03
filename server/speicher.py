#!/usr/bin/env python3
"""
Speicherdienst fuer Backpack Budget.

Nimmt den kompletten Datenstand der App entgegen und gibt ihn wieder
heraus. Mehr macht dieser Dienst nicht - er versteht den Inhalt gar
nicht, sondern behandelt ihn als einen Block Text. Das ist Absicht:
aendert sich spaeter etwas an der App, muss hier nichts angepasst
werden.

Er lauscht nur auf 127.0.0.1, ist also von aussen nicht direkt
erreichbar. Davor sitzt Caddy und kuemmert sich um HTTPS.

Schnittstellen:
    GET  /gesundheit   Lebenszeichen, ohne Schluessel abrufbar
    GET  /laden        gespeicherter Stand
    PUT  /speichern    Stand ueberschreiben

Alles ausser /gesundheit verlangt den Kopfzeilen-Eintrag
    Authorization: Bearer <schluessel>
"""

import hmac
import json
import os
import sys
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ORDNER = os.path.dirname(os.path.abspath(__file__))
DATEN_DATEI = os.path.join(ORDNER, "daten.json")
SCHLUESSEL_DATEI = os.path.join(ORDNER, "schluessel.txt")

PORT = 8477
HOST = "127.0.0.1"

# Grosszuegig bemessen: ein Jahr taegliche Eintraege liegt weit darunter.
MAX_BYTES = 4 * 1024 * 1024

# Von welchen Adressen aus die App den Dienst ansprechen darf.
# Weitere Zeilen hier ergaenzen, falls die App mal woanders liegt.
# Die localhost-Eintraege sind fuer Testlaeufe auf dem eigenen Rechner.
# Sie sind ungefaehrlich: welche Herkunft eine Anfrage hat, bestimmt der
# Browser, nicht die Seite - eine fremde Webseite kann sich nicht als
# localhost ausgeben. Und ohne Schluessel kommt ohnehin niemand rein.
ERLAUBTE_HERKUNFT = {
    "https://moritzfrw.github.io",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
}

# Schreiben und Lesen nie gleichzeitig - sonst koennte ein Abruf
# eine halb geschriebene Datei erwischen.
sperre = threading.Lock()


def schluessel_lesen():
    try:
        with open(SCHLUESSEL_DATEI, "r", encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        return ""


def jetzt():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Handler(BaseHTTPRequestHandler):

    server_version = "BackpackBudget/1.0"

    # ---------- Hilfsmittel ----------

    def _herkunft(self):
        herkunft = self.headers.get("Origin", "")
        return herkunft if herkunft in ERLAUBTE_HERKUNFT else ""

    def _kopfzeilen(self, status, laenge=0, typ="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", typ + "; charset=utf-8")
        self.send_header("Content-Length", str(laenge))
        self.send_header("Cache-Control", "no-store")
        herkunft = self._herkunft()
        if herkunft:
            self.send_header("Access-Control-Allow-Origin", herkunft)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
            self.send_header("Access-Control-Allow-Methods", "GET, PUT, OPTIONS")
            self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def _antwort(self, status, objekt):
        koerper = json.dumps(objekt, ensure_ascii=False).encode("utf-8")
        self._kopfzeilen(status, len(koerper))
        if self.command != "HEAD":
            self.wfile.write(koerper)

    def _angemeldet(self):
        erwartet = schluessel_lesen()
        if not erwartet:
            return False
        kopf = self.headers.get("Authorization", "")
        vorgelegt = kopf[7:].strip() if kopf.startswith("Bearer ") else ""
        # compare_digest statt "==", damit die Laufzeit nichts ueber
        # den Schluessel verraet.
        return hmac.compare_digest(vorgelegt, erwartet)

    # ---------- Schnittstellen ----------

    def do_OPTIONS(self):
        """Vorabfrage des Browsers, bevor er den Schluessel mitschickt."""
        self._kopfzeilen(204)

    def do_GET(self):
        if self.path == "/gesundheit":
            return self._antwort(200, {"ok": True, "zeit": jetzt()})

        if self.path == "/laden":
            if not self._angemeldet():
                return self._antwort(401, {"fehler": "Schluessel fehlt oder stimmt nicht"})
            with sperre:
                if not os.path.exists(DATEN_DATEI):
                    return self._antwort(200, {"leer": True})
                try:
                    with open(DATEN_DATEI, "r", encoding="utf-8") as f:
                        inhalt = json.load(f)
                except (OSError, ValueError):
                    return self._antwort(500, {"fehler": "Gespeicherte Datei ist unlesbar"})
            return self._antwort(200, {"leer": False, "zustand": inhalt})

        return self._antwort(404, {"fehler": "Unbekannter Pfad"})

    def do_PUT(self):
        if self.path != "/speichern":
            return self._antwort(404, {"fehler": "Unbekannter Pfad"})
        if not self._angemeldet():
            return self._antwort(401, {"fehler": "Schluessel fehlt oder stimmt nicht"})

        try:
            laenge = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            laenge = 0
        if laenge <= 0:
            return self._antwort(400, {"fehler": "Leerer Inhalt"})
        if laenge > MAX_BYTES:
            return self._antwort(413, {"fehler": "Inhalt zu gross"})

        roh = self.rfile.read(laenge)
        try:
            zustand = json.loads(roh.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return self._antwort(400, {"fehler": "Kein gueltiges JSON"})
        if not isinstance(zustand, dict):
            return self._antwort(400, {"fehler": "Erwartet wird ein Objekt"})

        with sperre:
            # Erst daneben schreiben, dann umbenennen. Damit gibt es
            # keinen Moment, in dem die Datei halb beschrieben ist -
            # auch nicht, wenn genau dann der Strom ausfaellt.
            vorlaeufig = DATEN_DATEI + ".neu"
            try:
                with open(vorlaeufig, "w", encoding="utf-8") as f:
                    json.dump(zustand, f, ensure_ascii=False, indent=1)
                    f.flush()
                    os.fsync(f.fileno())
                os.replace(vorlaeufig, DATEN_DATEI)
            except OSError as e:
                return self._antwort(500, {"fehler": "Schreiben fehlgeschlagen: %s" % e})

        return self._antwort(200, {"ok": True, "gespeichert": jetzt()})

    def log_message(self, format, *args):
        """Ohne diese Zeile schreibt der Dienst jeden Abruf mitsamt
        Zeitstempel ins Journal - unnoetig viel Rauschen."""
        sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))


def main():
    if not schluessel_lesen():
        sys.exit("Kein Schluessel in %s - Dienst startet nicht." % SCHLUESSEL_DATEI)
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print("Backpack-Budget-Speicher laeuft auf http://%s:%d" % (HOST, PORT), flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
