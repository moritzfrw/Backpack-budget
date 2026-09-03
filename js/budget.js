/* ==========================================================
   budget.js – Die Rechenschicht.

   Hier steht ausschliesslich Mathematik. Diese Datei fasst NIE die
   Oberflaeche an und speichert NICHTS – sie bekommt Daten rein und
   gibt Zahlen zurueck.

   Die zentrale Idee der App:

   1. Du sagst, wie lange du reist und wie viel Geld du hast.
      Daraus ergibt sich dein Tagesbudget.

   2. Jede Ausgabe wird auf Tage verteilt. Eine normale Ausgabe
      liegt auf einem Tag. Ein Hostel fuer 7 Naechte zu 140 EUR
      liegt mit je 20 EUR auf sieben Tagen. Dadurch reisst eine
      grosse Buchung nicht ein Loch in einen einzelnen Tag.

   3. Das Tagesbudget wird jeden Tag neu berechnet:
      (was vom Gesamtbudget noch da ist) / (Tage, die noch kommen).
      Gibst du zu viel aus, sinkt die Zahl von morgen. Sparst du,
      steigt sie. Deshalb muss nichts von Hand nachjustiert werden.
   ========================================================== */

const Budget = (function () {

  /* ---------- Datum ---------- */

  function tagVerschieben(datumText, tage) {
    const [j, m, t] = datumText.split('-').map(Number);
    const d = new Date(j, m - 1, t + tage);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const tt = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${tt}`;
  }

  /* Anzahl Tage von..bis, beide mitgezaehlt. 1.–1. = 1 Tag. */
  function tageZwischen(vonText, bisText) {
    if (!vonText || !bisText) return null;
    const [j1, m1, t1] = vonText.split('-').map(Number);
    const [j2, m2, t2] = bisText.split('-').map(Number);
    const ms = new Date(j2, m2 - 1, t2) - new Date(j1, m1 - 1, t1);
    return Math.floor(ms / 86400000) + 1;
  }

  /* ---------- Ausgaben auf Tage verteilen ---------- */

  /* Alle Tage, auf die eine Ausgabe faellt. Ohne "bisDatum" ist
     das genau ein Tag. Die Obergrenze von 730 ist nur eine Bremse
     gegen vertippte Datumsangaben. */
  function tageEinerAusgabe(a) {
    if (!a.bisDatum || a.bisDatum <= a.datum) return [a.datum];
    const tage = [];
    let d = a.datum;
    while (d <= a.bisDatum && tage.length < 730) {
      tage.push(d);
      d = tagVerschieben(d, 1);
    }
    return tage;
  }

  /* Dein persoenlicher Anteil an einer Ausgabe.
     60 EUR durch 3 Personen geteilt = 20 EUR fuer dich.
     Bist du nicht beteiligt, ist dein Anteil 0. */
  function anteil(a, personId) {
    const teiler = a.geteiltMit.length || 1;
    return a.geteiltMit.includes(personId) ? a.betrag / teiler : 0;
  }

  /* Dein Anteil, der auf einen einzelnen Tag entfaellt. */
  function anteilProTag(a, personId) {
    return anteil(a, personId) / tageEinerAusgabe(a).length;
  }

  /* Der Kern: eine Tabelle "Datum -> dein Betrag an diesem Tag".
     Alles Weitere in dieser Datei liest nur noch aus dieser Tabelle. */
  function tagesSummen(ausgaben, personId) {
    const summen = new Map();
    ausgaben.forEach(a => {
      const tage = tageEinerAusgabe(a);
      const proTag = anteil(a, personId) / tage.length;
      if (proTag <= 0) return;
      tage.forEach(d => summen.set(d, (summen.get(d) || 0) + proTag));
    });
    return summen;
  }

  function summeAmTag(summen, datum) {
    return summen.get(datum) || 0;
  }

  /* ---------- Der Reiseplan ---------- */

  function plan(zustand) {
    const heute = Store.heuteAlsText();
    const r = zustand.reise;
    const gesamtbudget = Number(r.gesamtbudget) || 0;
    const start = r.start || heute;
    const ende = r.ende || '';
    const gesamtTage = ende ? tageZwischen(start, ende) : null;
    const eingerichtet = gesamtbudget > 0 && gesamtTage > 0;

    const summen = tagesSummen(zustand.ausgaben, zustand.ichBinId);

    let vorHeute = 0, heuteAusgegeben = 0, gesamtAusgegeben = 0;
    summen.forEach((betrag, tag) => {
      gesamtAusgegeben += betrag;
      if (tag < heute) vorHeute += betrag;
      else if (tag === heute) heuteAusgegeben += betrag;
    });

    const p = {
      eingerichtet, gesamtbudget, start, ende, heute, summen,
      vorHeute, heuteAusgegeben, gesamtAusgegeben,
      uebrig: gesamtbudget - gesamtAusgegeben
    };
    if (!eingerichtet) { p.status = 'unbekannt'; return p; }

    p.gesamtTage = gesamtTage;
    p.tagesbudgetPlan = gesamtbudget / gesamtTage;
    p.status = heute < start ? 'vorher' : (heute > ende ? 'beendet' : 'laufend');
    p.tagNummer = Math.min(gesamtTage, Math.max(1, tageZwischen(start, heute)));

    /* Vor Reisebeginn rechnen wir ab dem Starttag, nicht ab heute. */
    const abTag = p.status === 'vorher' ? start : heute;

    p.restTage = p.status === 'beendet' ? 0 : tageZwischen(abTag, ende);
    p.restbudget = gesamtbudget - vorHeute;

    /* Das ist die Zahl, um die sich alles dreht. */
    p.heutigesBudget = p.restTage > 0 ? p.restbudget / p.restTage : 0;
    p.heuteVerfuegbar = p.heutigesBudget - heuteAusgegeben;

    /* Was du morgen haettest, wenn du heute so weitermachst.
       Damit laesst sich die Folge einer Ueberziehung konkret zeigen. */
    p.morgenBudget = p.restTage > 1
      ? (p.restbudget - heuteAusgegeben) / (p.restTage - 1)
      : null;

    /* Schnitt der abgeschlossenen Tage. Der heutige Tag zaehlt
       bewusst nicht mit – morgens waere sonst jede Prognose
       euphorisch und abends duester. */
    p.abgeschlosseneTage = Math.max(0, Math.min(gesamtTage, tageZwischen(start, heute)) - 1);
    p.schnitt = p.abgeschlosseneTage > 0
      ? vorHeute / p.abgeschlosseneTage
      : heuteAusgegeben;

    /* Prognose: wie lange reicht das Geld bei diesem Schnitt? */
    if (p.schnitt > 0 && p.status !== 'beendet') {
      p.reichweiteTage = Math.floor(p.restbudget / p.schnitt);
      p.prognoseEnde = tagVerschieben(abTag, Math.max(0, p.reichweiteTage - 1));
      p.differenzTage = p.reichweiteTage - p.restTage;
    } else {
      p.reichweiteTage = null;
      p.prognoseEnde = null;
      p.differenzTage = null;
    }
    return p;
  }

  /* ---------- Auswertung nach Kategorie ---------- */

  function proKategorie(ausgaben, personId) {
    const summe = new Map();
    ausgaben.forEach(a => {
      const wert = anteil(a, personId);
      if (wert <= 0) return;
      summe.set(a.kategorie, (summe.get(a.kategorie) || 0) + wert);
    });
    const gesamt = [...summe.values()].reduce((s, x) => s + x, 0);
    const zeilen = [...summe.entries()]
      .map(([id, betrag]) => ({
        kategorie: Store.kategorie(id),
        betrag,
        prozent: gesamt > 0 ? betrag / gesamt * 100 : 0
      }))
      .sort((a, b) => b.betrag - a.betrag);

    /* Prozente so runden, dass sie zusammen wirklich 100 ergeben:
       erst abrunden, dann die uebrigen Punkte an die Zeilen mit dem
       groessten abgeschnittenen Rest verteilen. Sonst steht auf dem
       Bildschirm 60 + 30 + 11 = 101. */
    let vergeben = 0;
    zeilen.forEach(z => { z.ganz = Math.floor(z.prozent); vergeben += z.ganz; });
    const rest = [...zeilen].sort((a, b) => (b.prozent - b.ganz) - (a.prozent - a.ganz));
    for (let i = 0; i < Math.round(gesamt > 0 ? 100 - vergeben : 0); i++) {
      if (rest[i % rest.length]) rest[i % rest.length].ganz++;
    }
    return zeilen;
  }

  /* ---------- Geteilte Reisekasse ----------
     Saldo = was jemand ausgelegt hat, minus sein eigener Anteil.
     Positiv = bekommt Geld zurueck. Die Summe aller Salden ist 0. */

  function salden(zustand) {
    return zustand.personen.map(p => {
      const ausgelegt = zustand.ausgaben
        .filter(a => a.bezahltVon === p.id)
        .reduce((s, a) => s + a.betrag, 0);
      const eigenerAnteil = zustand.ausgaben
        .reduce((s, a) => s + anteil(a, p.id), 0);
      return { person: p, ausgelegt, eigenerAnteil, saldo: ausgelegt - eigenerAnteil };
    });
  }

  /* Kuerzeste Liste an Zahlungen: immer der groesste Schuldner an
     den groessten Glaeubiger. Ergibt hoechstens n-1 Ueberweisungen. */
  function ausgleich(zustand) {
    const cent = 0.005;
    const schuldner = [], glaeubiger = [];

    salden(zustand).forEach(s => {
      if (s.saldo < -cent) schuldner.push({ person: s.person, offen: -s.saldo });
      if (s.saldo >  cent) glaeubiger.push({ person: s.person, offen: s.saldo });
    });
    schuldner.sort((a, b) => b.offen - a.offen);
    glaeubiger.sort((a, b) => b.offen - a.offen);

    const zahlungen = [];
    let i = 0, j = 0;
    while (i < schuldner.length && j < glaeubiger.length) {
      const betrag = Math.min(schuldner[i].offen, glaeubiger[j].offen);
      zahlungen.push({ von: schuldner[i].person, an: glaeubiger[j].person, betrag });
      schuldner[i].offen -= betrag;
      glaeubiger[j].offen -= betrag;
      if (schuldner[i].offen < cent) i++;
      if (glaeubiger[j].offen < cent) j++;
    }
    return zahlungen;
  }

  return {
    tagVerschieben, tageZwischen,
    tageEinerAusgabe, anteil, anteilProTag, tagesSummen, summeAmTag,
    plan, proKategorie, salden, ausgleich
  };

})();
