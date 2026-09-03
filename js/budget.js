/* ==========================================================
   budget.js – Die Rechenschicht.

   Hier steht ausschliesslich Mathematik: wie viel habe ich heute
   ausgegeben, reicht mein Geld noch, und wer schuldet wem was.

   Diese Datei fasst NIE die Oberflaeche an und speichert NICHTS.
   Sie bekommt Daten rein und gibt Zahlen zurueck. Dadurch kann
   man sie einzeln nachrechnen, wenn mal etwas komisch aussieht.
   ========================================================== */

const Budget = (function () {

  /* Dein persoenlicher Anteil an einer Ausgabe.
     Eine Ausgabe von 60 € geteilt durch 3 Personen = 20 € fuer dich.
     Bist du nicht beteiligt, ist dein Anteil 0. */
  function anteil(ausgabe, personId) {
    const teiler = ausgabe.geteiltMit.length || 1;
    return ausgabe.geteiltMit.includes(personId) ? ausgabe.betrag / teiler : 0;
  }

  /* Summe deiner Anteile ueber alle Ausgaben, die dem Filter entsprechen. */
  function summeAnteil(ausgaben, personId, filter) {
    return ausgaben
      .filter(filter || (() => true))
      .reduce((s, a) => s + anteil(a, personId), 0);
  }

  /* Ausgaben eines bestimmten Tages, z.B. '2026-09-03'. */
  function amTag(datum) {
    return a => a.datum === datum;
  }

  /* Ausgaben der letzten 7 Tage, heute mitgezaehlt. */
  function letzteTage(anzahl) {
    const grenze = tagVerschieben(Store.heuteAlsText(), -(anzahl - 1));
    return a => a.datum >= grenze;
  }

  function tagVerschieben(datumText, tage) {
    const [j, m, t] = datumText.split('-').map(Number);
    const d = new Date(j, m - 1, t + tage);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const tt = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${tt}`;
  }

  /* Anzahl Tage zwischen zwei Datumsangaben (beide inklusive). */
  function tageZwischen(vonText, bisText) {
    if (!vonText || !bisText) return null;
    const [j1, m1, t1] = vonText.split('-').map(Number);
    const [j2, m2, t2] = bisText.split('-').map(Number);
    const ms = new Date(j2, m2 - 1, t2) - new Date(j1, m1 - 1, t1);
    return Math.floor(ms / 86400000) + 1;
  }

  /* Summe pro Kategorie – fuer die Balken auf der Uebersicht. */
  function proKategorie(ausgaben, personId) {
    const map = new Map();
    ausgaben.forEach(a => {
      const wert = anteil(a, personId);
      if (wert <= 0) return;
      map.set(a.kategorie, (map.get(a.kategorie) || 0) + wert);
    });
    return [...map.entries()]
      .map(([id, betrag]) => ({ kategorie: Store.kategorie(id), betrag }))
      .sort((a, b) => b.betrag - a.betrag);
  }

  /* --- Geteilte Reisekasse --------------------------------
     Saldo einer Person = was sie ausgelegt hat
                        − was ihr Anteil an allem ist.
     Positiv  = sie bekommt Geld zurueck.
     Negativ  = sie schuldet noch etwas.
     Die Summe aller Salden ist immer 0.                    */

  function salden(zustand) {
    return zustand.personen.map(p => {
      const ausgelegt = zustand.ausgaben
        .filter(a => a.bezahltVon === p.id)
        .reduce((s, a) => s + a.betrag, 0);
      const eigenerAnteil = summeAnteil(zustand.ausgaben, p.id);
      return { person: p, ausgelegt, eigenerAnteil, saldo: ausgelegt - eigenerAnteil };
    });
  }

  /* Aus den Salden die kuerzeste Liste an Zahlungen bauen.
     Wir nehmen immer den groessten Schuldner und den groessten
     Glaeubiger und gleichen so viel wie moeglich auf einmal aus.
     Das ergibt bei n Personen hoechstens n−1 Ueberweisungen. */
  function ausgleich(zustand) {
    const cent = 0.005; /* alles darunter ist Rundungsrest */
    const schuldner  = [];
    const glaeubiger = [];

    salden(zustand).forEach(s => {
      if (s.saldo < -cent) schuldner.push({ person: s.person, offen: -s.saldo });
      if (s.saldo >  cent) glaeubiger.push({ person: s.person, offen:  s.saldo });
    });

    schuldner.sort((a, b) => b.offen - a.offen);
    glaeubiger.sort((a, b) => b.offen - a.offen);

    const zahlungen = [];
    let i = 0, j = 0;
    while (i < schuldner.length && j < glaeubiger.length) {
      const betrag = Math.min(schuldner[i].offen, glaeubiger[j].offen);
      zahlungen.push({ von: schuldner[i].person, an: glaeubiger[j].person, betrag });
      schuldner[i].offen  -= betrag;
      glaeubiger[j].offen -= betrag;
      if (schuldner[i].offen  < cent) i++;
      if (glaeubiger[j].offen < cent) j++;
    }
    return zahlungen;
  }

  /* --- Reichweite -----------------------------------------
     Wie lange reicht das Geld noch, wenn du so weitermachst?
     Grundlage: dein Schnitt pro Tag seit Reisebeginn.        */

  function reichweite(zustand) {
    const heute = Store.heuteAlsText();
    const start = zustand.reise.start || heute;
    const budget = Number(zustand.reise.tagesbudget) || 0;
    const bisherigeTage = Math.max(1, tageZwischen(start, heute) || 1);
    const ausgegeben = summeAnteil(zustand.ausgaben, zustand.ichBinId, a => a.datum <= heute);
    const schnitt = ausgegeben / bisherigeTage;

    const ergebnis = { bisherigeTage, ausgegeben, schnitt, budget };

    if (zustand.reise.ende) {
      const gesamtTage = tageZwischen(start, zustand.reise.ende);
      const restTage = Math.max(0, tageZwischen(heute, zustand.reise.ende) - 1);
      const gesamtBudget = budget * gesamtTage;
      ergebnis.restTage = restTage;
      ergebnis.gesamtBudget = gesamtBudget;
      ergebnis.restBudget = gesamtBudget - ausgegeben;
      ergebnis.proRestTag = restTage > 0 ? ergebnis.restBudget / restTage : null;
    } else if (schnitt > 0 && budget > 0) {
      /* Kein Enddatum gesetzt: wir sagen nur, wie du im Schnitt liegst. */
      ergebnis.abweichung = schnitt - budget;
    }
    return ergebnis;
  }

  return {
    anteil, summeAnteil, amTag, letzteTage,
    tagVerschieben, tageZwischen, proKategorie,
    salden, ausgleich, reichweite
  };

})();
