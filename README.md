# Backpack Budget

Reisekasse und Tagesbudget fürs Backpacking. Läuft im Browser, ohne Internet,
ohne Konto, ohne laufende Kosten.

## Starten

**Am Laptop:** Doppelklick auf `index.html`. Fertig.

**Aufs Handy legen** (dann läuft sie offline wie eine echte App):
Handy und Laptop müssen im selben WLAN sein.

1. Im Terminal im Projektordner starten:

   ```bash
   cd ~/Desktop/backpack-budget && python3 -m http.server 4173
   ```

2. IP-Adresse des Laptops herausfinden:

   ```bash
   ipconfig getifaddr en0
   ```

3. Am Handy im Browser `http://<diese-IP>:4173` öffnen.
4. iPhone: Teilen-Symbol → „Zum Home-Bildschirm". Android: Menü → „App installieren".

Ab dann liegt die App auf dem Handy und funktioniert auch ohne Netz.

## Wichtig zu wissen

Die Daten liegen **nur im Browser, in dem du sie einträgst**. Laptop-Browser und
Handy-Browser sind zwei getrennte Töpfe – sie gleichen sich nicht ab. Entscheide
dich für ein Gerät und trag dort alles ein.

Deshalb: unter *Einstellungen → Daten → Sicherung speichern* regelmäßig eine
Kopie ziehen. Die Datei kannst du auf jedem Gerät wieder einlesen.

## Was drin ist

- Ausgaben mit Kategorie, Datum, Notiz
- Tagesbudget pro Person, mit Warnung sobald du drüber bist
- Reichweite: was du pro Tag noch ausgeben darfst bis zum Reiseende
- Geteilte Reisekasse: mehrere Mitreisende, „geteilt mit"-Auswahl pro Ausgabe,
  und eine Abrechnung, die die kürzeste Liste an Zahlungen ausrechnet
- Sicherung als Datei rausschreiben und wieder einlesen

## Wie der Code aufgebaut ist

Drei Dateien, drei Aufgaben – bewusst getrennt, damit man später einzelne Teile
tauschen kann, ohne alles anzufassen:

| Datei | Aufgabe |
|---|---|
| `js/store.js` | Speichern und Laden. Die einzige Stelle, die weiß, **wo** die Daten liegen. |
| `js/budget.js` | Rechnen. Tagesbudget, Reichweite, Salden, Ausgleich. Fasst nie den Bildschirm an. |
| `js/app.js` | Oberfläche. Holt Daten, lässt rechnen, schreibt das Ergebnis auf den Bildschirm. |

`css/style.css` ist nur das Aussehen; alle Farben stehen als Variablen ganz oben.
`sw.js` und `manifest.json` sorgen dafür, dass die App aufs Handy installierbar ist.

## Der Weg zur „richtigen App"

Die Datenstruktur kennt schon mehrere Personen und die Aufteilung pro Ausgabe.
Für eine echte gemeinsame Reisekasse (mehrere Handys, gleicher Stand) müssen nur
`laden()` und `sichern()` in `js/store.js` umgestellt werden – statt in den
Browser-Speicher schreiben sie dann zu einem Server. `budget.js` und `app.js`
bleiben unverändert.

Danach folgt der Rest: Login, Reise-Einladungslink, und Zusammenführen, wenn zwei
Leute gleichzeitig offline etwas eintragen. Das ist der eigentliche Aufwand –
nicht das Speichern selbst.
