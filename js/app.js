/* ==========================================================
   app.js – Die Oberflaeche.

   Hier wird nichts gerechnet und nichts gespeichert. Diese Datei
   holt die Daten (Store), laesst rechnen (Budget) und schreibt das
   Ergebnis auf den Bildschirm. Umgekehrt nimmt sie Klicks und
   Eingaben entgegen und gibt sie weiter.
   ========================================================== */

(function () {

  let zustand = Store.laden();

  /* Merker fuer das Eingabefeld */
  let formKategorie = 'essen';
  let formGeteilt = new Set();

  const $ = id => document.getElementById(id);
  const el = (tag, klasse, text) => {
    const n = document.createElement(tag);
    if (klasse) n.className = klasse;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  /* ---------- Zahlen und Datum lesbar machen ---------- */

  function geld(betrag) {
    const zahl = new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(betrag || 0);
    return zahl + ' ' + zustand.reise.waehrung;
  }

  /* Nimmt "12,50", "12.50" oder " 12,50 € " und macht 12.5 daraus. */
  function betragLesen(text) {
    const sauber = String(text).replace(/[^0-9,.-]/g, '').replace(',', '.');
    const zahl = parseFloat(sauber);
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

  function person(id) {
    return zustand.personen.find(p => p.id === id) || { id, name: '?' };
  }

  function speichern() {
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
     Zeichnen
     ========================================================== */

  function zeichnen() {
    const p = Budget.plan(zustand);
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

  function zeichneHeute(p) {
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
      text.append(el('div', 'posten-sub', anzahlTage > 1
        ? 'Anteil von ' + geld(a.betrag) + ' über ' + tage(anzahlTage)
        : k.name));

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

    $('f-waehrung').textContent = zustand.reise.waehrung;
    if (!$('f-datum').value) $('f-datum').value = Store.heuteAlsText();
    $('f-mehr-schalter').hidden = !$('f-mehr').hidden;
  }

  /* Zeigt live, wie sich eine Buchung auf die Tage verteilt. */
  function verteilHinweis() {
    const hinweis = $('f-verteil');
    const betrag = betragLesen($('f-betrag').value);
    const von = $('f-datum').value, bis = $('f-bis').value;

    if (!betrag || !von || !bis || bis <= von) { hinweis.hidden = true; return; }
    const anzahl = Budget.tageZwischen(von, bis);
    hinweis.hidden = false;
    hinweis.textContent = geld(betrag) + ' verteilt auf ' + tage(anzahl) + ' = ' +
                          geld(betrag / anzahl) + ' pro Tag';
  }

  function formularLeeren() {
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
      ? alle.length + (alle.length === 1 ? ' Eintrag' : ' Einträge')
      : 'Noch keine Ausgaben';

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
          .reduce((s, x) => s + x.betrag, 0);
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
      if (anzahlTage > 1) teile.push('über ' + tage(anzahlTage) + ' verteilt');
      if (zustand.personen.length > 1) {
        teile.push(a.geteiltMit.length > 1
          ? person(a.bezahltVon).name + ' zahlte · geteilt durch ' + a.geteiltMit.length
          : person(a.bezahltVon).name);
      }
      text.append(el('div', 'posten-sub', teile.join(' · ')));

      posten.append(el('div', 'posten-icon', k.icon), text,
                    el('div', 'posten-betrag', geld(a.betrag)));
      posten.onclick = () => formularFuellen(a);
      liste.append(posten);
    });
  }

  /* ---------- Auswertung ---------- */

  function zeichneAuswertung(p) {
    zeichnePrognose(p);
    zeichneRuecklagenUebersicht();
    zeichneKategorien();
    zeichneReisekasse();
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
    $('e-waehrung').value = zustand.reise.waehrung;

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
    $(id).addEventListener('input', verteilHinweis);
    $(id).addEventListener('change', verteilHinweis);
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
    const daten = {
      betrag,
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
        ? geld(betrag) + ' auf ' + tage(Budget.tageZwischen(von, bis)) + ' verteilt'
        : geld(betrag) + ' eingetragen');
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

  $('e-waehrung').onchange = () => {
    zustand.reise.waehrung = $('e-waehrung').value.trim() || '€';
    speichern();
  };

  $('e-ich').onchange = () => { zustand.ichBinId = $('e-ich').value; speichern(); };

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

  $('e-export').onclick = () => {
    const blob = new Blob([JSON.stringify(zustand, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'backpack-budget-' + Store.heuteAlsText() + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    melden('Sicherung gespeichert');
  };

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

  /* Fuers Handy: macht die App offline-faehig, sobald sie ueber
     einen Server laeuft. Beim direkten Oeffnen der Datei wird das
     uebersprungen – die App funktioniert dann trotzdem. */
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

})();
