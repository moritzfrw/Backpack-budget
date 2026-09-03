# Backpack Budget

Reisekasse fürs Backpacking. Du sagst der App, wie lange du unterwegs bist und wie
viel Geld du hast – sie sagt dir jeden Tag, wie viel du heute ausgeben darfst.
Läuft im Browser, ohne Internet, ohne Konto, ohne laufende Kosten.

## Starten

**Am Laptop:** Doppelklick auf `index.html`. Fertig.

**Aufs Handy legen** – einmalig nötig, danach läuft sie dort eigenständig und
ohne Internet. Handy und Laptop müssen dafür im selben WLAN sein.

1. Server am Laptop starten. Das `--bind 0.0.0.0` ist wichtig, sonst kommt nur
   der Laptop selbst dran, nicht das Handy:

   ```bash
   cd ~/Desktop/backpack-budget && python3 -m http.server 4173 --bind 0.0.0.0
   ```

2. IP-Adresse des Laptops herausfinden:

   ```bash
   ipconfig getifaddr en0
   ```

3. Am Handy im Browser `http://<diese-IP>:4173` öffnen.
4. iPhone: Teilen-Symbol → „Zum Home-Bildschirm". Android: Menü → „App installieren".
5. Server am Laptop mit `Strg + C` beenden. Die App auf dem Handy läuft weiter.

Beim ersten Aufruf legt der Service Worker (`sw.js`) eine Kopie der App auf dem
Handy ab. Ab da startet sie aus dem Homescreen-Symbol, ohne WLAN, ohne Laptop.

Änderst du später etwas am Code, muss das Handy einmal wieder ins selbe WLAN –
und **die Versionsnummer oben in `sw.js` muss hochgezählt werden**, sonst zeigt
das Handy hartnäckig die alte Fassung.

## So rechnet die App

**1. Tagesbudget aus Zeitraum und Geld.**
Du trägst Start und Ende ein (oder einfach „120 Tage", das Ende rechnet die App
aus) und dein Gesamtbudget. Daraus wird dein Tagesbudget:
5.000 € ÷ 100 Tage = 50 € pro Tag.

**2. Das Tagesbudget justiert sich jeden Tag selbst.**
Die Zahl auf dem Heute-Bildschirm ist nicht starr, sondern immer
*(was vom Gesamtbudget noch da ist) ÷ (Tage, die noch kommen)*.
Gibst du heute 30 € zu viel aus, sinkt die Zahl von morgen. Sparst du, steigt
sie. Du musst nie etwas von Hand nachziehen.

**3. Buchungen werden auf Tage verteilt.**
Zahlst du ein Hostel für 7 Nächte mit 140 € auf einmal, trägst du unter
„Mehr Angaben" den Zeitraum ein. Die App rechnet dann an jedem dieser sieben Tage
20 € gegen dein Tagesbudget, statt dir einen Tag komplett zu zerschießen.

**4. Rücklagen kommen oben weg.**
Ein Flug, ein Visum, ein Tauchkurs – Dinge, die im Reisezeitraum sicher anfallen,
aber nichts mit dem Alltag zu tun haben. Trägst du sie unter *Einstellungen →
Rücklagen* ein, werden sie vom Gesamtbudget abgezogen, **bevor** durch die Tage
geteilt wird:

    5.000 € − 700 € Flug = 4.300 € ÷ 100 Tage = 43 € pro Tag  (statt 50 €)

Das Geld kann dir also gar nicht erst versehentlich im Tagesbudget durch die
Finger rinnen. Wichtig: eine Rücklage trägst du **nicht** zusätzlich als normale
Ausgabe ein – sonst zählt der Betrag doppelt. Ist der Flug bezahlt, setzt du in
der Zeile einfach den Haken. Am Tagesbudget ändert das nichts (das Geld ist so
oder so weg), aber du siehst, was noch bevorsteht, und der Betrag taucht in der
Kategorie-Auswertung auf.

Kostet der Flug am Ende 743 € statt 700 €, überschreibst du den Betrag in der
Zeile. Das Tagesbudget für die restlichen Tage passt sich sofort an.

**5. Prognose statt nur Kontostand.**
Aus deinem Schnitt der abgeschlossenen Tage rechnet die App hoch, wann dein Geld
alle wäre. Liegt das vor dem Reiseende, warnt sie – liegt es danach, sagt sie dir,
wie viele Tage länger du reisen könntest.

Der Schnitt zählt den heutigen Tag bewusst nicht mit. Sonst wäre die Prognose
morgens euphorisch und abends düster.

## Kategorien

Essen & Trinken · Fortbewegung · Unterkunft · Aktivitäten · Sonstiges

Sie stehen ganz oben in `js/store.js` und lassen sich dort in einer Zeile ändern
oder ergänzen.

## Wo die Daten liegen – und wie du sie nicht verlierst

Die Ausgaben liegen im **localStorage** des Browsers, in dem du sie einträgst.
Das ist ein Speicher, den die Webseite auf dem Gerät selbst anlegt. Nichts davon
geht übers Internet, niemand außer dir sieht die Zahlen – auch GitHub nicht.
Dort liegt nur der Programmcode.

Das hat eine Kehrseite: **Laptop-Browser und Handy-Browser sind zwei getrennte
Töpfe.** Sie gleichen sich nicht ab. Entscheide dich für ein Gerät und trag dort
alles ein.

### Was den Speicher leeren kann

| Auslöser | Risiko |
|---|---|
| Handy verloren, gestohlen, kaputt | **hoch** – der einzige wirklich gefährliche Fall |
| „Verlauf und Websitedaten löschen" im Browser | hoch, aber du müsstest es selbst auslösen |
| iOS räumt bei extremem Speichermangel auf | gering |
| Safaris 7-Tage-Regel für Website-Daten | trifft dich **nicht**, solange die App vom Home-Bildschirm läuft und du sie benutzt |

### Die Absicherung

Die App erinnert dich von selbst. Ist die letzte Sicherung **7 Tage** her (oder
gab es noch nie eine), erscheint oben auf dem Heute-Bildschirm eine Karte mit
*Jetzt sichern*. Ein Tipp darauf öffnet am Handy das System-Teilen-Menü – von
dort legst du die Datei nach iCloud oder Google Drive, schickst sie dir per Mail
oder wirfst sie in einen Chat mit dir selbst. Am Laptop lädt sie stattdessen
normal herunter.

Die Datei enthält **alles**: Reisedaten, Budget, Rücklagen, jede einzelne
Ausgabe, Mitreisende. Über *Einstellungen → Sicherung laden* stellst du damit auf
jedem Gerät den kompletten Stand wieder her.

Merksatz: **Eine Sicherung, die auf demselben Handy liegt, ist keine Sicherung.**
Sie muss woanders hin.

## Wie der Code aufgebaut ist

Drei Dateien, drei Aufgaben – bewusst getrennt, damit man später einzelne Teile
tauschen kann, ohne alles anzufassen:

| Datei | Aufgabe |
|---|---|
| `js/store.js` | Speichern und Laden. Die einzige Stelle, die weiß, **wo** die Daten liegen. |
| `js/budget.js` | Rechnen. Tagesbudget, Rücklagen, Verteilung auf Tage, Prognose, Abrechnung. Fasst nie den Bildschirm an. |
| `js/app.js` | Oberfläche. Holt Daten, lässt rechnen, schreibt das Ergebnis auf den Bildschirm. |

`css/style.css` ist nur das Aussehen; alle Farben stehen als Variablen ganz oben.
`sw.js` und `manifest.json` machen die App auf dem Handy installierbar. Änderst du
Dateien, erhöhe die Versionsnummer oben in `sw.js` – sonst zeigt das Handy die
alte Fassung weiter.

## Geteilte Reisekasse

Trägst du unter Einstellungen Mitreisende ein, kommt pro Ausgabe „bezahlt von"
und „geteilt mit" dazu, und unter *Auswertung* erscheint die Abrechnung: wer wie
viel ausgelegt hat und die kürzeste Liste an Zahlungen zum Ausgleich.
Reist du allein, bleiben diese Felder komplett ausgeblendet.

## Der Weg zur „richtigen App"

Für eine echte gemeinsame Kasse über mehrere Handys müssen nur `laden()` und
`sichern()` in `js/store.js` umgestellt werden – statt in den Browser-Speicher
schreiben sie dann zu einem Server. `budget.js` und `app.js` bleiben unverändert.

Danach folgt der Rest: Login, Reise-Einladungslink, und Zusammenführen, wenn zwei
Leute gleichzeitig offline etwas eintragen. Das ist der eigentliche Aufwand –
nicht das Speichern selbst.
