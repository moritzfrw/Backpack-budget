/* ==========================================================
   app.js – Die Oberflaeche.

   Hier wird nichts gerechnet und nichts gespeichert. Diese Datei
   holt die Daten (Store), laesst rechnen (Budget) und schreibt das
   Ergebnis auf den Bildschirm. Umgekehrt nimmt sie Klicks und
   Eingaben entgegen und gibt sie weiter.
   ========================================================== */

(function () {

  let zustand = Store.laden();

  /* Merker fuer das Formular: welche Kategorie ist gewaehlt,
     mit wem wird geteilt, bearbeite ich gerade etwas Bestehendes. */
  let formKategorie = 'essen';
  let formGeteilt = new Set();

  const $  = id => document.getElementById(id);
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
    const [j, m, t] = datumText.split('-').map(Number);
    return new Date(j, m - 1, t).toLocaleDateString('de-DE', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  }

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
    melden._uhr = setTimeout(() => { t.hidden = true; }, 2200);
  }

  /* ==========================================================
     Zeichnen
     ========================================================== */

  function zeichnen() {
    zeichneKopf();
    zeichneUebersicht();
    zeichneFormular();
    zeichneAusgaben();
    zeichneAbrechnung();
    zeichneEinstellungen();
  }

  function zeichneKopf() {
    $('kopf-reise').textContent = zustand.reise.name || 'Meine Reise';
    const budget = Number(zustand.reise.tagesbudget) || 0;
    $('kopf-person').textContent =
      person(zustand.ichBinId).name +
      (budget ? ' · ' + geld(budget) + ' pro Tag' : '');
  }

  /* ---------- Übersicht ---------- */

  function zeichneUebersicht() {
    const ich = zustand.ichBinId;
    const heute = Store.heuteAlsText();
    const budget = Number(zustand.reise.tagesbudget) || 0;

    const heuteSumme = Budget.summeAnteil(zustand.ausgaben, ich, Budget.amTag(heute));
    $('heute-betrag').textContent = geld(heuteSumme);

    const balken = $('heute-balken');
    const fuss = $('heute-fuss');
    balken.className = 'balken-fuell';
    fuss.className = 'heute-fuss';

    if (budget > 0) {
      const anteilProzent = Math.min(100, (heuteSumme / budget) * 100);
      balken.style.width = anteilProzent + '%';
      if (heuteSumme > budget) {
        balken.classList.add('drueber');
        fuss.classList.add('drueber');
        fuss.textContent = geld(heuteSumme - budget) + ' über deinem Tagesbudget';
      } else {
        if (heuteSumme / budget > 0.8) balken.classList.add('warnung');
        fuss.textContent = 'Noch ' + geld(budget - heuteSumme) + ' von ' + geld(budget);
      }
    } else {
      balken.style.width = '0%';
      fuss.textContent = 'Kein Tagesbudget gesetzt – trag es in den Einstellungen ein';
    }

    /* Woche */
    const wocheSumme = Budget.summeAnteil(zustand.ausgaben, ich, Budget.letzteTage(7));
    $('woche-betrag').textContent = geld(wocheSumme);
    $('woche-sub').textContent = 'Ø ' + geld(wocheSumme / 7) + ' pro Tag';

    /* Gesamt */
    const r = Budget.reichweite(zustand);
    $('gesamt-betrag').textContent = geld(r.ausgegeben);
    $('gesamt-sub').textContent = 'über ' + r.bisherigeTage +
      (r.bisherigeTage === 1 ? ' Tag' : ' Tage');

    zeichneReichweite(r);
    zeichneKategorien();
  }

  function zeichneReichweite(r) {
    const wert = $('reichweite-wert');
    const sub  = $('reichweite-sub');

    if (r.restTage !== undefined) {
      if (r.restTage === 0) {
        wert.textContent = 'Letzter Reisetag';
        sub.textContent = r.restBudget >= 0
          ? 'Du liegst ' + geld(r.restBudget) + ' unter Plan.'
          : 'Du liegst ' + geld(-r.restBudget) + ' über Plan.';
      } else {
        wert.textContent = geld(r.proRestTag) + ' pro Tag';
        sub.textContent = 'für die restlichen ' + r.restTage + ' Tage. ' +
          (r.proRestTag < r.schnitt
            ? 'Weniger als dein bisheriger Schnitt von ' + geld(r.schnitt) + '.'
            : 'Mehr als dein bisheriger Schnitt von ' + geld(r.schnitt) + '.');
      }
    } else if (r.abweichung !== undefined) {
      wert.textContent = geld(r.schnitt) + ' pro Tag';
      sub.textContent = r.abweichung > 0
        ? geld(r.abweichung) + ' pro Tag über deinem Budget. Setz ein Enddatum für eine echte Prognose.'
        : geld(-r.abweichung) + ' pro Tag unter deinem Budget.';
    } else {
      wert.textContent = geld(r.schnitt) + ' pro Tag';
      sub.textContent = zustand.ausgaben.length
        ? 'Dein bisheriger Schnitt.'
        : 'Noch nichts eingetragen. Setz ein Enddatum in den Einstellungen für eine Prognose.';
    }
  }

  function zeichneKategorien() {
    const behaelter = $('kategorie-liste');
    behaelter.textContent = '';
    const zeilen = Budget.proKategorie(zustand.ausgaben, zustand.ichBinId);

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
        el('span', 'kat-betrag', geld(z.betrag))
      );
      const schiene = el('div', 'kat-schiene');
      const fuell = el('i');
      fuell.style.width = (z.betrag / groesste * 100) + '%';
      schiene.append(fuell);
      zeile.append(schiene);
      behaelter.append(zeile);
    });
  }

  /* ---------- Formular ---------- */

  function zeichneFormular() {
    /* Kategorie-Chips */
    const kats = $('f-kategorien');
    kats.textContent = '';
    Store.KATEGORIEN.forEach(k => {
      const c = el('button', 'chip' + (k.id === formKategorie ? ' aktiv' : ''),
                   k.icon + ' ' + k.name);
      c.type = 'button';
      c.onclick = () => { formKategorie = k.id; zeichneFormular(); };
      kats.append(c);
    });

    /* "Bezahlt von" */
    const bezahlt = $('f-bezahlt');
    const vorher = bezahlt.value;
    bezahlt.textContent = '';
    zustand.personen.forEach(p => {
      const o = el('option', null, p.name);
      o.value = p.id;
      bezahlt.append(o);
    });
    bezahlt.value = zustand.personen.some(p => p.id === vorher) ? vorher : zustand.ichBinId;

    /* "Geteilt mit" – standardmaessig alle */
    if (!formGeteilt.size) zustand.personen.forEach(p => formGeteilt.add(p.id));
    const geteilt = $('f-geteilt');
    geteilt.textContent = '';
    zustand.personen.forEach(p => {
      const c = el('button', 'chip' + (formGeteilt.has(p.id) ? ' aktiv' : ''), p.name);
      c.type = 'button';
      c.onclick = () => {
        if (formGeteilt.has(p.id)) formGeteilt.delete(p.id); else formGeteilt.add(p.id);
        if (!formGeteilt.size) formGeteilt.add(p.id);  /* mindestens einer */
        zeichneFormular();
      };
      geteilt.append(c);
    });

    $('f-waehrung').textContent = zustand.reise.waehrung;
    if (!$('f-datum').value) $('f-datum').value = Store.heuteAlsText();
  }

  function formularLeeren() {
    $('f-id').value = '';
    $('f-betrag').value = '';
    $('f-notiz').value = '';
    $('f-datum').value = Store.heuteAlsText();
    formKategorie = 'essen';
    formGeteilt = new Set(zustand.personen.map(p => p.id));
    $('f-bezahlt').value = zustand.ichBinId;
    $('f-speichern').textContent = 'Ausgabe eintragen';
    $('f-abbrechen').hidden = true;
    $('f-loeschen').hidden = true;
    zeichneFormular();
  }

  function formularFuellen(a) {
    $('f-id').value = a.id;
    $('f-betrag').value = String(a.betrag).replace('.', ',');
    $('f-notiz').value = a.notiz || '';
    $('f-datum').value = a.datum;
    formKategorie = a.kategorie;
    formGeteilt = new Set(a.geteiltMit);
    zeichneFormular();
    $('f-bezahlt').value = a.bezahltVon;
    $('f-speichern').textContent = 'Änderung speichern';
    $('f-abbrechen').hidden = false;
    $('f-loeschen').hidden = false;
    ansichtWechseln('ausgaben');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      liste.append(el('div', 'leer', 'Trag oben deine erste Ausgabe ein.'));
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
        kopf.append(el('span', null, datumLesbar(a.datum)),
                    el('span', null, geld(tagSumme)));
        liste.append(kopf);
      }

      const k = Store.kategorie(a.kategorie);
      const posten = el('button', 'posten');
      posten.type = 'button';

      const text = el('div');
      text.append(el('div', 'posten-titel', a.notiz || k.name));

      const wer = a.geteiltMit.length > 1
        ? person(a.bezahltVon).name + ' zahlte · geteilt durch ' + a.geteiltMit.length
        : person(a.bezahltVon).name;
      text.append(el('div', 'posten-sub', (a.notiz ? k.name + ' · ' : '') + wer));

      posten.append(el('div', 'posten-icon', k.icon), text,
                    el('div', 'posten-betrag', geld(a.betrag)));
      posten.onclick = () => formularFuellen(a);
      liste.append(posten);
    });
  }

  /* ---------- Abrechnung ---------- */

  function zeichneAbrechnung() {
    const salden = $('salden-liste');
    salden.textContent = '';

    if (zustand.personen.length < 2) {
      salden.append(el('div', 'leer',
        'Du reist gerade allein. Trag in den Einstellungen Mitreisende ein, dann rechnet die App hier automatisch ab.'));
      $('ausgleich-liste').textContent = '';
      $('ausgleich-liste').append(el('div', 'leer', '–'));
      return;
    }

    Budget.salden(zustand).forEach(s => {
      const zeile = el('div', 'saldo-zeile');
      const links = el('div');
      links.append(el('div', 'saldo-name', s.person.name));
      links.append(el('div', 'kachel-sub',
        'ausgelegt ' + geld(s.ausgelegt) + ' · Anteil ' + geld(s.eigenerAnteil)));

      const wert = el('div', 'saldo-wert ' + (s.saldo >= 0 ? 'plus' : 'minus'),
        (s.saldo >= 0 ? '+' : '−') + geld(Math.abs(s.saldo)));

      zeile.append(links, wert);
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
      zeile.append(el('span', null, z.von.name + '  →  ' + z.an.name));
      const b = el('b', null, geld(z.betrag));
      zeile.append(b);
      ausgleich.append(zeile);
    });
  }

  /* ---------- Einstellungen ---------- */

  function zeichneEinstellungen() {
    $('e-reise').value    = zustand.reise.name;
    $('e-start').value    = zustand.reise.start || '';
    $('e-ende').value     = zustand.reise.ende || '';
    $('e-budget').value   = String(zustand.reise.tagesbudget || '').replace('.', ',');
    $('e-waehrung').value = zustand.reise.waehrung;

    const personen = $('e-personen');
    personen.textContent = '';
    zustand.personen.forEach(p => {
      const tag = el('div', 'person-tag');
      tag.append(el('span', null, p.name));
      if (zustand.personen.length > 1) {
        const x = el('button', null, '×');
        x.title = p.name + ' entfernen';
        x.onclick = () => personEntfernen(p.id);
        tag.append(x);
      }
      personen.append(tag);
    });

    const ich = $('e-ich');
    ich.textContent = '';
    zustand.personen.forEach(p => {
      const o = el('option', null, p.name);
      o.value = p.id;
      ich.append(o);
    });
    ich.value = zustand.ichBinId;
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
    document.querySelectorAll('.view').forEach(v => {
      v.hidden = v.id !== 'view-' + name;
    });
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('aktiv', t.dataset.view === name);
    });
  }

  document.querySelectorAll('.tab').forEach(t => {
    t.onclick = () => { ansichtWechseln(t.dataset.view); window.scrollTo(0, 0); };
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

    const id = $('f-id').value;
    const daten = {
      betrag,
      kategorie: formKategorie,
      datum: $('f-datum').value || Store.heuteAlsText(),
      notiz: $('f-notiz').value.trim(),
      bezahltVon: $('f-bezahlt').value,
      geteiltMit: [...formGeteilt]
    };

    if (id) {
      const vorhanden = zustand.ausgaben.find(a => a.id === id);
      Object.assign(vorhanden, daten);
      melden('Änderung gespeichert');
    } else {
      zustand.ausgaben.push(Object.assign({
        id: Store.neueId(), angelegt: Date.now()
      }, daten));
      melden(geld(betrag) + ' eingetragen');
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

  /* Einstellungen – jede Änderung wird sofort übernommen */
  $('e-reise').oninput    = () => { zustand.reise.name = $('e-reise').value; Store.sichern(zustand); zeichneKopf(); };
  $('e-start').onchange   = () => { zustand.reise.start = $('e-start').value; speichern(); };
  $('e-ende').onchange    = () => { zustand.reise.ende  = $('e-ende').value;  speichern(); };
  $('e-budget').onchange  = () => {
    zustand.reise.tagesbudget = betragLesen($('e-budget').value) || 0;
    speichern();
  };
  $('e-waehrung').onchange = () => {
    zustand.reise.waehrung = $('e-waehrung').value.trim() || '€';
    speichern();
  };
  $('e-ich').onchange = () => { zustand.ichBinId = $('e-ich').value; speichern(); };

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

  /* Sicherung: Datei rausschreiben bzw. einlesen */
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
