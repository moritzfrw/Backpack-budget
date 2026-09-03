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

  /* Die festen Kategorien. Reihenfolge = Reihenfolge in der App. */
  const KATEGORIEN = [
    { id: 'essen',      name: 'Essen & Trinken', icon: '🍜' },
    { id: 'unterkunft', name: 'Unterkunft',      icon: '🛏️' },
    { id: 'transport',  name: 'Transport',       icon: '🚌' },
    { id: 'aktivitaet', name: 'Aktivitäten',     icon: '🎒' },
    { id: 'einkauf',    name: 'Einkauf',         icon: '🛍️' },
    { id: 'sonstiges',  name: 'Sonstiges',       icon: '💸' }
  ];

  /* So sieht die App aus, wenn du sie zum allerersten Mal oeffnest. */
  function startZustand() {
    const ich = neueId();
    return {
      version: 1,
      reise: {
        name: 'Meine Reise',
        start: heuteAlsText(),
        ende: '',
        waehrung: '€',
        tagesbudget: 40
      },
      personen: [{ id: ich, name: 'Ich' }],
      ichBinId: ich,
      ausgaben: []
    };
  }

  /* --- Diese zwei Funktionen sind die "Steckdose" zum Speicher --- */

  function laden() {
    try {
      const roh = localStorage.getItem(SCHLUESSEL);
      if (!roh) return startZustand();
      const daten = JSON.parse(roh);
      return pruefen(daten);
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
    if (!d.personen.some(p => p.id === d.ichBinId)) d.ichBinId = d.personen[0].id;
    /* Ausgaben, deren Personen geloescht wurden, wieder einrenken */
    const gueltig = new Set(d.personen.map(p => p.id));
    d.ausgaben.forEach(a => {
      if (!gueltig.has(a.bezahltVon)) a.bezahltVon = d.ichBinId;
      a.geteiltMit = (a.geteiltMit || []).filter(id => gueltig.has(id));
      if (!a.geteiltMit.length) a.geteiltMit = [d.ichBinId];
    });
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

  function kategorie(id) {
    return KATEGORIEN.find(k => k.id === id) || KATEGORIEN[KATEGORIEN.length - 1];
  }

  return {
    KATEGORIEN,
    laden, sichern, startZustand,
    neueId, heuteAlsText, kategorie
  };

})();
