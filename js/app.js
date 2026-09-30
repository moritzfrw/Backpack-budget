/* ==========================================================
   app.js – Die Oberflaeche.

   Hier wird nichts gerechnet und nichts gespeichert. Diese Datei
   holt die Daten (Store), laesst rechnen (Budget) und schreibt das
   Ergebnis auf den Bildschirm. Umgekehrt nimmt sie Klicks und
   Eingaben entgegen und gibt sie weiter.
   ========================================================== */

(function () {

  /* Wird unten in den Einstellungen angezeigt, damit man ohne Raten
     sieht, welche Fassung auf dem Handy laeuft. Bei jeder
     Veroeffentlichung zusammen mit VERSION in sw.js hochzaehlen. */
  const APP_VERSION = 'v10';

  let zustand = Store.laden();

  /* Merker fuer das Eingabefeld */
  let formKategorie = 'essen';
  let formGeteilt = new Set();
  /* Beim Bearbeiten eines alten Eintrags gilt DESSEN Waehrung und
     Kurs weiter. Sonst bekaeme eine Ausgabe aus Portugal beim
     Nachbessern in Costa Rica ploetzlich Colón verpasst. */
  let formBestand = null;

  const $ = id => document.getElementById(id);
  const el = (tag, klasse, text) => {
    const n = document.createElement(tag);
    if (klasse) n.className = klasse;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  /* ---------- Zahlen und Datum lesbar machen ---------- */

  /* Betrag in deiner Basiswaehrung - damit rechnet die ganze App. */
  function geld(betrag) {
    return geldIn(betrag, zustand.reise.waehrung);
  }

  /* Betrag in einer beliebigen Waehrung.

     Intl kennt die Nachkommastellen jeder Waehrung: Yen und Dong
     haben keine, der Dinar hat drei. Von Hand gebaut waere das
     fuer die halbe Welt falsch. */
  function geldIn(betrag, code) {
    try {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency', currency: code, currencyDisplay: 'narrowSymbol'
      }).format(betrag || 0);
    } catch (e) {
      const zahl = new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(betrag || 0);
      return zahl + ' ' + code;
    }
  }

  function lokaleWaehrung() {
    return (zustand.aktuell && zustand.aktuell.waehrung) || zustand.reise.waehrung;
  }

  /* Welche Waehrung gerade im Formular gilt. */
  function formularWaehrung() {
    return formBestand ? formBestand.waehrung : lokaleWaehrung();
  }

  /* Nimmt "12,50", "12.50", "30.000" oder " 12,50 € " und macht
     eine Zahl daraus.

     Der Tausenderpunkt ist der Grund fuer die Fallunterscheidung:
     In Vietnam kostet ein Kaffee 30.000 Dong. Wuerde der Punkt
     stumpf als Komma gelesen, waeren daraus 30 Dong - und das
     Tagesbudget waere um den Faktor 1000 daneben.

     Regel: Ein Komma ist immer das Dezimaltrennzeichen. Steht nur
     ein Punkt da und folgen ihm genau drei Ziffern, ist es ein
     Tausenderpunkt. Sonst ist der Punkt das Dezimaltrennzeichen. */
  function betragLesen(text) {
    let roh = String(text).replace(/[^0-9,.-]/g, '');
    if (!roh) return null;

    if (roh.indexOf(',') !== -1) {
      roh = roh.replace(/\./g, '').replace(',', '.');
    } else {
      const teile = roh.split('.');
      const istTausender = teile.length > 1 &&
                           teile.slice(1).every(t => t.length === 3);
      if (istTausender) roh = teile.join('');
    }

    const zahl = parseFloat(roh);
    return isNaN(zahl) ? null : Math.round(zahl * 100) / 100;
  }

  function datumLesbar(datumText) {
    const heute = Store.heuteAlsText();
    if (datumText === heute) return 'Heute';
    if (datumText === Budget.tagVerschieben(heute, -1)) return 'Gestern';
    return datumKurz(datumText, true);
  }

  function datumKurz(datumText, mitWochentag) {
    if (!datumText) return '–';
    const [j, m, t] = datumText.split('-').map(Number);
    return new Date(j, m - 1, t).toLocaleDateString('de-DE', mitWochentag
      ? { weekday: 'short', day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'long' });
  }

  function tage(n) { return n + (n === 1 ? ' Tag' : ' Tage'); }
  function eintraege(n) { return n + (n === 1 ? ' Eintrag' : ' Einträge'); }

  function person(id) {
    return zustand.personen.find(p => p.id === id) || { id, name: '?' };
  }

  /* Nach einer Aenderung durch dich: Zeitstempel hochsetzen, lokal
     sichern, und den Server nachziehen lassen. */
  function speichern() {
    zustand.stand = Date.now();
    Store.sichern(zustand);
    zeichnen();
    schickenSpaeter();
  }

  /* Sichern OHNE den Zeitstempel anzufassen. Gebraucht, wenn wir
     gerade den Stand vom Server uebernommen haben – der ist ja
     nicht neu, sondern nur neu hier. */
  function nurSichern() {
    Store.sichern(zustand);
    zeichnen();
  }

  function melden(text) {
    const t = $('toast');
    t.textContent = text;
    t.hidden = false;
    clearTimeout(melden._uhr);
    melden._uhr = setTimeout(() => { t.hidden = true; }, 2400);
  }

  /* ==========================================================
     Ort und Waehrung

     Beides aendert sich gemeinsam: Du fliegst nach Costa Rica,
     und ab da ist alles San José UND Colón. Deshalb ein einziger
     Regler fuer beides, einmal bei der Ankunft gesetzt. Danach
     bekommt jeder Eintrag den Stempel automatisch - die Eingabe
     bleibt Betrag plus Kategorie, wie bisher.
     ========================================================== */

  function zeichneOrtsleiste() {
    const ort = (zustand.aktuell.ort || '').trim();
    const name = $('ort-name');
    name.textContent = ort || 'Ort setzen';
    name.classList.toggle('leer', !ort);
    $('ort-waehrung').textContent = lokaleWaehrung();
  }

  /* Alle bisher benutzten Orte - fuellt die Vorschlagsliste, damit
     man einen Ort nur einmal im Leben tippt. */
  function bekannteOrte() {
    const gesehen = new Set();
    zustand.ausgaben.forEach(a => {
      const o = (a.ort || '').trim();
      if (o) gesehen.add(o);
    });
    const jetzt = (zustand.aktuell.ort || '').trim();
    if (jetzt) gesehen.add(jetzt);
    return [...gesehen].sort((a, b) => a.localeCompare(b, 'de'));
  }

  function zeichneOrtVorschlaege() {
    const liste = $('ort-vorschlaege');
    liste.textContent = '';
    bekannteOrte().forEach(o => {
      const opt = document.createElement('option');
      opt.value = o;
      liste.append(opt);
    });
  }

  function waehrungsAuswahlFuellen(auswahl, gewaehlt) {
    auswahl.textContent = '';
    Waehrung.LISTE.forEach(w => {
      const o = el('option', null, w.code + ' – ' + w.name);
      o.value = w.code;
      auswahl.append(o);
    });
    /* Eine Waehrung, die nicht in unserer Liste steht, aber in den
       Daten vorkommt, darf nicht stillschweigend verschwinden. */
    if (gewaehlt && !Waehrung.LISTE.some(w => w.code === gewaehlt)) {
      const o = el('option', null, gewaehlt);
      o.value = gewaehlt;
      auswahl.append(o);
    }
    auswahl.value = gewaehlt;
  }

  /* --- Der Dialog --- */

  function ortDialogOeffnen() {
    zeichneOrtVorschlaege();
    $('ort-eingabe').value = zustand.aktuell.ort || '';
    waehrungsAuswahlFuellen($('ort-waehrung-wahl'), lokaleWaehrung());
    ortKursZeigen();
    $('ort-overlay').hidden = false;
    setTimeout(() => $('ort-eingabe').focus(), 50);
  }

  function ortDialogSchliessen() {
    $('ort-overlay').hidden = true;
  }

  /* Zeigt den Kurs und laesst ihn von Hand überschreiben. Beides
     wird gebraucht: ohne Netz kennt die App keinen Kurs, und der
     Kurs am Geldautomaten weicht ohnehin vom Marktkurs ab. */
  function ortKursZeigen() {
    const basis = zustand.reise.waehrung;
    const code = $('ort-waehrung-wahl').value;
    const kasten = $('ort-kurs-hinweis');
    kasten.textContent = '';
    kasten.className = 'kurs-hinweis';

    if (code === basis) {
      kasten.textContent = 'Das ist deine eigene Währung – nichts umzurechnen.';
      return;
    }

    const bekannt = Waehrung.kurs(basis, code);
    const zeile = el('div');
    zeile.append(document.createTextNode('1 ' + basis + ' = '));

    const feld = document.createElement('input');
    feld.type = 'text';
    feld.inputMode = 'decimal';
    feld.id = 'ort-kurs-feld';
    feld.className = 'kurs-feld';
    feld.value = bekannt ? String(bekannt).replace('.', ',') : '';
    feld.placeholder = 'Kurs eintragen';
    zeile.append(feld, document.createTextNode(' ' + code));
    kasten.append(zeile);

    const alter = Waehrung.alterTage();
    const sub = el('div', 'kachel-sub');
    if (bekannt && alter === 0) sub.textContent = 'Heute vom Kursdienst geholt. Du kannst ihn überschreiben.';
    else if (bekannt) sub.textContent = 'Kurs ist ' + tage(alter) + ' alt. Du kannst ihn überschreiben.';
    else {
      kasten.classList.add('warn');
      sub.textContent = 'Kein Kurs bekannt – ohne Netz bitte von Hand eintragen.';
    }
    kasten.append(sub);
  }

  async function ortUebernehmen() {
    const ort = $('ort-eingabe').value.trim();
    const code = $('ort-waehrung-wahl').value;
    const basis = zustand.reise.waehrung;

    if (code !== basis) {
      const feld = $('ort-kurs-feld');
      const kurs = feld ? betragLesenGenau(feld.value) : null;
      if (!kurs || kurs <= 0) {
        melden('Bitte einen Kurs eintragen');
        if (feld) feld.focus();
        return;
      }
      /* Von Hand gesetzte Kurse gehoeren in den Vorrat, sonst waeren
         sie beim naechsten Eintrag wieder weg. */
      const v = Waehrung.vorrat() || { basis: basis, kurse: {}, geholt: 0 };
      if (v.basis !== basis) { v.basis = basis; v.kurse = {}; }
      v.kurse[code] = kurs;
      try { localStorage.setItem('backpack-budget-kurse', JSON.stringify(v)); } catch (e) {}
    }

    zustand.aktuell = { ort: ort, waehrung: code };
    ortDialogSchliessen();
    speichern();
    melden(ort ? ort + ' · ' + code : code + ' übernommen');
  }

  /* Wie betragLesen, aber ohne Rundung auf zwei Stellen - ein Kurs
     wie 29431,412651 darf nicht auf 29431,41 gekuerzt werden. */
  function betragLesenGenau(text) {
    let roh = String(text).replace(/[^0-9,.-]/g, '');
    if (!roh) return null;
    if (roh.indexOf(',') !== -1) roh = roh.replace(/\./g, '').replace(',', '.');
    const zahl = parseFloat(roh);
    return isNaN(zahl) ? null : zahl;
  }

  /* ==========================================================
     Zeichnen
     ========================================================== */

  function zeichnen() {
    const p = Budget.plan(zustand);
    zeichneOrtsleiste();
    zeichneKopf(p);
    zeichneHeute(p);
    zeichneFormular();
    zeichneAusgaben();
    zeichneAuswertung(p);
    zeichneEinstellungen(p);
  }

  function zeichneKopf(p) {
    $('kopf-reise').textContent = zustand.reise.name || 'Meine Reise';
    if (!p.eingerichtet) {
      $('kopf-fortschritt').textContent = 'Noch nicht eingerichtet';
    } else if (p.status === 'vorher') {
      $('kopf-fortschritt').textContent = 'Start am ' + datumKurz(p.start);
    } else if (p.status === 'beendet') {
      $('kopf-fortschritt').textContent = 'Reise beendet';
    } else {
      $('kopf-fortschritt').textContent = 'Tag ' + p.tagNummer + ' von ' + p.gesamtTage;
    }
  }

  /* ---------- Heute ---------- */

  /* Wie viele Tage ist die letzte Sicherung her? null = noch nie. */
  function sicherungAlterTage() {
    if (!zustand.letzteSicherung) return null;
    return Math.floor((Date.now() - zustand.letzteSicherung) / 86400000);
  }

  /* Seit wann gibt es ueberhaupt Daten? Dient als Ersatzmassstab,
     solange noch nie gesichert wurde. */
  function datenAlterTage() {
    const zeiten = zustand.ausgaben.map(a => a.angelegt).filter(Boolean);
    if (!zeiten.length) return 0;
    return Math.floor((Date.now() - Math.min.apply(null, zeiten)) / 86400000);
  }

  /* Ohne Server: woechentlich erinnern. Mit Server-Abgleich und
     dessen taeglichen Sicherungen waere das Nörgeln uebertrieben. */
  function sicherungIntervall() {
    return Sync.eingerichtet() ? 30 : 7;
  }

  /* Wann die Erinnerung erscheinen soll.

     Der Fall "noch nie gesichert" braucht eine Sonderbehandlung:
     ohne Server haengt alles am Handy, da darf sofort gemahnt
     werden. Mit Server liegen die Daten schon doppelt und werden
     dort naechtlich kopiert - dann waere eine gelbe Karte am ersten
     Tag blosser Laerm. Deshalb zaehlen wir in dem Fall die Tage
     seit dem ersten Eintrag. */
  function sicherungFaellig() {
    if (!zustand.ausgaben.length) return false;
    const alter = sicherungAlterTage();
    if (alter !== null) return alter >= sicherungIntervall();
    if (!Sync.eingerichtet()) return true;
    return datenAlterTage() >= sicherungIntervall();
  }

  function zeichneSicherung() {
    const alter = sicherungAlterTage();
    const karte = $('sicherung-karte');
    const faellig = sicherungFaellig();
    karte.hidden = !faellig;

    if (faellig) {
      $('sicherung-titel').textContent = alter === null
        ? 'Noch nie gesichert' : 'Sicherung fällig';
      /* Mit Server-Abgleich waere "liegen nur auf diesem Geraet"
         schlicht falsch - dann ist die Datei die dritte Kopie. */
      $('sicherung-text').textContent = (alter === null
        ? 'Du hast ' + eintraege(zustand.ausgaben.length) + ', aber noch keine Sicherung. '
        : 'Deine letzte Sicherung ist ' + tage(alter) + ' her. ') +
        (Sync.eingerichtet()
          ? 'Deine Daten liegen auf dem Handy und auf deinem Server. Eine Datei in '
            + 'iCloud wäre die dritte Kopie – die einzige, die keins von beidem braucht.'
          : 'Deine Daten liegen nur auf diesem Gerät. Hol dir eine Kopie und leg sie '
            + 'in iCloud, Google Drive oder schick sie dir selbst per Mail.');
    }

    const stand = $('e-sicherung-stand');
    if (alter === null) {
      stand.textContent = zustand.ausgaben.length
        ? 'Noch nie gesichert.' : 'Noch nichts einzutragen.';
    } else if (alter === 0) {
      stand.textContent = 'Zuletzt gesichert: heute.';
    } else {
      /* "vor 8 Tagen" – Dativ, deshalb nicht der tage()-Helfer. */
      stand.textContent = 'Zuletzt gesichert: vor ' + alter +
        (alter === 1 ? ' Tag.' : ' Tagen.');
    }
  }

  function zeichneHeute(p) {
    zeichneSicherung();
    $('setup-karte').hidden = p.eingerichtet;
    $('heute-karte').hidden = !p.eingerichtet;
    if (p.eingerichtet) {
      $('heute-betrag').textContent = geld(p.heuteVerfuegbar);
      $('heute-betrag').classList.toggle('negativ', p.heuteVerfuegbar < 0);

      const balken = $('heute-balken');
      balken.className = 'balken-fuell';
      const anteilProzent = p.heutigesBudget > 0
        ? Math.min(100, p.heuteAusgegeben / p.heutigesBudget * 100) : 0;
      balken.style.width = anteilProzent + '%';
      if (p.heuteVerfuegbar < 0) balken.classList.add('drueber');
      else if (anteilProzent > 80) balken.classList.add('warnung');

      $('heute-fuss').textContent = geld(p.heuteAusgegeben) + ' von ' +
        geld(p.heutigesBudget) + ' ausgegeben';

      const rat = $('heute-rat');
      rat.textContent = '';
      ratSaetze(p).forEach(satz => {
        const zeile = el('p', 'rat-satz' + (satz.warnung ? ' warnung' : satz.lob ? ' lob' : ''), satz.text);
        rat.append(zeile);
      });
    }
    zeichneHeuteListe(p);
  }

  /* Die Saetze, die dir sagen, wie du dastehst. */
  function ratSaetze(p) {
    if (p.status === 'vorher') {
      return [{ text: 'Deine Reise startet am ' + datumKurz(p.start) + '. Geplant sind ' +
                geld(p.tagesbudgetPlan) + ' pro Tag.' }];
    }
    if (p.status === 'beendet') {
      const rest = p.gesamtbudget - p.gesamtAusgegeben;
      return [{
        text: 'Reise vorbei. Du hast ' + geld(p.gesamtAusgegeben) + ' von ' +
              geld(p.gesamtbudget) + ' ausgegeben – ' +
              (rest >= 0 ? geld(rest) + ' übrig.' : geld(-rest) + ' darüber.'),
        lob: rest >= 0, warnung: rest < 0
      }];
    }

    const saetze = [];

    /* 1. Wie steht der heutige Tag? */
    if (p.heuteAusgegeben === 0) {
      saetze.push({ text: 'Heute noch nichts eingetragen. Du hast ' +
                          geld(p.heutigesBudget) + ' zur Verfügung.' });
    } else if (p.heuteVerfuegbar >= 0) {
      saetze.push({ text: 'Gut unterwegs – noch ' + geld(p.heuteVerfuegbar) +
                          ' für heute.', lob: true });
    } else {
      let text = 'Heute ' + geld(-p.heuteVerfuegbar) + ' über deinem Tagesbudget.';
      if (p.morgenBudget !== null) {
        text += ' Dadurch hast du morgen nur noch ' + geld(p.morgenBudget) + '.';
      }
      saetze.push({ text, warnung: true });
    }

    /* 2. Was heisst das fuer die ganze Reise? */
    if (p.differenzTage === null) {
      saetze.push({ text: 'Sobald ein paar Tage eingetragen sind, siehst du hier, ' +
                          'ob dein Geld bis zum Reiseende reicht.' });
    } else if (p.differenzTage >= 2) {
      /* Nach wenigen Tagen kann der Schnitt noch sehr niedrig sein und
         die Prognose absurde Zahlen liefern. Dann lieber qualitativ. */
      saetze.push({ text: p.differenzTage > p.restTage
        ? 'Bei deinem bisherigen Schnitt von ' + geld(p.schnitt) + ' pro Tag hast du ' +
          'reichlich Luft – dein Geld würde weit über das Reiseende hinaus reichen.'
        : 'Bei deinem bisherigen Schnitt von ' + geld(p.schnitt) + ' pro Tag reicht ' +
          'dein Geld sogar ' + tage(p.differenzTage) + ' länger als geplant.',
        lob: true });
    } else if (p.differenzTage <= -2) {
      saetze.push({ text: 'Wenn du so weitermachst, ist dein Geld am ' +
                          datumKurz(p.prognoseEnde) + ' alle – ' +
                          tage(Math.abs(p.differenzTage)) + ' vor deinem geplanten Ende. ' +
                          'Versuch, in den nächsten Tagen unter ' + geld(p.heutigesBudget) +
                          ' zu bleiben.', warnung: true });
    } else {
      saetze.push({ text: 'Du liegst im Plan – dein Geld reicht bis zum Reiseende.', lob: true });
    }
    return saetze;
  }

  /* Was heute vom Budget abgeht – inklusive der Tagesanteile
     laufender Buchungen. */
  function zeichneHeuteListe(p) {
    const liste = $('heute-liste');
    liste.textContent = '';

    const heute = p.heute;
    const treffer = zustand.ausgaben.filter(a =>
      Budget.tageEinerAusgabe(a).includes(heute) &&
      Budget.anteilProTag(a, zustand.ichBinId) > 0);

    $('heute-kopf').hidden = !treffer.length;
    if (!treffer.length) return;

    treffer.forEach(a => {
      const k = Store.kategorie(a.kategorie);
      const anzahlTage = Budget.tageEinerAusgabe(a).length;
      const posten = el('button', 'posten');
      posten.type = 'button';

      const text = el('div');
      text.append(el('div', 'posten-titel', a.notiz || k.name));
      const untertitel = [];
      if (anzahlTage > 1) untertitel.push('Anteil von ' + geld(Budget.basis(a)) + ' über ' + tage(anzahlTage));
      else untertitel.push(k.name);
      if (a.waehrung !== zustand.reise.waehrung) untertitel.push(geldIn(a.betrag, a.waehrung));
      text.append(el('div', 'posten-sub', untertitel.join(' · ')));

      posten.append(el('div', 'posten-icon', k.icon), text,
                    el('div', 'posten-betrag', geld(Budget.anteilProTag(a, zustand.ichBinId))));
      posten.onclick = () => formularFuellen(a);
      liste.append(posten);
    });
  }

  /* ---------- Eingabefeld ---------- */

  function zeichneFormular() {
    /* Vier grosse Kategorie-Kacheln */
    const kats = $('f-kategorien');
    kats.textContent = '';
    Store.KATEGORIEN.forEach(k => {
      const kachel = el('button', 'kat-kachel' + (k.id === formKategorie ? ' aktiv' : ''));
      kachel.type = 'button';
      kachel.append(el('span', 'kat-kachel-icon', k.icon), el('span', null, k.name));
      kachel.onclick = () => {
        formKategorie = k.id;
        /* Bei Unterkunft ist der Zeitraum fast immer wichtig –
           deshalb klappt das Feld dann von selbst auf. */
        if (k.id === 'unterkunft') $('f-mehr').hidden = false;
        zeichneFormular();
        verteilHinweis();
      };
      kats.append(kachel);
    });

    /* Gruppen-Felder nur zeigen, wenn ihr mehr als einer seid */
    $('f-gruppe').hidden = zustand.personen.length < 2;

    const bezahlt = $('f-bezahlt');
    const vorher = bezahlt.value;
    bezahlt.textContent = '';
    zustand.personen.forEach(p => {
      const o = el('option', null, p.name);
      o.value = p.id;
      bezahlt.append(o);
    });
    bezahlt.value = zustand.personen.some(p => p.id === vorher) ? vorher : zustand.ichBinId;

    if (!formGeteilt.size) zustand.personen.forEach(p => formGeteilt.add(p.id));
    const geteilt = $('f-geteilt');
    geteilt.textContent = '';
    zustand.personen.forEach(p => {
      const c = el('button', 'chip' + (formGeteilt.has(p.id) ? ' aktiv' : ''), p.name);
      c.type = 'button';
      c.onclick = () => {
        if (formGeteilt.has(p.id)) formGeteilt.delete(p.id); else formGeteilt.add(p.id);
        if (!formGeteilt.size) formGeteilt.add(p.id);
        zeichneFormular();
      };
      geteilt.append(c);
    });

    $('f-waehrung').textContent = Waehrung.zeichen(formularWaehrung());
    if (!$('f-datum').value) $('f-datum').value = Store.heuteAlsText();
    umrechnungZeigen();
    $('f-mehr-schalter').hidden = !$('f-mehr').hidden;
  }

  /* Zeigt live, was der eingetippte Betrag in deiner eigenen
     Waehrung bedeutet. Ohne das tippt man 30.000 Dong und hat
     keine Vorstellung, ob das viel war. */
  function umrechnungZeigen() {
    const kasten = $('f-umrechnung');
    const code = formularWaehrung();
    const basis = zustand.reise.waehrung;
    const betrag = betragLesen($('f-betrag').value);

    if (code === basis || !betrag) { kasten.hidden = true; return; }

    const kurs = formBestand ? formBestand.kurs : Waehrung.kurs(basis, code);
    kasten.hidden = false;
    kasten.className = 'umrechnung';
    if (!kurs) {
      kasten.classList.add('unbekannt');
      kasten.textContent = 'Kein Kurs für ' + code + ' – oben auf den Ort tippen und eintragen';
      return;
    }
    kasten.textContent = '≈ ' + geld(betrag / kurs);
  }

  /* Zeigt live, wie sich eine Buchung auf die Tage verteilt. */
  function verteilHinweis() {
    const hinweis = $('f-verteil');
    const betrag = betragLesen($('f-betrag').value);
    const von = $('f-datum').value, bis = $('f-bis').value;

    if (!betrag || !von || !bis || bis <= von) { hinweis.hidden = true; return; }
    const anzahl = Budget.tageZwischen(von, bis);
    const code = formularWaehrung();
    hinweis.hidden = false;
    hinweis.textContent = geldIn(betrag, code) + ' verteilt auf ' + tage(anzahl) + ' = ' +
                          geldIn(betrag / anzahl, code) + ' pro Tag';
  }

  function formularLeeren() {
    formBestand = null;
    $('f-id').value = '';
    $('f-betrag').value = '';
    $('f-notiz').value = '';
    $('f-bis').value = '';
    $('f-datum').value = Store.heuteAlsText();
    $('f-mehr').hidden = true;
    formKategorie = 'essen';
    formGeteilt = new Set(zustand.personen.map(p => p.id));
    $('f-speichern').textContent = 'Eintragen';
    $('f-abbrechen').hidden = true;
    $('f-loeschen').hidden = true;
    zeichneFormular();
    verteilHinweis();
  }

  function formularFuellen(a) {
    formBestand = { waehrung: a.waehrung, kurs: a.kurs, ort: a.ort || '' };
    $('f-id').value = a.id;
    $('f-betrag').value = String(a.betrag).replace('.', ',');
    $('f-notiz').value = a.notiz || '';
    $('f-datum').value = a.datum;
    $('f-bis').value = a.bisDatum || '';
    $('f-mehr').hidden = false;
    formKategorie = a.kategorie;
    formGeteilt = new Set(a.geteiltMit);
    zeichneFormular();
    $('f-bezahlt').value = a.bezahltVon;
    $('f-speichern').textContent = 'Änderung speichern';
    $('f-abbrechen').hidden = false;
    $('f-loeschen').hidden = false;
    verteilHinweis();
    umrechnungZeigen();
    ansichtWechseln('heute');
    $('formular').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- Ausgabenliste ---------- */

  function zeichneAusgaben() {
    const liste = $('ausgaben-liste');
    liste.textContent = '';

    const alle = [...zustand.ausgaben].sort((a, b) =>
      a.datum === b.datum ? b.angelegt - a.angelegt : (a.datum < b.datum ? 1 : -1));

    $('ausgaben-anzahl').textContent = alle.length
      ? eintraege(alle.length) : 'Noch keine Ausgaben';

    if (!alle.length) {
      liste.append(el('div', 'leer', 'Trag deine erste Ausgabe auf dem Heute-Bildschirm ein.'));
      return;
    }

    let aktuellerTag = null;
    alle.forEach(a => {
      if (a.datum !== aktuellerTag) {
        aktuellerTag = a.datum;
        const tagSumme = zustand.ausgaben
          .filter(x => x.datum === a.datum)
          .reduce((s, x) => s + Budget.basis(x), 0);
        const kopf = el('div', 'tag-kopf');
        kopf.append(el('span', null, datumLesbar(a.datum)), el('span', null, geld(tagSumme)));
        liste.append(kopf);
      }

      const k = Store.kategorie(a.kategorie);
      const anzahlTage = Budget.tageEinerAusgabe(a).length;
      const posten = el('button', 'posten');
      posten.type = 'button';

      const text = el('div');
      text.append(el('div', 'posten-titel', a.notiz || k.name));

      const teile = [];
      if (a.notiz) teile.push(k.name);
      if (a.waehrung !== zustand.reise.waehrung) teile.push(geldIn(a.betrag, a.waehrung));
      if (a.ort) teile.push(a.ort);
      if (anzahlTage > 1) teile.push('über ' + tage(anzahlTage) + ' verteilt');
      if (zustand.personen.length > 1) {
        teile.push(a.geteiltMit.length > 1
          ? person(a.bezahltVon).name + ' zahlte · geteilt durch ' + a.geteiltMit.length
          : person(a.bezahltVon).name);
      }
      text.append(el('div', 'posten-sub', teile.join(' · ')));

      posten.append(el('div', 'posten-icon', k.icon), text,
                    el('div', 'posten-betrag', geld(Budget.basis(a))));
      posten.onclick = () => formularFuellen(a);
      liste.append(posten);
    });
  }

  /* ---------- Auswertung ---------- */

  function zeichneAuswertung(p) {
    zeichnePrognose(p);
    zeichneRuecklagenUebersicht();
    zeichneOrte();
    zeichneKategorien();
    zeichneReisekasse();
  }

  /* Was dich wo am Tag gekostet hat. Die Summe allein sagt wenig -
     ein Ort, an dem man dreimal so lange war, ist nicht dreimal so
     teuer. Deshalb steht der Tagesschnitt vorn und sortiert. */
  function zeichneOrte() {
    const zeilen = Budget.proOrt(zustand.ausgaben, zustand.ichBinId);
    const karte = $('karte-orte');
    /* Bei nur einem Ort ohne Namen gibt es nichts zu vergleichen. */
    const zeigen = zeilen.length > 1 || (zeilen.length === 1 && zeilen[0].ort !== '— ohne Ort —');
    karte.hidden = !zeigen;
    if (!zeigen) return;

    const liste = $('orte-liste');
    liste.textContent = '';
    const teuerster = zeilen[0].proTag || 1;

    zeilen.forEach(z => {
      const zeile = el('div', 'ort-zeile');
      zeile.append(el('span', 'ort-titel', z.ort),
                   el('span', 'ort-pro-tag', geld(z.proTag) + ' / Tag'));
      zeile.append(el('span', 'ort-sub',
        tage(z.tage) + ' · insgesamt ' + geld(z.betrag)));
      const schiene = el('div', 'ort-schiene');
      const fuell = el('i');
      fuell.style.width = (z.proTag / teuerster * 100) + '%';
      schiene.append(fuell);
      zeile.append(schiene);
      liste.append(zeile);
    });
  }

  /* Nur-Lese-Liste der Rücklagen. Geändert wird in den Einstellungen. */
  function zeichneRuecklagenUebersicht() {
    const karte = $('karte-ruecklagen');
    karte.hidden = !zustand.ruecklagen.length;
    if (karte.hidden) return;

    const liste = $('ruecklagen-liste');
    liste.textContent = '';
    zustand.ruecklagen.forEach(r => {
      const zeile = el('div', 'ruecklage nur-lesen');
      zeile.append(el('span', null, Store.kategorie(r.kategorie).icon));
      const text = el('div');
      text.append(el('div', 'r-name' + (r.bezahlt ? ' bezahlt' : ''), r.name));
      text.append(el('div', 'r-sub', r.bezahlt ? 'bezahlt' : 'noch offen'));
      zeile.append(text, el('div', 'posten-betrag', geld(r.betrag)));
      liste.append(zeile);
    });
  }

  function zeichnePrognose(p) {
    const wert = $('prognose-wert'), sub = $('prognose-sub');
    wert.className = 'prognose-wert';

    if (!p.eingerichtet) {
      wert.textContent = 'Noch nicht eingerichtet';
      sub.textContent = 'Trag unter Einstellungen deinen Zeitraum und dein Budget ein.';
    } else if (p.differenzTage === null) {
      wert.textContent = geld(p.tagesbudgetPlan) + ' pro Tag';
      sub.textContent = 'Dein Plan: ' + geld(p.gesamtbudget) + ' über ' + tage(p.gesamtTage) + '.';
    } else if (p.differenzTage >= 0) {
      wert.textContent = 'Dein Geld reicht';
      wert.classList.add('gut');
      sub.textContent = p.differenzTage > p.restTage
        ? 'Bei ' + geld(p.schnitt) + ' pro Tag reicht es weit über dein Reiseende am ' +
          datumKurz(p.ende) + ' hinaus.'
        : 'Bei ' + geld(p.schnitt) + ' pro Tag reicht es bis zum ' +
          datumKurz(p.prognoseEnde) + ' – dein Reiseende ist der ' + datumKurz(p.ende) + '.';
    } else {
      wert.textContent = 'Es wird knapp';
      wert.classList.add('schlecht');
      sub.textContent = 'Bei ' + geld(p.schnitt) + ' pro Tag ist das Geld am ' +
        datumKurz(p.prognoseEnde) + ' alle – ' + tage(Math.abs(p.differenzTage)) +
        ' vor deinem Reiseende am ' + datumKurz(p.ende) + '.';
    }

    const gitter = $('prognose-zahlen');
    gitter.textContent = '';
    if (!p.eingerichtet) return;

    const kacheln = [['Gesamtbudget', geld(p.gesamtbudget)]];
    if (p.ruecklagenSumme > 0) {
      kacheln.push(['Zurückgelegt', '− ' + geld(p.ruecklagenSumme)]);
      kacheln.push(['Fürs Tägliche', geld(p.alltagsbudget)]);
    }
    kacheln.push(['Schon ausgegeben', geld(p.gesamtAusgegeben)]);
    kacheln.push(['Übrig', geld(p.uebrig)]);
    kacheln.push(['Schnitt bisher', p.abgeschlosseneTage > 0 ? geld(p.schnitt) + ' / Tag' : '–']);

    kacheln.forEach(([label, text]) => {
      const feld = el('div', 'zahl');
      feld.append(el('div', 'zahl-label', label), el('div', 'zahl-wert', text));
      gitter.append(feld);
    });
  }

  function zeichneKategorien() {
    const behaelter = $('kategorie-liste');
    behaelter.textContent = '';
    const zeilen = Budget.proKategorie(zustand.ausgaben, zustand.ichBinId, zustand.ruecklagen);

    if (!zeilen.length) {
      behaelter.append(el('div', 'leer', 'Sobald du etwas einträgst, siehst du hier die Aufteilung.'));
      return;
    }

    const groesste = zeilen[0].betrag;
    zeilen.forEach(z => {
      const zeile = el('div', 'kat-zeile');
      zeile.append(
        el('span', null, z.kategorie.icon),
        el('span', 'kat-name', z.kategorie.name),
        el('span', 'kat-betrag', geld(z.betrag) + '  ·  ' + z.ganz + '%')
      );
      const schiene = el('div', 'kat-schiene');
      const fuell = el('i');
      fuell.style.width = (z.betrag / groesste * 100) + '%';
      schiene.append(fuell);
      zeile.append(schiene);
      behaelter.append(zeile);
    });
  }

  function zeichneReisekasse() {
    const karte = $('karte-reisekasse');
    karte.hidden = zustand.personen.length < 2;
    if (karte.hidden) return;

    const salden = $('salden-liste');
    salden.textContent = '';
    Budget.salden(zustand).forEach(s => {
      const zeile = el('div', 'saldo-zeile');
      const links = el('div');
      links.append(el('div', 'saldo-name', s.person.name));
      links.append(el('div', 'kachel-sub',
        'ausgelegt ' + geld(s.ausgelegt) + ' · Anteil ' + geld(s.eigenerAnteil)));
      links.append();
      zeile.append(links, el('div', 'saldo-wert ' + (s.saldo >= 0 ? 'plus' : 'minus'),
        (s.saldo >= 0 ? '+' : '−') + geld(Math.abs(s.saldo))));
      salden.append(zeile);
    });

    const ausgleich = $('ausgleich-liste');
    ausgleich.textContent = '';
    const zahlungen = Budget.ausgleich(zustand);
    if (!zahlungen.length) {
      ausgleich.append(el('div', 'leer', 'Alles ausgeglichen – niemand schuldet jemandem etwas.'));
      return;
    }
    zahlungen.forEach(z => {
      const zeile = el('div', 'ausgleich-zeile');
      zeile.append(el('span', null, z.von.name + '  →  ' + z.an.name), el('b', null, geld(z.betrag)));
      ausgleich.append(zeile);
    });
  }

  /* ---------- Einstellungen ---------- */

  function zeichneEinstellungen(p) {
    $('e-reise').value    = zustand.reise.name;
    $('e-start').value    = zustand.reise.start || '';
    $('e-ende').value     = zustand.reise.ende || '';
    $('e-gesamt').value   = zustand.reise.gesamtbudget
      ? String(zustand.reise.gesamtbudget).replace('.', ',') : '';
    waehrungsAuswahlFuellen($('e-waehrung'), zustand.reise.waehrung);
    zeichneKursStand();
    zeichneOrtVorschlaege();

    const dauer = Budget.tageZwischen(zustand.reise.start, zustand.reise.ende);
    $('e-dauer').value = dauer > 0 ? dauer : '';

    if (p.ruecklagenZuHoch) {
      $('e-ergebnis').textContent = 'Rücklagen zu hoch';
      $('e-ergebnis-sub').textContent = 'Deine Rücklagen von ' + geld(p.ruecklagenSumme) +
        ' verbrauchen dein ganzes Budget von ' + geld(p.gesamtbudget) +
        '. Für den Alltag bleibt nichts übrig.';
    } else if (p.eingerichtet) {
      $('e-ergebnis').textContent = geld(p.tagesbudgetPlan) + ' pro Tag';
      $('e-ergebnis-sub').textContent = (p.ruecklagenSumme > 0
        ? geld(p.gesamtbudget) + ' minus ' + geld(p.ruecklagenSumme) + ' Rücklagen = ' +
          geld(p.alltagsbudget) + ', geteilt durch '
        : geld(p.gesamtbudget) + ' geteilt durch ') +
        tage(p.gesamtTage) + '. Die App passt diese Zahl täglich an das an, ' +
        'was du wirklich ausgibst.';
    } else {
      $('e-ergebnis').textContent = '–';
      $('e-ergebnis-sub').textContent = 'Trag oben Zeitraum und Budget ein.';
    }

    zeichneRuecklagenFelder();

    const personen = $('e-personen');
    personen.textContent = '';
    zustand.personen.forEach(pp => {
      const tag = el('div', 'person-tag');
      tag.append(el('span', null, pp.name));
      if (zustand.personen.length > 1) {
        const x = el('button', null, '×');
        x.title = pp.name + ' entfernen';
        x.onclick = () => personEntfernen(pp.id);
        tag.append(x);
      }
      personen.append(tag);
    });

    $('e-version').textContent = 'Backpack Budget ' + APP_VERSION;

    $('e-ich-block').hidden = zustand.personen.length < 2;
    const ich = $('e-ich');
    ich.textContent = '';
    zustand.personen.forEach(pp => {
      const o = el('option', null, pp.name);
      o.value = pp.id;
      ich.append(o);
    });
    ich.value = zustand.ichBinId;
  }

  function zeichneRuecklagenFelder() {
    const liste = $('e-ruecklagen');
    liste.textContent = '';

    zustand.ruecklagen.forEach(r => {
      const zeile = el('div', 'ruecklage');

      /* Haken = bereits bezahlt. Aendert nichts am Tagesbudget –
         das Geld ist so oder so weg –, macht aber sichtbar, was
         noch bevorsteht, und zaehlt in die Kategorie-Auswertung. */
      const haken = document.createElement('input');
      haken.type = 'checkbox';
      haken.checked = r.bezahlt;
      haken.title = 'schon bezahlt';
      haken.onchange = () => { r.bezahlt = haken.checked; speichern(); };

      const text = el('div');
      text.append(el('div', 'r-name' + (r.bezahlt ? ' bezahlt' : ''), r.name));
      /* Ob bezahlt, sagen schon der Haken und der Durchstrich –
         das muss hier nicht nochmal stehen und umbrechen. */
      text.append(el('div', 'r-sub', Store.kategorie(r.kategorie).name));

      const betrag = document.createElement('input');
      betrag.type = 'text';
      betrag.className = 'r-betrag';
      betrag.inputMode = 'decimal';
      betrag.value = String(r.betrag).replace('.', ',');
      betrag.onchange = () => {
        r.betrag = betragLesen(betrag.value) || 0;
        speichern();
      };

      const weg = el('button', 'r-weg', '×');
      weg.type = 'button';
      weg.title = r.name + ' entfernen';
      weg.onclick = () => {
        if (!confirm('Rücklage „' + r.name + '" entfernen? Der Betrag steht dann wieder fürs Tagesbudget zur Verfügung.')) return;
        zustand.ruecklagen = zustand.ruecklagen.filter(x => x.id !== r.id);
        speichern();
      };

      zeile.append(haken, text, betrag, weg);
      liste.append(zeile);
    });

    const auswahl = $('e-r-kategorie');
    if (!auswahl.children.length) {
      Store.KATEGORIEN.forEach(k => {
        const o = el('option', null, k.icon + '  ' + k.name);
        o.value = k.id;
        auswahl.append(o);
      });
      auswahl.value = 'fortbewegung';
    }
  }

  function zeichneKursStand() {
    const kasten = $('e-kurs-stand');
    const v = Waehrung.vorrat();
    const alter = Waehrung.alterTage();
    kasten.className = 'sicherung-stand';

    if (!v || v.basis !== zustand.reise.waehrung) {
      kasten.textContent = 'Noch keine Kurse geholt.';
      return;
    }
    const anzahl = Object.keys(v.kurse || {}).length;
    if (alter === 0) {
      kasten.classList.add('ok');
      kasten.textContent = anzahl + ' Kurse, heute geholt.';
    } else {
      if (alter > 7) kasten.classList.add('fehler');
      kasten.textContent = anzahl + ' Kurse, ' + tage(alter) + ' alt.';
    }
  }

  function personEntfernen(id) {
    const betroffen = zustand.ausgaben.filter(
      a => a.bezahltVon === id || a.geteiltMit.includes(id)).length;
    const frage = betroffen
      ? person(id).name + ' entfernen? ' + betroffen +
        ' Ausgabe(n) werden dann neu aufgeteilt – die Abrechnung ändert sich.'
      : person(id).name + ' entfernen?';
    if (!confirm(frage)) return;

    zustand.personen = zustand.personen.filter(p => p.id !== id);
    zustand.ausgaben.forEach(a => {
      if (a.bezahltVon === id) a.bezahltVon = zustand.personen[0].id;
      a.geteiltMit = a.geteiltMit.filter(x => x !== id);
      if (!a.geteiltMit.length) a.geteiltMit = [zustand.personen[0].id];
    });
    if (zustand.ichBinId === id) zustand.ichBinId = zustand.personen[0].id;
    formGeteilt.delete(id);
    speichern();
  }

  /* ==========================================================
     Abgleich mit dem Server

     Grundregel: Die lokale Kopie ist immer die, mit der du
     arbeitest. Der Server ist das Netz darunter. Faellt er aus,
     merkst du beim Eintragen nichts.
     ========================================================== */

  let syncStatus = 'aus';       /* aus | laeuft | ok | fehler | wartet */
  let syncMeldung = '';
  let syncUhr = null;
  let syncLaeuft = false;

  function syncSetzen(status, meldung) {
    syncStatus = status;
    syncMeldung = meldung || '';
    zeichneSyncLeiste();
  }

  function zeichneSyncLeiste() {
    const leiste = $('sync-leiste');
    leiste.hidden = !Sync.eingerichtet();
    if (leiste.hidden) return;
    $('sync-punkt').className = 'sync-punkt ' +
      ({ laeuft: 'laeuft', ok: 'ok', fehler: 'fehler', wartet: 'fehler' }[syncStatus] || '');
    $('sync-text').textContent = syncMeldung || 'Abgleich eingerichtet';
  }

  /* Nach einer Aenderung nicht sofort losschicken, sondern kurz
     warten. Wer drei Ausgaben hintereinander eintraegt, loest sonst
     drei Uebertragungen aus. */
  function schickenSpaeter() {
    if (!Sync.eingerichtet()) return;
    clearTimeout(syncUhr);
    syncUhr = setTimeout(schickenJetzt, 1500);
  }

  async function schickenJetzt() {
    if (!Sync.eingerichtet() || syncLaeuft) return;
    syncLaeuft = true;
    syncSetzen('laeuft', 'Wird übertragen …');
    try {
      await Sync.schicken(zustand);
      Sync.konfigSichern({ letzterSync: zustand.stand, letzterErfolg: Date.now() });
      syncSetzen('ok', 'Gespeichert auf dem Server');
    } catch (e) {
      /* Kein Drama: lokal ist alles da, wir versuchen es beim
         naechsten Mal wieder. */
      syncSetzen('wartet', 'Nicht übertragen – ' + e.message);
    } finally {
      syncLaeuft = false;
    }
  }

  /* Der eigentliche Abgleich beim Start und auf Knopfdruck. */
  async function abgleichen(vomNutzer) {
    if (!Sync.eingerichtet() || syncLaeuft) return;
    syncLaeuft = true;
    syncSetzen('laeuft', 'Wird abgeglichen …');
    try {
      const antwort = await Sync.holen();
      const server = antwort.leer ? null : antwort.zustand;
      const letzter = Number(Sync.konfig().letzterSync) || 0;
      const lokal = Number(zustand.stand) || 0;
      const fremd = server ? (Number(server.stand) || 0) : -1;

      if (!server) {
        await Sync.schicken(zustand);
        Sync.konfigSichern({ letzterSync: lokal, letzterErfolg: Date.now() });
        syncSetzen('ok', 'Erstmalig auf den Server geschrieben');

      } else if (fremd === lokal) {
        Sync.konfigSichern({ letzterSync: lokal, letzterErfolg: Date.now() });
        syncSetzen('ok', 'Alles auf dem gleichen Stand');

      } else if (lokal > letzter && fremd > letzter) {
        /* Beide Seiten haben sich seit dem letzten Abgleich
           geaendert. Hier NICHT stillschweigend ueberschreiben –
           genau so verliert man Daten. */
        konfliktLoesen(server);

      } else if (fremd > lokal) {
        uebernehmen(server);
        syncSetzen('ok', 'Neueren Stand vom Server geholt');

      } else {
        await Sync.schicken(zustand);
        Sync.konfigSichern({ letzterSync: lokal, letzterErfolg: Date.now() });
        syncSetzen('ok', 'Server nachgezogen');
      }
    } catch (e) {
      syncSetzen('fehler', e.message);
      if (vomNutzer) melden(e.message);
    } finally {
      syncLaeuft = false;
      zeichneEinstellungenSync();
    }
  }

  function uebernehmen(server) {
    Store.sichern(server);
    zustand = Store.laden();
    Sync.konfigSichern({ letzterSync: zustand.stand, letzterErfolg: Date.now() });
    formGeteilt = new Set();
    formularLeeren();
    nurSichern();
  }

  function konfliktLoesen(server) {
    const wann = t => t ? new Date(t).toLocaleString('de-DE',
      { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'unbekannt';
    const frage =
      'Auf beiden Seiten wurde etwas geändert, seit zuletzt abgeglichen wurde.\n\n' +
      'Auf diesem Gerät: ' + eintraege((zustand.ausgaben || []).length) +
      ', zuletzt ' + wann(zustand.stand) + '\n' +
      'Auf dem Server:   ' + eintraege((server.ausgaben || []).length) +
      ', zuletzt ' + wann(server.stand) + '\n\n' +
      'OK = Server-Stand übernehmen (dieses Gerät wird überschrieben)\n' +
      'Abbrechen = dieses Gerät behalten (Server wird überschrieben)';

    if (confirm(frage)) {
      uebernehmen(server);
      syncSetzen('ok', 'Server-Stand übernommen');
      melden('Server-Stand übernommen');
    } else {
      zustand.stand = Date.now();
      Store.sichern(zustand);
      schickenJetzt();
      melden('Dieses Gerät behalten');
    }
  }

  function zeichneEinstellungenSync() {
    const k = Sync.konfig();
    const an = Sync.eingerichtet();
    $('e-sync-trennen').hidden = !an;
    $('e-sync-jetzt').disabled = !an;
    if (!$('e-sync-adresse').value) $('e-sync-adresse').value = k.adresse || '';

    const stand = $('e-sync-stand');
    stand.className = 'sync-stand';
    if (!an) {
      stand.textContent = 'Nicht verbunden – deine Daten liegen nur auf diesem Gerät.';
    } else if (syncStatus === 'fehler' || syncStatus === 'wartet') {
      stand.classList.add('fehler');
      stand.textContent = syncMeldung;
    } else if (k.letzterErfolg) {
      stand.classList.add('ok');
      stand.textContent = 'Zuletzt abgeglichen: ' + new Date(k.letzterErfolg)
        .toLocaleString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      stand.textContent = 'Verbunden, aber noch nie abgeglichen.';
    }
  }

  /* ==========================================================
     Klicks und Eingaben
     ========================================================== */

  function ansichtWechseln(name) {
    document.querySelectorAll('.view').forEach(v => { v.hidden = v.id !== 'view-' + name; });
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('aktiv', t.dataset.view === name);
    });
  }

  document.querySelectorAll('.tab').forEach(t => {
    t.onclick = () => { ansichtWechseln(t.dataset.view); window.scrollTo(0, 0); };
  });

  $('setup-knopf').onclick = () => { ansichtWechseln('einstellungen'); window.scrollTo(0, 0); };

  $('f-mehr-schalter').onclick = () => {
    $('f-mehr').hidden = false;
    $('f-mehr-schalter').hidden = true;
  };

  ['f-betrag', 'f-datum', 'f-bis'].forEach(id => {
    $(id).addEventListener('input', () => { verteilHinweis(); umrechnungZeigen(); });
    $(id).addEventListener('change', () => { verteilHinweis(); umrechnungZeigen(); });
  });

  /* Ausgabe speichern (neu oder geaendert) */
  $('formular').addEventListener('submit', e => {
    e.preventDefault();
    const betrag = betragLesen($('f-betrag').value);
    if (betrag === null || betrag <= 0) {
      melden('Bitte einen Betrag größer als 0 eintragen');
      $('f-betrag').focus();
      return;
    }

    const von = $('f-datum').value || Store.heuteAlsText();
    let bis = $('f-bis').value || '';
    if (bis && bis <= von) bis = '';

    const id = $('f-id').value;
    const basis = zustand.reise.waehrung;
    const code = formularWaehrung();
    const kurs = formBestand ? formBestand.kurs
               : (code === basis ? 1 : Waehrung.kurs(basis, code));

    if (!kurs) {
      melden('Kein Kurs für ' + code + ' – oben auf den Ort tippen');
      return;
    }

    const daten = {
      betrag,
      waehrung: code,
      /* Der Kurs wird MITGESCHRIEBEN, nicht spaeter nachgeschlagen:
         was diese Ausgabe heute gekostet hat, soll sie in einem
         halben Jahr immer noch gekostet haben. */
      kurs: kurs,
      ort: formBestand ? formBestand.ort : (zustand.aktuell.ort || '').trim(),
      kategorie: formKategorie,
      datum: von,
      bisDatum: bis,
      notiz: $('f-notiz').value.trim(),
      bezahltVon: $('f-bezahlt').value || zustand.ichBinId,
      geteiltMit: [...formGeteilt]
    };

    if (id) {
      Object.assign(zustand.ausgaben.find(a => a.id === id), daten);
      melden('Änderung gespeichert');
    } else {
      zustand.ausgaben.push(Object.assign({ id: Store.neueId(), angelegt: Date.now() }, daten));
      melden(bis
        ? geldIn(betrag, code) + ' auf ' + tage(Budget.tageZwischen(von, bis)) + ' verteilt'
        : geldIn(betrag, code) + ' eingetragen');
    }
    formularLeeren();
    speichern();
  });

  $('f-abbrechen').onclick = formularLeeren;

  $('f-loeschen').onclick = () => {
    const id = $('f-id').value;
    if (!id || !confirm('Diese Ausgabe wirklich löschen?')) return;
    zustand.ausgaben = zustand.ausgaben.filter(a => a.id !== id);
    formularLeeren();
    speichern();
    melden('Ausgabe gelöscht');
  };

  /* --- Einstellungen: jede Änderung wird sofort übernommen --- */

  $('e-reise').oninput = () => {
    zustand.reise.name = $('e-reise').value;
    Store.sichern(zustand);
    $('kopf-reise').textContent = zustand.reise.name || 'Meine Reise';
  };

  /* Start, Ende und Dauer haengen zusammen. Aenderst du eines,
     wird das jeweils passende andere neu berechnet. */
  $('e-start').onchange = () => {
    const neu = $('e-start').value;
    const dauer = parseInt($('e-dauer').value, 10);
    zustand.reise.start = neu;
    if (neu && dauer > 0) zustand.reise.ende = Budget.tagVerschieben(neu, dauer - 1);
    speichern();
  };

  $('e-ende').onchange = () => {
    zustand.reise.ende = $('e-ende').value;
    speichern();
  };

  $('e-dauer').onchange = () => {
    const dauer = parseInt($('e-dauer').value, 10);
    if (dauer > 0 && zustand.reise.start) {
      zustand.reise.ende = Budget.tagVerschieben(zustand.reise.start, dauer - 1);
    }
    speichern();
  };

  $('e-gesamt').onchange = () => {
    zustand.reise.gesamtbudget = betragLesen($('e-gesamt').value) || 0;
    speichern();
  };

  $('e-waehrung').onchange = async () => {
    const neu = $('e-waehrung').value;
    const alt = zustand.reise.waehrung;
    if (neu === alt) return;
    if (zustand.ausgaben.length && !confirm(
        'Basiswährung von ' + alt + ' auf ' + neu + ' umstellen?\n\n' +
        'Bereits eingetragene Ausgaben behalten ihre gespeicherten Kurse und werden ' +
        'dadurch falsch umgerechnet. Sinnvoll nur, solange die Reise noch nicht läuft.')) {
      $('e-waehrung').value = alt;
      return;
    }
    zustand.reise.waehrung = neu;
    if (zustand.aktuell.waehrung === alt) zustand.aktuell.waehrung = neu;
    speichern();
    try { await Waehrung.holen(neu); zeichneKursStand(); zeichnen(); } catch (e) {}
  };

  $('e-ich').onchange = () => { zustand.ichBinId = $('e-ich').value; speichern(); };

  $('e-sync-verbinden').onclick = async () => {
    const adresse = Sync.adresseAufraeumen($('e-sync-adresse').value);
    const schluessel = $('e-sync-schluessel').value.trim();
    if (!adresse || !schluessel) { melden('Adresse und Schlüssel eintragen'); return; }

    syncSetzen('laeuft', 'Verbindung wird geprüft …');
    try {
      /* Erst schauen, ob da ueberhaupt ein Server ist – das trennt
         einen Tippfehler in der Adresse von einem falschen
         Schluessel und macht die Fehlermeldung brauchbar. */
      await Sync.erreichbar(adresse);
      Sync.konfigSichern({ adresse, schluessel, letzterSync: 0 });
      $('e-sync-schluessel').value = '';
      await abgleichen(true);
      if (syncStatus === 'ok') melden('Verbunden');
    } catch (e) {
      Sync.konfigLoeschen();
      syncSetzen('fehler', e.message);
      melden(e.message);
    }
    zeichneEinstellungenSync();
    zeichneSyncLeiste();
  };

  $('e-sync-jetzt').onclick = () => abgleichen(true);

  $('e-sync-trennen').onclick = () => {
    if (!confirm('Verbindung trennen? Deine Daten bleiben auf diesem Gerät und auf dem Server, werden aber nicht mehr abgeglichen.')) return;
    Sync.konfigLoeschen();
    syncSetzen('aus', '');
    zeichneEinstellungenSync();
    zeichneSyncLeiste();
    melden('Verbindung getrennt');
  };

  $('ortsleiste').onclick = ortDialogOeffnen;
  $('ort-abbrechen').onclick = ortDialogSchliessen;
  $('ort-uebernehmen').onclick = ortUebernehmen;
  $('ort-waehrung-wahl').onchange = ortKursZeigen;
  $('ort-overlay').addEventListener('click', e => {
    if (e.target === $('ort-overlay')) ortDialogSchliessen();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('ort-overlay').hidden) ortDialogSchliessen();
  });

  $('e-kurse-holen').onclick = async () => {
    melden('Kurse werden geholt …');
    try {
      await Waehrung.holen(zustand.reise.waehrung);
      zeichneKursStand();
      umrechnungZeigen();
      melden('Kurse aktualisiert');
    } catch (e) {
      melden(e.message);
    }
  };

  /* Ort für einen Zeitraum nachtragen - damit bekommen auch die
     Eintraege ihre Stadt, die vor dieser Funktion entstanden sind. */
  $('e-nach-uebernehmen').onclick = () => {
    const von = $('e-nach-von').value;
    const bis = $('e-nach-bis').value;
    const ort = $('e-nach-ort').value.trim();
    const stand = $('e-nach-stand');

    if (!von || !bis || bis < von) { melden('Bitte einen gültigen Zeitraum wählen'); return; }
    if (!ort) { melden('Bitte einen Ort eintragen'); $('e-nach-ort').focus(); return; }

    const betroffen = zustand.ausgaben.filter(a => a.datum >= von && a.datum <= bis);
    stand.hidden = false;
    stand.className = 'sicherung-stand';

    if (!betroffen.length) {
      stand.textContent = 'In diesem Zeitraum liegt kein Eintrag.';
      return;
    }

    /* Nachtragen fuellt Luecken - es ueberschreibt nicht.

       Wer einen alten Zeitraum nachtraegt, trifft sonst leicht
       einen neueren Eintrag mit richtigem Ort und macht ihn
       kaputt. Bereits gesetzte Orte bleiben deshalb stehen, und
       nur wenn ueberhaupt keine Luecke da ist, wird gefragt. */
    const offen = betroffen.filter(a => !a.ort);
    const gesetzt = betroffen.length - offen.length;

    if (!offen.length) {
      const andere = betroffen.filter(a => a.ort !== ort).length;
      if (!andere) {
        stand.textContent = 'Alle ' + eintraege(betroffen.length) + ' stehen schon auf „' + ort + '".';
        return;
      }
      if (!confirm('Alle ' + eintraege(betroffen.length) + ' in diesem Zeitraum haben schon einen Ort.\n\n'
                 + 'Sollen sie auf „' + ort + '" geändert werden?')) return;
      betroffen.forEach(a => { a.ort = ort; });
      speichern();
      stand.className = 'sicherung-stand ok';
      stand.textContent = eintraege(betroffen.length) + ' auf „' + ort + '" geändert.';
      melden(eintraege(betroffen.length) + ' geändert');
      return;
    }

    offen.forEach(a => { a.ort = ort; });
    speichern();
    stand.className = 'sicherung-stand ok';
    stand.textContent = eintraege(offen.length) + ' auf „' + ort + '" gesetzt.' +
      (gesetzt ? ' ' + gesetzt + ' hatten schon einen Ort und blieben unverändert.' : '');
    melden(eintraege(offen.length) + ' nachgetragen');
  };

  $('e-r-hinzu').onclick = () => {
    const name = $('e-r-name').value.trim();
    const betrag = betragLesen($('e-r-betrag').value);
    if (!name) { melden('Gib der Rücklage einen Namen'); $('e-r-name').focus(); return; }
    if (!betrag || betrag <= 0) { melden('Bitte einen Betrag eintragen'); $('e-r-betrag').focus(); return; }

    zustand.ruecklagen.push({
      id: Store.neueId(), name, betrag,
      kategorie: $('e-r-kategorie').value, bezahlt: false
    });
    $('e-r-name').value = '';
    $('e-r-betrag').value = '';
    speichern();
    melden(geld(betrag) + ' für „' + name + '" zurückgelegt');
  };
  $('e-r-betrag').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); $('e-r-hinzu').click(); }
  });

  $('e-person-hinzu').onclick = () => {
    const name = $('e-neue-person').value.trim();
    if (!name) return;
    const neu = { id: Store.neueId(), name };
    zustand.personen.push(neu);
    formGeteilt.add(neu.id);
    $('e-neue-person').value = '';
    speichern();
    melden(name + ' ist dabei');
  };
  $('e-neue-person').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); $('e-person-hinzu').click(); }
  });

  /* --- Sicherung --- */

  /* Sicherung herausgeben.

     Am Handy geht das ueber das System-Teilen-Menue: von dort kannst
     du die Datei nach iCloud oder Google Drive legen, sie dir selbst
     per Mail schicken oder in einen Chat werfen. Ein reiner Download
     ist am Handy oft eine Sackgasse, weil die Datei irgendwo im
     Dateien-Ordner verschwindet.

     Kann der Browser das nicht (typisch am Laptop), faellt die
     Funktion auf einen normalen Download zurueck. */
  async function sicherungHolen() {
    const inhalt = JSON.stringify(zustand, null, 2);
    const name = 'backpack-budget-' + Store.heuteAlsText() + '.json';
    let erledigt = false;

    /* iOS laesst laengst nicht jeden Dateityp durchs Teilen-Menue.
       "application/json" wird abgelehnt, "text/plain" akzeptiert -
       am Inhalt aendert das nichts, die Endung bleibt .json und die
       Datei laesst sich spaeter genauso wieder einlesen. Deshalb der
       Reihe nach probieren, statt beim ersten Nein aufzugeben. */
    for (const typ of ['application/json', 'text/plain']) {
      try {
        const datei = new File([inhalt], name, { type: typ });
        if (navigator.canShare && navigator.canShare({ files: [datei] })) {
          await navigator.share({ files: [datei], title: 'Backpack Budget – Sicherung' });
          erledigt = true;
          break;
        }
      } catch (e) {
        /* Weggewischt statt gespeichert: dann gilt die Sicherung
           bewusst NICHT als erledigt - sonst wiegt die App in
           falscher Sicherheit. */
        if (e && e.name === 'AbortError') return;
      }
    }

    if (!erledigt) {
      const blob = new Blob([inhalt], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 30000);

      /* Am Handy oeffnet Safari die Datei bloss zur Ansicht, statt
         sie abzulegen. Ohne Erklaerung steht man dann vor einer Wand
         aus geschweiften Klammern und weiss nicht weiter. */
      if (navigator.share) {
        alert('Deine Sicherung wurde erstellt, aber dein Browser konnte das '
            + 'Teilen-Menü nicht öffnen.\n\nDie Datei ist jetzt zu sehen. '
            + 'Tippe auf das Teilen-Symbol und wähle „In Dateien sichern" '
            + 'oder schick sie dir selbst zu.');
      }
    }

    zustand.letzteSicherung = Date.now();
    speichern();
    melden(erledigt ? 'Sicherung gespeichert' : 'Sicherung erstellt');
  }

  $('e-export').onclick = sicherungHolen;
  $('sicherung-knopf').onclick = sicherungHolen;

  $('e-import').onclick = () => $('e-datei').click();
  $('e-datei').onchange = e => {
    const datei = e.target.files[0];
    if (!datei) return;
    const leser = new FileReader();
    leser.onload = () => {
      try {
        const daten = JSON.parse(leser.result);
        if (!daten || !Array.isArray(daten.ausgaben)) throw new Error('Format passt nicht');
        if (!confirm('Sicherung laden? Deine aktuellen Daten werden dabei ersetzt.')) return;
        /* Erst wegschreiben, dann normal laden – so laeuft die
           Sicherung durch dieselbe Pruefung wie alle anderen Daten. */
        Store.sichern(daten);
        zustand = Store.laden();
        /* Die geladene Datei ist selbst die Sicherung – der Stand
           gilt ab jetzt als gesichert. */
        zustand.letzteSicherung = Date.now();
        Store.sichern(zustand);
        formGeteilt = new Set();
        formularLeeren();
        zeichnen();
        melden('Sicherung geladen');
      } catch (err) {
        melden('Datei konnte nicht gelesen werden');
      } finally {
        e.target.value = '';
      }
    };
    leser.readAsText(datei);
  };

  $('e-reset').onclick = () => {
    if (!confirm('Wirklich ALLE Ausgaben und Einstellungen löschen? Das lässt sich nicht rückgängig machen.')) return;
    zustand = Store.startZustand();
    formGeteilt = new Set();
    Store.sichern(zustand);
    formularLeeren();
    zeichnen();
    melden('Alles zurückgesetzt');
  };

  /* ---------- Start ---------- */

  formularLeeren();
  zeichnen();
  zeichneSyncLeiste();
  zeichneEinstellungenSync();

  if (Sync.eingerichtet()) abgleichen(false);

  /* Einmal taeglich genug - der Dienst aktualisiert selbst nur so
     oft. Scheitert still, dann gelten die zuletzt bekannten Kurse. */
  Waehrung.beiGelegenheitHolen(zustand.reise.waehrung).then(geholt => {
    if (geholt) { zeichneKursStand(); umrechnungZeigen(); }
  });

  /* Kommt das Netz zurueck, das Liegengebliebene nachreichen. */
  window.addEventListener('online', () => {
    if (Sync.eingerichtet() && syncStatus !== 'ok') abgleichen(false);
  });

  /* Fuers Handy: macht die App offline-faehig, sobald sie ueber
     einen Server laeuft. Beim direkten Oeffnen der Datei wird das
     uebersprungen – die App funktioniert dann trotzdem. */
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

})();
