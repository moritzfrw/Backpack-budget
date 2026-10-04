/* ==========================================================
   sprache.js – Deutsch und Englisch.

   Zwei Entscheidungen, die den Rest der App betreffen:

   1. DER DEUTSCHE TEXT IST DER SCHLUESSEL.
      t('Heute verfügbar') statt t('heute.label'). Der Code
      bleibt dadurch lesbar - man sieht beim Lesen, was auf dem
      Bildschirm steht, ohne in einer Tabelle nachzuschlagen.
      Und fehlt eine Uebersetzung, erscheint der deutsche Satz:
      sichtbar falsch, aber nie kaputt oder leer.

      Der Preis: Wer einen deutschen Text aendert, muss den
      Schluessel hier mitaendern. Bei zwei Sprachen ist das
      billiger als zweihundert erfundene Kuerzel zu pflegen.

   2. PLATZHALTER STATT ZUSAMMENGESETZTER SAETZE.
      'Noch ' + geld(x) + ' für heute' laesst sich nicht
      uebersetzen - im Englischen steht das Geld woanders im
      Satz. Deshalb t('Noch {geld} für heute', {geld: …}).

   Die Sprache wird aus dem Browser erkannt und kann in den
   Einstellungen umgestellt werden. Die Wahl liegt in einem
   eigenen Fach: Sie gehoert zum Geraet, nicht zur Reise, und
   soll beim Abgleich nicht zwischen zwei Handys hin und her
   springen.
   ========================================================== */

const Sprache = (function () {

  const FACH = 'backpack-budget-sprache';

  /* Nur Englisch steht hier - Deutsch IST der Schluessel. */
  const EN = {};

  let aktuell = 'de';

  /* --- Erkennen und Umstellen ------------------------------ */

  function erkennen() {
    try {
      const gewaehlt = localStorage.getItem(FACH);
      if (gewaehlt === 'de' || gewaehlt === 'en') return gewaehlt;
    } catch (e) { /* gesperrter Speicher - dann eben der Browser */ }

    const browser = (navigator.languages && navigator.languages[0]) ||
                    navigator.language || 'en';
    /* Deutsch nur fuer Deutsch. Alles andere bekommt Englisch:
       Ein Franzose versteht die englische Fassung, die deutsche
       nicht. */
    return /^de\b/i.test(browser) ? 'de' : 'en';
  }

  function setzen(code) {
    aktuell = (code === 'de') ? 'de' : 'en';
    try { localStorage.setItem(FACH, aktuell); } catch (e) { /* egal */ }
    document.documentElement.lang = aktuell;
  }

  function ist() { return aktuell; }

  /* --- Uebersetzen ----------------------------------------- */

  /* t('Noch {geld} übrig', { geld: '12,30 €' })
     Fehlt die Uebersetzung, kommt der deutsche Satz zurueck -
     die Platzhalter werden trotzdem gefuellt. */
  function t(text, werte) {
    let s = (aktuell === 'en' && EN[text] !== undefined) ? EN[text] : text;
    if (werte) {
      s = s.replace(/\{(\w+)\}/g, (ganz, name) =>
        werte[name] !== undefined ? werte[name] : ganz);
    }
    return s;
  }

  /* Mehrzahl. Im Deutschen wie im Englischen reicht die
     Unterscheidung eins/mehr - andere Sprachen brauchen mehr,
     die haben wir nicht. */
  function tn(anzahl, einzahl, mehrzahl, werte) {
    const vorlage = (Math.abs(anzahl) === 1) ? einzahl : mehrzahl;
    return t(vorlage, Object.assign({ n: anzahl }, werte || {}));
  }

  /* --- Formate --------------------------------------------- */

  /* Die Sprachkennung fuer Intl. Nicht dasselbe wie die
     Sprachwahl: Sie entscheidet ueber Dezimalkomma,
     Datumsreihenfolge und Monatsnamen. */
  function kennung() {
    return aktuell === 'de' ? 'de-DE' : 'en-GB';
  }

  /* Zeilenumbrueche und Einrueckung aus dem Markup zu einem
     einzelnen Leerzeichen. Ohne das haengt der Schluessel daran,
     wie der HTML-Quelltext gerade umgebrochen ist. */
  function glatt(s) {
    return String(s).replace(/\s+/g, ' ').trim();
  }

  /* --- Das Markup ------------------------------------------ */

  /* Fuellt alle Stellen im HTML, die data-t tragen.
     <span data-t>Heute verfügbar</span>
     Der deutsche Text steht im Markup und dient als Schluessel;
     beim ersten Lauf wird er beiseitegelegt, damit ein zweiter
     Lauf (nach dem Umschalten) nicht die englische Fassung als
     Schluessel benutzt. */
  function markupFuellen(wurzel) {
    const feld = wurzel || document;

    /* Reiner Text. Nur fuer Elemente ohne Kindelemente - sonst
       wuerde textContent sie loeschen. */
    feld.querySelectorAll('[data-t]').forEach(el => {
      if (el.dataset.tQuelle === undefined) el.dataset.tQuelle = glatt(el.textContent);
      el.textContent = t(el.dataset.tQuelle);
    });

    /* Text mit Auszeichnung darin, etwa ein <b> mitten im Satz.
       Der Inhalt kommt aus dieser Datei, nicht von aussen - hier
       innerHTML zu setzen ist deshalb unbedenklich. */
    feld.querySelectorAll('[data-t-html]').forEach(el => {
      if (el.dataset.tHtmlQuelle === undefined) el.dataset.tHtmlQuelle = glatt(el.innerHTML);
      el.innerHTML = t(el.dataset.tHtmlQuelle);
    });

    ['placeholder', 'title', 'aria-label'].forEach(attr => {
      feld.querySelectorAll('[data-t-' + attr + ']').forEach(el => {
        const merk = 't' + attr.replace(/-(\w)/g, (g, c) => c.toUpperCase()) + 'Quelle';
        if (!el.dataset[merk]) el.dataset[merk] = el.getAttribute(attr) || '';
        el.setAttribute(attr, t(el.dataset[merk]));
      });
    });
  }

  aktuell = erkennen();
  document.documentElement.lang = aktuell;

  return { t, tn, ist, setzen, kennung, markupFuellen, EN };

})();
