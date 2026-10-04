/* ==========================================================
   englisch.js – Das Vokabular.

   Links der deutsche Satz, wie er im Code oder im Markup
   steht, rechts die englische Fassung. Mehr nicht: Die
   Mechanik liegt in sprache.js, hier liegen nur Woerter.

   Was fehlt, erscheint auf Deutsch. Das ist Absicht - eine
   fehlende Zeile faellt beim Durchklicken sofort auf, eine
   leere Stelle oder ein Kuerzel wie "heute.label" nicht.

   {geschweift} sind Platzhalter. Sie muessen in beiden
   Sprachen vorkommen, duerfen aber im Satz woanders stehen.
   ========================================================== */

Object.assign(Sprache.EN, {

  /* ---------- Einleitung und Einrichtung ---------- */
  'Reicht mein Geld bis zum Rückflug?': 'Will my money last until the flight home?',
  'Backpack Budget beantwortet genau diese eine Frage — jeden Tag neu.':
    'Backpack Budget answers that one question — fresh every day.',
  'Zwei Tipps pro Ausgabe': 'Two taps per expense',
  'Betrag eintippen, Kategorie antippen, fertig. Ort und Währung weiß die App selbst, sobald du deine Unterkunft einträgst.':
    'Type the amount, tap a category, done. The app works out place and currency by itself, as soon as you enter your accommodation.',
  'Dein Tagesbudget rechnet sich selbst nach': 'Your daily budget recalculates itself',
  'Gibst du heute zu viel aus, sinkt die Zahl von morgen. Sparst du, steigt sie. Du musst nie etwas nachtragen.':
    'Overspend today and tomorrow’s number drops. Spend less and it rises. You never have to adjust anything.',

  'Frage 1 von 3': 'Question 1 of 3',
  'Frage 2 von 3': 'Question 2 of 3',
  'Frage 3 von 3': 'Question 3 of 3',
  'Wann geht\'s los?': 'When do you leave?',
  'Erster Reisetag': 'First day of the trip',
  'Wie lange bist du unterwegs?': 'How long are you travelling?',
  'Wie viel Geld hast du dafür?': 'How much money do you have for it?',
  'Alles lässt sich später in den Einstellungen ändern.':
    'You can change any of this later in Settings.',
  'Zurück': 'Back',
  'Weiter': 'Next',
  'Einleitung überspringen': 'Skip the intro',
  'Erst mit Beispieldaten ansehen': 'Look around with example data first',

  /* ---------- Beispielreise ---------- */
  'Beispielreise — erfundene Zahlen': 'Example trip — invented numbers',
  'Leeren': 'Clear',

  /* ---------- Kopfzeile ---------- */
  'Meine Reise': 'My trip',
  'Noch nicht eingerichtet': 'Not set up yet',

  /* ---------- Heute ---------- */
  'Sicherung fällig': 'Backup due',
  'Jetzt sichern': 'Back up now',
  'Tagesbudget, nach links und rechts wischbar': 'Daily budget, swipe left and right',
  'Tag davor': 'Previous day',
  'Tag danach': 'Next day',
  'Zurück zu heute': 'Back to today',
  'Heute angerechnet': 'Counted toward today',

  /* ---------- Das Formular ---------- */
  'Was hast du ausgegeben?': 'What did you spend?',
  'Stadt <span class="pflicht">Pflicht</span>': 'City <span class="pflicht">Required</span>',
  'z.B. San José': 'e.g. San José',
  'Daraus weiß die App, wo du wann warst — alle anderen Ausgaben ordnen sich über ihr Datum von selbst zu.':
    'This is how the app knows where you were and when — every other expense sorts itself by its date.',
  'Mehr Angaben <span>▾</span>': 'More details <span>▾</span>',
  'Datum': 'Date',
  'Gebucht bis': 'Booked until',
  'Notiz': 'Note',
  'z.B. Hostel Hanoi': 'e.g. Hostel Hanoi',
  'Bezahlt von': 'Paid by',
  'Geteilt mit': 'Split with',
  'Eintragen': 'Add',
  'Verbunden': 'Connected',
  'Abbrechen': 'Cancel',
  'Löschen': 'Delete',

  /* ---------- Ausgaben und Auswertung ---------- */
  'Noch keine Ausgaben': 'No expenses yet',
  'Reicht dein Geld?': 'Will your money last?',
  'Zurückgelegt': 'Set aside',
  'Was dich wo am Tag kostet': 'What each place costs you per day',
  'Alles zusammen. Tipp auf eine Stadt für die Aufschlüsselung.':
    'Everything combined. Tap a city for the breakdown.',
  'Wofür du dein Geld ausgibst': 'What you spend your money on',
  'Stand der Reisekasse': 'Shared fund balance',
  'Ausgleich – wer zahlt wem': 'Settling up – who pays whom',

  /* ---------- Einstellungen ---------- */
  '1. Wie lange reist du?': '1. How long are you travelling?',
  'Name der Reise': 'Trip name',
  'Südostasien 2026': 'Southeast Asia 2026',
  'Start': 'Start',
  'Ende': 'End',
  '…oder einfach die Dauer in Tagen': '…or just the length in days',
  'Beides hängt zusammen: änderst du das eine, rechnet die App das andere aus.':
    'The two are linked: change one and the app works out the other.',

  '2. Wie viel Geld hast du?': '2. How much money do you have?',
  'Gesamtbudget': 'Total budget',
  'Währung': 'Currency',
  'Deine Währung': 'Your currency',

  'Wechselkurse': 'Exchange rates',
  'Jede Ausgabe merkt sich den Kurs vom Tag der Eingabe. Was du einmal eingetragen hast, ändert sich nie wieder — auch nicht, wenn der Kurs schwankt.':
    'Every expense remembers the rate from the day you entered it. Once it is in, it never changes again — not even when the rate moves.',
  'Kurse aktualisieren': 'Update rates',

  'Unterkünfte ohne Stadt': 'Accommodation without a city',
  'Diese Buchungen haben noch keine Stadt. Trag sie nach, und alle Ausgaben aus dem jeweiligen Zeitraum ordnen sich rückwirkend zu.':
    'These bookings have no city yet. Add one, and every expense from that period sorts itself retroactively.',
  'Städte aus den Notizen übernehmen': 'Take cities from the notes',

  'Rücklagen': 'Reserves',
  'Geld für etwas Bestimmtes, das noch kommt – ein Flug, ein Visum, ein Tauchkurs. Der Betrag wird vom Budget abgezogen, <b>bevor</b> durch die Tage geteilt wird, und taucht deshalb nie in deinem Tagesbudget auf.':
    'Money for something specific still ahead – a flight, a visa, a diving course. The amount comes off your budget <b>before</b> it is divided by the days, which is why it never shows up in your daily budget.',
  'z.B. Flug Südamerika': 'e.g. Flight to South America',
  'Rücklage anlegen': 'Add reserve',

  '3. Dein Tagesbudget': '3. Your daily budget',
  'Dein Tagesbudget': 'Your daily budget',
  'Trag oben Zeitraum und Budget ein.': 'Enter your dates and budget above.',

  'Mitreisende': 'Travel companions',
  'Nur nötig, wenn ihr eine gemeinsame Kasse führt. Reist du allein, lass es einfach so.':
    'Only needed if you share a travel fund. Travelling alone? Just leave it.',
  'Name': 'Name',
  'Hinzufügen': 'Add',
  'Das bin ich': 'That’s me',

  'Abgleich mit deinem Server': 'Sync with your server',
  'Ohne das läuft die App vollständig weiter – die Daten liegen dann nur auf diesem Gerät. Mit Server-Abgleich wird jede Änderung zusätzlich dorthin geschrieben und überlebt auch ein verlorenes Handy.':
    'Without it the app works exactly as before – your data simply stays on this device. With server sync every change is written there as well and survives a lost phone.',
  'Adresse': 'Address',
  'Zugangsschlüssel': 'Access key',
  'einmal eintragen': 'enter once',
  'Groß- und Kleinschreibung müssen genau stimmen.':
    'Upper and lower case have to match exactly.',
  'Verbinden': 'Connect',
  'Jetzt abgleichen': 'Sync now',
  'Verbindung trennen': 'Disconnect',

  'Daten': 'Data',
  'Deine Ausgaben liegen nur auf diesem Gerät – sie gehen nie übers Internet. Das heißt aber auch: Handy weg, Daten weg. Hol dir deshalb regelmäßig eine Sicherung und leg sie in iCloud, Google Drive oder schick sie dir selbst per Mail.':
    'Your expenses stay on this device only – they never travel over the internet. Which also means: phone gone, data gone. So grab a backup now and then and put it in iCloud or Google Drive, or email it to yourself.',
  'Sicherung holen': 'Get a backup',
  'Sicherung laden': 'Load a backup',
  'Alle Daten löschen': 'Delete all data',

  /* ---------- Leiste unten ---------- */
  '<span>◐</span>Heute': '<span>◐</span>Today',
  '<span>≡</span>Ausgaben': '<span>≡</span>Expenses',
  '<span>◍</span>Auswertung': '<span>◍</span>Insights',
  '<span>⚙</span>Einstellungen': '<span>⚙</span>Settings',

  /* ---------- Die beiden Dialoge ---------- */
  'Stadt': 'City',
  'Schließen': 'Close',
  'Womit zahlst du hier?': 'What do you pay with here?',
  'Einmal bei der Ankunft im Land setzen. Der <b>Ort</b> wird nicht hier eingetragen — den kennt die App aus deinen Unterkünften.':
    'Set this once when you arrive in a country. The <b>place</b> is not entered here — the app knows that from your accommodation.',
  'Währung vor Ort': 'Local currency',
  'Übernehmen': 'Apply',

  'Sprache': 'Language',
  'Tage': 'Days',
  '0,00': '0.00',

  /* ==========================================================
     Texte aus dem Code
     ========================================================== */

  /* --- Zeiteinheiten. In {n} steckt die Zahl. --- */
  '{n} Tag': '{n} day',
  '{n} Tage': '{n} days',
  '{n} Eintrag': '{n} entry',
  '{n} Einträge': '{n} entries',
  'Gestern': 'Yesterday',
  'Heute verfügbar': 'Available today',
  'Morgen verfügbar': 'Available tomorrow',

  /* --- Kopfzeile --- */
  'Start am {datum}': 'Starts {datum}',
  'Reise beendet': 'Trip over',
  'Tag {nr} von {ganz}': 'Day {nr} of {ganz}',

  /* --- Die Tagesanzeige --- */
  '{a} von {b} ausgegeben': '{a} of {b} spent',
  '{a} von {b} schon belegt': '{a} of {b} already committed',
  '{geld} sind an diesem Tag übrig geblieben.': '{geld} was left over that day.',
  '{geld} zu viel an diesem Tag.': '{geld} over on that day.',
  '{geld} sind durch laufende Buchungen schon belegt.':
    '{geld} is already committed by ongoing bookings.',
  'Noch nichts belegt – der volle Betrag steht zur Verfügung.':
    'Nothing committed yet – the full amount is available.',

  /* --- Die Ratschlaege --- */
  'Deine Reise startet am {datum}. Geplant sind {geld} pro Tag.':
    'Your trip starts {datum}. The plan is {geld} per day.',
  'Reise vorbei. Du hast {a} von {b} ausgegeben – {schluss}':
    'Trip over. You spent {a} of {b} – {schluss}',
  '{geld} übrig.': '{geld} left.',
  '{geld} darüber.': '{geld} over.',
  'Heute noch nichts eingetragen. Du hast {geld} zur Verfügung.':
    'Nothing entered today yet. You have {geld} to spend.',
  'Gut unterwegs – noch {geld} für heute.': 'Doing well – {geld} left for today.',
  'Heute {geld} über deinem Tagesbudget.': '{geld} over your daily budget today.',
  'Dadurch hast du morgen nur noch {geld}.': 'That leaves you only {geld} tomorrow.',
  'Sobald ein paar Tage eingetragen sind, siehst du hier, ob dein Geld bis zum Reiseende reicht.':
    'Once a few days are entered, this tells you whether your money lasts to the end of the trip.',
  'Bei deinem bisherigen Schnitt von {geld} pro Tag hast du reichlich Luft – dein Geld würde weit über das Reiseende hinaus reichen.':
    'At your average of {geld} per day you have plenty of room – your money would last well beyond the end of the trip.',
  'Bei deinem bisherigen Schnitt von {geld} pro Tag reicht dein Geld sogar {tage} länger als geplant.':
    'At your average of {geld} per day your money lasts {tage} longer than planned.',
  'Wenn du so weitermachst, ist dein Geld am {datum} alle – {tage} vor deinem geplanten Ende. Versuch, in den nächsten Tagen unter {geld} zu bleiben.':
    'Carry on like this and your money runs out on {datum} – {tage} before your planned end. Try to stay under {geld} over the next few days.',
  'Du liegst im Plan – dein Geld reicht bis zum Reiseende.':
    'You are on track – your money lasts to the end of the trip.',

  /* --- Die Ausgabenliste --- */
  'Anteil von {geld} über {tage}': 'Share of {geld} over {tage}',
  'über {tage} verteilt': 'spread over {tage}',
  '{name} zahlte · geteilt durch {n}': '{name} paid · split {n} ways',
  'Trag deine erste Ausgabe auf dem Heute-Bildschirm ein.':
    'Enter your first expense on the Today screen.',

  /* --- Das Formular --- */
  'Bitte einen Betrag größer als 0 eintragen': 'Please enter an amount greater than 0',
  'Bitte die Stadt eintragen': 'Please enter the city',
  'Änderung speichern': 'Save change',
  'Änderung gespeichert': 'Change saved',
  'Diese Ausgabe wirklich löschen?': 'Really delete this expense?',
  'Ausgabe gelöscht': 'Expense deleted',
  '{geld} eingetragen': '{geld} added',
  '{geld} auf {tage} verteilt': '{geld} spread over {tage}',
  '{ganz} verteilt auf {tage} = {proTag} pro Tag':
    '{ganz} spread over {tage} = {proTag} per day',
  '„{wert}" eingetragen': '“{wert}” saved',

  /* --- Waehrung und Kurse --- */
  'Das ist deine eigene Währung – nichts umzurechnen.':
    'That is your own currency – nothing to convert.',
  'Kurs eintragen': 'Enter rate',
  'Heute vom Kursdienst geholt. Du kannst ihn überschreiben.':
    'Fetched from the rate service today. You can overwrite it.',
  'Kurs ist {alter} alt. Du kannst ihn überschreiben.':
    'Rate is {alter} old. You can overwrite it.',
  'Kein Kurs bekannt – ohne Netz bitte von Hand eintragen.':
    'No rate known – with no connection, please enter it by hand.',
  'Bitte einen Kurs eintragen': 'Please enter a rate',
  'Zahlst jetzt in {code}': 'Now paying in {code}',
  'Kein Kurs für {code} – oben auf den Ort tippen':
    'No rate for {code} – tap the place at the top',
  'Kein Kurs für {code} – oben auf den Ort tippen und eintragen':
    'No rate for {code} – tap the place at the top and enter one',
  'Noch keine Kurse geholt.': 'No rates fetched yet.',
  '{n} Kurse, heute geholt.': '{n} rates, fetched today.',
  '{n} Kurse, {alter} alt.': '{n} rates, {alter} old.',
  'Kurse werden geholt …': 'Fetching rates …',
  'Kurse aktualisiert': 'Rates updated',
  'Basiswährung von {alt} auf {neu} umstellen?':
    'Switch your base currency from {alt} to {neu}?',
  'Bereits eingetragene Ausgaben behalten ihre gespeicherten Kurse und werden dadurch falsch umgerechnet. Sinnvoll nur, solange die Reise noch nicht läuft.':
    'Expenses already entered keep their stored rates and will therefore convert incorrectly. Only sensible while the trip has not started.',

  /* --- Der Startablauf --- */
  '{geld} pro Tag': '{geld} per day',
  '{budget} geteilt durch {tage}. Die App passt die Zahl täglich an das an, was du wirklich ausgibst.':
    '{budget} divided by {tage}. The app adjusts this number daily to what you actually spend.',
  'Die App passt diese Zahl täglich an das an, was du wirklich ausgibst.':
    'The app adjusts this number daily to what you actually spend.',
  'Letzter Reisetag: {datum}': 'Last day of the trip: {datum}',
  'Bitte ein Startdatum wählen': 'Please pick a start date',
  'Bitte eine Anzahl Tage eintragen': 'Please enter a number of days',
  'Mehr als drei Jahre? Bitte prüf die Zahl noch mal':
    'More than three years? Please check that number again',
  'Bitte dein Gesamtbudget eintragen': 'Please enter your total budget',
  'Fertig': 'Done',
  'Los geht’s': 'Let’s go',

  /* --- Beispielreise --- */
  'Beispielreise geladen': 'Example trip loaded',
  'Beispielreise verwerfen und mit einer eigenen anfangen?':
    'Discard the example trip and start one of your own?',

  /* --- Auswertung --- */
  'Ort noch unbekannt': 'Place still unknown',
  'Für {tage} fehlt noch eine Unterkunft mit Stadt.':
    '{tage} still have no accommodation with a city.',
  '{tage} · insgesamt {geld}': '{tage} · {geld} in total',
  '{prozent}% · {geld} pro Tag': '{prozent}% · {geld} per day',
  'Sobald du etwas einträgst, siehst du hier die Aufteilung.':
    'Once you enter something, the breakdown appears here.',
  'Dein Geld reicht': 'Your money lasts',
  'Es wird knapp': 'It will be tight',
  'Dein Plan: {geld} über {tage}.': 'Your plan: {geld} over {tage}.',
  'Bei {geld} pro Tag reicht es weit über dein Reiseende am {ende} hinaus.':
    'At {geld} per day it lasts well beyond your end date of {ende}.',
  'Bei {geld} pro Tag reicht es bis zum {bis} – dein Reiseende ist der {ende}.':
    'At {geld} per day it lasts until {bis} – your trip ends {ende}.',
  'Bei {geld} pro Tag ist das Geld am {datum} alle – {tage} vor deinem Reiseende am {ende}.':
    'At {geld} per day the money runs out on {datum} – {tage} before your end date of {ende}.',
  'Schon ausgegeben': 'Spent so far',
  'Übrig': 'Left',
  'Fürs Tägliche': 'Day to day',
  'Schnitt bisher': 'Average so far',
  '{geld} / Tag': '{geld} / day',
  'Alles ausgeglichen – niemand schuldet jemandem etwas.':
    'All square – nobody owes anybody anything.',
  'ausgelegt {a} · Anteil {b}': 'paid {a} · share {b}',

  /* --- Ruecklagen --- */
  'bezahlt': 'paid',
  'noch offen': 'still open',
  'schon bezahlt': 'already paid',
  'Rücklagen zu hoch': 'Reserves too high',
  'Deine Rücklagen von {r} verbrauchen dein ganzes Budget von {ganz}. Für den Alltag bleibt nichts übrig.':
    'Your reserves of {r} use up your entire budget of {ganz}. Nothing is left for day to day.',
  'Gib der Rücklage einen Namen': 'Give the reserve a name',
  'Bitte einen Betrag eintragen': 'Please enter an amount',
  '{geld} für „{name}" zurückgelegt': '{geld} set aside for “{name}”',
  'Rücklage „{name}" entfernen? Der Betrag steht dann wieder fürs Tagesbudget zur Verfügung.':
    'Remove the reserve “{name}”? The amount goes back into your daily budget.',

  /* --- Mitreisende --- */
  '{name} ist dabei': '{name} is in',
  '{name} entfernen': 'Remove {name}',
  '{name} entfernen?': 'Remove {name}?',
  '{name} entfernen? {n} Ausgabe(n) werden dann neu aufgeteilt – die Abrechnung ändert sich.':
    'Remove {name}? {n} expense(s) will be split again – the settlement changes.',

  /* --- Orte nachtragen --- */
  'Bei {n} wird die Notiz als Stadt übernommen.':
    'For {n} the note will be used as the city.',
  '{n} übernommen': '{n} updated',
  'Trag unter Einstellungen deinen Zeitraum und dein Budget ein.':
    'Enter your dates and budget under Settings.',

  /* --- Abgleich --- */
  'Abgleich: {was}': 'Sync: {was}',
  'eingerichtet': 'set up',
  'Abgleich eingerichtet': 'Sync is set up',
  'Wird übertragen …': 'Sending …',
  'Gespeichert auf dem Server': 'Saved on the server',
  'Nicht übertragen – {grund}': 'Not sent – {grund}',
  'Wird abgeglichen …': 'Syncing …',
  'Erstmalig auf den Server geschrieben': 'Written to the server for the first time',
  'Alles auf dem gleichen Stand': 'Everything in sync',
  'Neueren Stand vom Server geholt': 'Fetched the newer version from the server',
  'Server nachgezogen': 'Server brought up to date',
  'Auf beiden Seiten wurde etwas geändert, seit zuletzt abgeglichen wurde.':
    'Both sides changed since the last sync.',
  'Auf diesem Gerät: {n}, zuletzt {wann}': 'On this device: {n}, last {wann}',
  'Auf dem Server: {n}, zuletzt {wann}': 'On the server: {n}, last {wann}',
  'OK = Server-Stand übernehmen (dieses Gerät wird überschrieben)':
    'OK = take the server version (this device gets overwritten)',
  'Abbrechen = dieses Gerät behalten (Server wird überschrieben)':
    'Cancel = keep this device (the server gets overwritten)',
  'Server-Stand übernommen': 'Server version taken',
  'Dieses Gerät behalten': 'Kept this device',
  'Nicht verbunden – deine Daten liegen nur auf diesem Gerät.':
    'Not connected – your data is on this device only.',
  'Zuletzt abgeglichen: {wann}': 'Last synced: {wann}',
  'Verbunden, aber noch nie abgeglichen.': 'Connected, but never synced.',
  'Adresse und Schlüssel eintragen': 'Enter address and key',
  'Verbindung wird geprüft …': 'Checking the connection …',
  'Verbindung trennen? Deine Daten bleiben auf diesem Gerät und auf dem Server, werden aber nicht mehr abgeglichen.':
    'Disconnect? Your data stays on this device and on the server, but is no longer synced.',
  'Verbindung getrennt': 'Disconnected',

  /* --- Sicherung --- */
  'Noch nie gesichert': 'Never backed up',
  'Noch nie gesichert.': 'Never backed up.',
  'Noch nichts einzutragen.': 'Nothing to back up yet.',
  'Du hast {n}, aber noch keine Sicherung.': 'You have {n}, but no backup yet.',
  'Deine letzte Sicherung ist {alter} her.': 'Your last backup was {alter} ago.',
  'Deine Daten liegen auf dem Handy und auf deinem Server. Eine Datei in iCloud wäre die dritte Kopie – die einzige, die keins von beidem braucht.':
    'Your data sits on your phone and on your server. A file in iCloud would be the third copy – the only one that needs neither.',
  'Deine Daten liegen nur auf diesem Gerät. Hol dir eine Kopie und leg sie in iCloud, Google Drive oder schick sie dir selbst per Mail.':
    'Your data is on this device only. Grab a copy and put it in iCloud or Google Drive, or email it to yourself.',
  'Zuletzt gesichert: heute.': 'Last backed up: today.',
  'Zuletzt gesichert: vor {n} Tag.': 'Last backed up: {n} day ago.',
  'Zuletzt gesichert: vor {n} Tagen.': 'Last backed up: {n} days ago.',
  'Backpack Budget – Sicherung': 'Backpack Budget – backup',
  'Deine Sicherung wurde erstellt, aber dein Browser konnte das Teilen-Menü nicht öffnen.':
    'Your backup was created, but your browser could not open the share menu.',
  'Die Datei ist jetzt zu sehen. Tippe auf das Teilen-Symbol und wähle „In Dateien sichern" oder schick sie dir selbst zu.':
    'The file is now on screen. Tap the share icon and choose “Save to Files”, or send it to yourself.',
  'Sicherung gespeichert': 'Backup saved',
  'Sicherung erstellt': 'Backup created',
  'Format passt nicht': 'Wrong format',
  'Sicherung laden? Deine aktuellen Daten werden dabei ersetzt.':
    'Load backup? Your current data will be replaced.',
  'Sicherung geladen': 'Backup loaded',
  'Datei konnte nicht gelesen werden': 'The file could not be read',
  'Wirklich ALLE Ausgaben und Einstellungen löschen? Das lässt sich nicht rückgängig machen.':
    'Really delete ALL expenses and settings? This cannot be undone.',
  'Alles zurückgesetzt': 'Everything reset',

  '{ganz} geteilt durch {tage}.': '{ganz} divided by {tage}.',
  '{ganz} minus {r} Rücklagen = {rest}, geteilt durch {tage}.':
    '{ganz} minus {r} in reserves = {rest}, divided by {tage}.',
  'Noch nicht eingerichtet': 'Not set up yet',

  /* ==========================================================
     Waehrungsnamen und Kategorien
     ========================================================== */

  'Euro': 'Euro',
  'US-Dollar': 'US dollar',
  'Britisches Pfund': 'British pound',
  'Schweizer Franken': 'Swiss franc',
  'Tschechische Krone': 'Czech koruna',
  'Polnischer Złoty': 'Polish złoty',
  'Ungarischer Forint': 'Hungarian forint',
  'Rumänischer Leu': 'Romanian leu',
  'Bulgarischer Lew': 'Bulgarian lev',
  'Serbischer Dinar': 'Serbian dinar',
  'Bosnische Mark': 'Bosnian mark',
  'Albanischer Lek': 'Albanian lek',
  'Dänische Krone': 'Danish krone',
  'Schwedische Krone': 'Swedish krona',
  'Norwegische Krone': 'Norwegian krone',
  'Isländische Krone': 'Icelandic króna',
  'Türkische Lira': 'Turkish lira',
  'Marokkanischer Dirham': 'Moroccan dirham',
  'Ägyptisches Pfund': 'Egyptian pound',
  'Südafrikanischer Rand': 'South African rand',
  'Kenia-Schilling': 'Kenyan shilling',
  'Tansania-Schilling': 'Tanzanian shilling',
  'Costa-Rica-Colón': 'Costa Rican colón',
  'Guatemaltekischer Quetzal': 'Guatemalan quetzal',
  'Panamaischer Balboa': 'Panamanian balboa',
  'Mexikanischer Peso': 'Mexican peso',
  'Kolumbianischer Peso': 'Colombian peso',
  'Peruanischer Sol': 'Peruvian sol',
  'Bolivianischer Boliviano': 'Bolivian boliviano',
  'Brasilianischer Real': 'Brazilian real',
  'Argentinischer Peso': 'Argentine peso',
  'Chilenischer Peso': 'Chilean peso',
  'Thailändischer Baht': 'Thai baht',
  'Vietnamesischer Dong': 'Vietnamese dong',
  'Laotischer Kip': 'Lao kip',
  'Kambodschanischer Riel': 'Cambodian riel',
  'Myanmarischer Kyat': 'Myanmar kyat',
  'Indonesische Rupiah': 'Indonesian rupiah',
  'Malaysischer Ringgit': 'Malaysian ringgit',
  'Philippinischer Peso': 'Philippine peso',
  'Singapur-Dollar': 'Singapore dollar',
  'Indische Rupie': 'Indian rupee',
  'Nepalesische Rupie': 'Nepalese rupee',
  'Sri-Lanka-Rupie': 'Sri Lankan rupee',
  'Japanischer Yen': 'Japanese yen',
  'Südkoreanischer Won': 'South Korean won',
  'Chinesischer Yuan': 'Chinese yuan',
  'Hongkong-Dollar': 'Hong Kong dollar',
  'Taiwan-Dollar': 'Taiwan dollar',
  'Australischer Dollar': 'Australian dollar',
  'Neuseeland-Dollar': 'New Zealand dollar',
  'Kanadischer Dollar': 'Canadian dollar',
  'VAE-Dirham': 'UAE dirham',
  'Georgischer Lari': 'Georgian lari',
  'Ukrainische Hrywnja': 'Ukrainian hryvnia',

  'Essen & Trinken': 'Food & Drink',
  'Fortbewegung': 'Getting around',
  'Unterkunft': 'Accommodation',
  'Aktivitäten': 'Activities',
  'Sonstiges': 'Other',
  'Ich': 'Me',

  /* --- Die Beispielreise --- */
  'Südostasien': 'Southeast Asia',
  'Rückflug ab Bangkok': 'Flight home from Bangkok',
  'Hostel {ort}': 'Hostel {ort}',
  'Bus von {ort}': 'Bus from {ort}',
  'Streetfood': 'Street food',
  'Markt': 'Market',
  'Frühstück': 'Breakfast',
  'Nudelsuppe': 'Noodle soup',
  'Abendessen': 'Dinner',
  'Kaffee': 'Coffee',
  'Smoothie': 'Smoothie',
  'Wäscherei': 'Laundry',
  'SIM-Karte': 'SIM card',
  'Apotheke': 'Pharmacy',
  'Sonnencreme': 'Sunscreen',
  'Tempel': 'Temple',
  'Tour': 'Tour',

  /* --- Fehlermeldungen aus sync.js und waehrung.js --- */
  'Zugangsschlüssel stimmt nicht': 'Access key is wrong',
  'Server antwortet mit Fehler {code}': 'Server responded with error {code}',
  'Server antwortet nicht': 'Server is not responding',
  'Server nicht erreichbar': 'Server unreachable',
  'Keine Adresse angegeben': 'No address given',
  'Unerwartete Antwort': 'Unexpected response',
  'Kursdienst antwortet mit {code}': 'Rate service responded with {code}',
  'Kursdienst antwortet nicht': 'Rate service is not responding',
  'Keine Verbindung zum Kursdienst': 'No connection to the rate service'

});
