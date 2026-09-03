/* ==========================================================
   sync.js – Der Abgleich mit dem eigenen Server.

   Diese Datei redet als einzige mit dem Netz. Sie kennt weder die
   Oberflaeche noch die Budget-Rechnung – sie holt einen Datenstand
   und schickt einen Datenstand, mehr nicht.

   Adresse und Zugangsschluessel liegen getrennt von den Reisedaten
   in einem eigenen Fach. Das hat zwei Gruende: sie gehoeren zum
   Geraet und nicht zur Reise, und sie sollen nie versehentlich in
   einer Sicherungsdatei landen, die man weitergibt.

   Wichtig: Die App funktioniert ohne all das vollstaendig weiter.
   Der Abgleich ist eine Zugabe, keine Voraussetzung. Ist der Server
   nicht erreichbar, wird lokal gespeichert und spaeter nachgereicht.
   ========================================================== */

const Sync = (function () {

  const FACH = 'backpack-budget-server';
  const ZEITLIMIT = 12000;   /* nach 12 Sekunden aufgeben */

  function konfig() {
    try {
      return JSON.parse(localStorage.getItem(FACH)) || {};
    } catch (e) {
      return {};
    }
  }

  function konfigSichern(neu) {
    localStorage.setItem(FACH, JSON.stringify(Object.assign(konfig(), neu)));
  }

  function konfigLoeschen() {
    localStorage.removeItem(FACH);
  }

  function eingerichtet() {
    const k = konfig();
    return !!(k.adresse && k.schluessel);
  }

  /* Tippfehler abfangen: fehlendes https:// ergaenzen, Schraegstrich
     am Ende entfernen. */
  function adresseAufraeumen(text) {
    let a = String(text || '').trim();
    if (!a) return '';
    if (!/^https?:\/\//i.test(a)) a = 'https://' + a;
    return a.replace(/\/+$/, '');
  }

  /* Eine Anfrage mit Zeitlimit. Ohne das haengt die App bei einer
     schlechten Verbindung ewig am Ladebalken. */
  async function anfrage(adresse, pfad, optionen) {
    const abbruch = new AbortController();
    const uhr = setTimeout(() => abbruch.abort(), ZEITLIMIT);
    try {
      const antwort = await fetch(adresse + pfad,
        Object.assign({ signal: abbruch.signal, cache: 'no-store' }, optionen));
      if (antwort.status === 401) throw new Error('Zugangsschlüssel stimmt nicht');
      if (!antwort.ok) throw new Error('Server antwortet mit Fehler ' + antwort.status);
      return await antwort.json();
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('Server antwortet nicht');
      /* fetch wirft bei fehlender Verbindung einen sehr technischen
         Fehler – den uebersetzen wir. */
      if (e instanceof TypeError) throw new Error('Server nicht erreichbar');
      throw e;
    } finally {
      clearTimeout(uhr);
    }
  }

  /* Lebenszeichen. Braucht keinen Schluessel und eignet sich deshalb
     zum Pruefen, ob die Adresse ueberhaupt stimmt. */
  async function erreichbar(adresse) {
    const a = adresseAufraeumen(adresse);
    if (!a) throw new Error('Keine Adresse angegeben');
    const antwort = await anfrage(a, '/gesundheit', { method: 'GET' });
    if (!antwort || !antwort.ok) throw new Error('Unerwartete Antwort');
    return true;
  }

  function kopfzeilen() {
    return {
      'Authorization': 'Bearer ' + konfig().schluessel,
      'Content-Type': 'application/json'
    };
  }

  async function holen() {
    const k = konfig();
    return await anfrage(k.adresse, '/laden', {
      method: 'GET', headers: kopfzeilen()
    });
  }

  async function schicken(zustand) {
    const k = konfig();
    await anfrage(k.adresse, '/speichern', {
      method: 'PUT', headers: kopfzeilen(), body: JSON.stringify(zustand)
    });
    return true;
  }

  return {
    konfig, konfigSichern, konfigLoeschen, eingerichtet,
    adresseAufraeumen, erreichbar, holen, schicken
  };

})();
