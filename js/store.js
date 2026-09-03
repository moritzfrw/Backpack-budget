/* ==========================================================
   store.js – Die Datenschicht.

   Hier liegt ALLES, was mit Speichern und Laden zu tun hat.
   Der Rest der App fragt nur "gib mir die Daten" / "speichere das"
   und weiss nicht, WO gespeichert wird.

   Genau deshalb kannst du das spaeter auf einen Server umstellen,
   ohne den Rest der App anzufassen: du tauschst nur die zwei
   Funktionen laden() und sichern() hier unten aus.
   ========================================================== */

const Store = (function () {

  const SCHLUESSEL = 'backpack-budget-v1';
  const VERSION = 2;

  /* Die Kategorien. Reihenfolge = Reihenfolge in der App.
     Willst du eine weitere, haeng hier einfach eine Zeile an. */
  const KATEGORIEN = [
    { id: 'essen',        name: 'Essen & Trinken', icon: '🍜' },
    { id: 'fortbewegung', name: 'Fortbewegung',    icon: '🚌' },
    { id: 'unterkunft',   name: 'Unterkunft',      icon: '🛏️' },
    { id: 'aktivitaet',   name: 'Aktivitäten',     icon: '🎟️' },
    { id: 'sonstiges',    name: 'Sonstiges',       icon: '🧾' }
  ];

  /* Alte Kategorie-Namen aus Version 1 auf die neuen abbilden,
     damit bereits eingetragene Ausgaben nicht ins Leere zeigen. */
  const ALTE_KATEGORIEN = {
    transport: 'fortbewegung',
    einkauf:   'sonstiges'
  };

  /* So sieht die App aus, wenn du sie zum allerersten Mal oeffnest. */
  function startZustand() {
    const ich = neueId();
    return {
      version: VERSION,
      reise: {
        name: 'Meine Reise',
        start: heuteAlsText(),
        ende: '',
        gesamtbudget: 0,
        waehrung: '€'
      },
      personen: [{ id: ich, name: 'Ich' }],
      ichBinId: ich,
      ausgaben: [],
      /* Geld, das fuer etwas Bestimmtes weggelegt wird und deshalb
         nie im Tagesbudget auftaucht – z.B. ein Flug. */
      ruecklagen: [],
      /* Wann zuletzt eine Sicherung aus der App geholt wurde.
         0 = noch nie. Daraus baut die App ihre Erinnerung. */
      letzteSicherung: 0
    };
  }

  /* --- Diese zwei Funktionen sind die "Steckdose" zum Speicher --- */

  function laden() {
    try {
      const roh = localStorage.getItem(SCHLUESSEL);
      if (!roh) return startZustand();
      return pruefen(JSON.parse(roh));
    } catch (e) {
      console.warn('Daten konnten nicht gelesen werden, starte neu.', e);
      return startZustand();
    }
  }

  function sichern(zustand) {
    localStorage.setItem(SCHLUESSEL, JSON.stringify(zustand));
  }

  /* --- Ab hier: Hilfsfunktionen --- */

  /* Faengt kaputte oder alte Daten ab, damit die App nicht abstuerzt. */
  function pruefen(d) {
    const s = startZustand();
    if (!d || typeof d !== 'object') return s;

    d.reise    = Object.assign(s.reise, d.reise || {});
    d.personen = Array.isArray(d.personen) && d.personen.length ? d.personen : s.personen;
    d.ausgaben = Array.isArray(d.ausgaben) ? d.ausgaben : [];
    d.ruecklagen = Array.isArray(d.ruecklagen) ? d.ruecklagen : [];
    d.letzteSicherung = Number(d.letzteSicherung) || 0;

    /* Version 1 kannte nur ein von Hand gesetztes Tagesbudget.
       Daraus machen wir ein Gesamtbudget. */
    if (!d.reise.gesamtbudget && d.reise.tagesbudget && d.reise.ende) {
      const tage = tageZwischenRoh(d.reise.start, d.reise.ende);
      if (tage > 0) d.reise.gesamtbudget = d.reise.tagesbudget * tage;
    }
    delete d.reise.tagesbudget;
    d.reise.gesamtbudget = Number(d.reise.gesamtbudget) || 0;

    if (!d.personen.some(p => p.id === d.ichBinId)) d.ichBinId = d.personen[0].id;

    const gueltigePersonen = new Set(d.personen.map(p => p.id));
    const gueltigeKategorien = new Set(KATEGORIEN.map(k => k.id));

    d.ausgaben.forEach(a => {
      a.betrag = Number(a.betrag) || 0;
      if (ALTE_KATEGORIEN[a.kategorie]) a.kategorie = ALTE_KATEGORIEN[a.kategorie];
      if (!gueltigeKategorien.has(a.kategorie)) a.kategorie = KATEGORIEN[0].id;
      if (a.bisDatum && a.bisDatum <= a.datum) a.bisDatum = '';
      if (!gueltigePersonen.has(a.bezahltVon)) a.bezahltVon = d.ichBinId;
      a.geteiltMit = (a.geteiltMit || []).filter(id => gueltigePersonen.has(id));
      if (!a.geteiltMit.length) a.geteiltMit = [d.ichBinId];
    });

    d.ruecklagen.forEach(r => {
      r.betrag = Number(r.betrag) || 0;
      r.bezahlt = !!r.bezahlt;
      if (ALTE_KATEGORIEN[r.kategorie]) r.kategorie = ALTE_KATEGORIEN[r.kategorie];
      if (!gueltigeKategorien.has(r.kategorie)) r.kategorie = 'sonstiges';
    });

    d.version = VERSION;
    return d;
  }

  function neueId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function heuteAlsText() {
    const d = new Date();
    /* Nicht toISOString() nehmen – das rechnet in UTC um und liefert
       abends in Asien schon den naechsten Tag. */
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const t = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${t}`;
  }

  /* Kleine Kopie der Datums-Rechnung, damit pruefen() nicht auf
     budget.js angewiesen ist (das wird erst spaeter geladen). */
  function tageZwischenRoh(von, bis) {
    if (!von || !bis) return 0;
    const [j1, m1, t1] = von.split('-').map(Number);
    const [j2, m2, t2] = bis.split('-').map(Number);
    return Math.floor((new Date(j2, m2 - 1, t2) - new Date(j1, m1 - 1, t1)) / 86400000) + 1;
  }

  function kategorie(id) {
    return KATEGORIEN.find(k => k.id === id) || KATEGORIEN[0];
  }

  return { KATEGORIEN, laden, sichern, startZustand, neueId, heuteAlsText, kategorie };

})();
