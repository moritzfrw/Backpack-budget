# Backpack Budget

Reisekasse fürs Backpacking. Du sagst der App, wie lange du unterwegs bist und wie
viel Geld du hast – sie sagt dir jeden Tag, wie viel du heute ausgeben darfst.
Läuft im Browser, ohne Internet, ohne Konto, ohne laufende Kosten.

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

**4. Prognose statt nur Kontostand.**
Aus deinem Schnitt der abgeschlossenen Tage rechnet die App hoch, wann dein Geld
alle wäre. Liegt das vor dem Reiseende, warnt sie – liegt es danach, sagt sie dir,
wie viele Tage länger du reisen könntest.

Der Schnitt zählt den heutigen Tag bewusst nicht mit. Sonst wäre die Prognose
morgens euphorisch und abends düster.

## Kategorien

Essen & Trinken · Fortbewegung · Unterkunft · Aktivitäten

Sie stehen ganz oben in `js/store.js` und lassen sich dort in einer Zeile ändern
oder ergänzen.

## Wichtig zu wissen

Die Daten liegen **nur im Browser, in dem du sie einträgst**. Laptop-Browser und
Handy-Browser sind zwei getrennte Töpfe – sie gleichen sich nicht ab. Entscheide
dich für ein Gerät und trag dort alles ein.

Deshalb: unter *Einstellungen → Daten → Sicherung speichern* regelmäßig eine
Kopie ziehen. Die Datei kannst du auf jedem Gerät wieder einlesen.

## Wie der Code aufgebaut ist

Drei Dateien, drei Aufgaben – bewusst getrennt, damit man später einzelne Teile
tauschen kann, ohne alles anzufassen:

| Datei | Aufgabe |
|---|---|
| `js/store.js` | Speichern und Laden. Die einzige Stelle, die weiß, **wo** die Daten liegen. |
| `js/budget.js` | Rechnen. Tagesbudget, Verteilung auf Tage, Prognose, Abrechnung. Fasst nie den Bildschirm an. |
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
