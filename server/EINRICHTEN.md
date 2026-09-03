# Der Speicherdienst auf dem Server

Was auf dem Hetzner-Server (Helsinki, `157.180.70.168`) für Backpack Budget
eingerichtet ist. Die Etsy-Automatisierung liegt getrennt davon in
`/opt/etsy-pod-automation` und wird von hier nicht berührt.

## Was wo liegt

| Pfad | Zweck |
|---|---|
| `/opt/backpack-budget-server/speicher.py` | der Dienst selbst |
| `/opt/backpack-budget-server/daten.json` | der gespeicherte Datenstand |
| `/opt/backpack-budget-server/schluessel.txt` | Zugangsschlüssel, nur für Benutzer `budget` lesbar |
| `/opt/backpack-budget-server/sicherungen/` | tägliche Kopien, sieben Stück |
| `/opt/backpack-budget-server/sicherung.sh` | legt die Kopie an und räumt alte weg |
| `/etc/systemd/system/backpack-budget.service` | startet den Dienst beim Hochfahren |
| `/etc/caddy/Caddyfile` | HTTPS und Weiterleitung nach innen |

Der Dienst läuft als eigener Systembenutzer `budget`, der sich nicht anmelden kann
und außerhalb seines Ordners nichts schreiben darf.

## Wie es zusammenhängt

```
Handy  ──HTTPS──>  Caddy (Port 443)  ──intern──>  speicher.py (127.0.0.1:8477)
                     │                                    │
              Zertifikat von                        daten.json
              Let's Encrypt,                             │
              erneuert sich selbst              nachts 3:30 Uhr
                                                  sicherung.sh
```

`speicher.py` lauscht bewusst nur auf `127.0.0.1`. Von außen kommt niemand direkt
an ihn heran – nur über Caddy, und der spricht ausschließlich HTTPS.

## Befehle

```bash
systemctl status backpack-budget       # läuft der Dienst?
journalctl -u backpack-budget -n 50    # was hat er zuletzt gemacht?
systemctl restart backpack-budget      # neu starten
cat /opt/backpack-budget-server/schluessel.txt   # Zugangsschlüssel anzeigen
ls -la /opt/backpack-budget-server/sicherungen/  # vorhandene Sicherungen
```

## Schlüssel wechseln

Falls der Schlüssel je irgendwo aufgetaucht ist, wo er nicht hingehört:

```bash
head -c 32 /dev/urandom | base64 | tr -d '/+=' | head -c 40 \
  > /opt/backpack-budget-server/schluessel.txt
chown budget:budget /opt/backpack-budget-server/schluessel.txt
chmod 600 /opt/backpack-budget-server/schluessel.txt
systemctl restart backpack-budget
```

Danach in der App unter *Einstellungen → Abgleich* den neuen Schlüssel eintragen
und auf **Verbinden** tippen.

## Aus einer Sicherung zurückholen

```bash
systemctl stop backpack-budget
cp /opt/backpack-budget-server/sicherungen/daten-2026-09-01.json \
   /opt/backpack-budget-server/daten.json
chown budget:budget /opt/backpack-budget-server/daten.json
systemctl start backpack-budget
```

Danach in der App **Jetzt abgleichen** tippen. Weil das Gerät dann einen neueren
Zeitstempel hat als der zurückgespielte Server-Stand, fragt die App nach – dort
*OK* wählen, um den Server-Stand zu übernehmen.

## Restlos entfernen

```bash
systemctl disable --now backpack-budget
rm /etc/systemd/system/backpack-budget.service
systemctl daemon-reload
rm -rf /opt/backpack-budget-server
userdel budget
crontab -l | grep -v backpack-budget | crontab -
apt-get purge -y caddy && rm -rf /etc/caddy
```

Die Etsy-Automatisierung bleibt davon unberührt.
