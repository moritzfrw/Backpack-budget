/* ==========================================================
   waehrung.js – Währungen und Wechselkurse.

   Die einzige Datei, die den Kursdienst kennt. Sie holt die
   Kurse, legt sie beiseite und beantwortet die Frage
   "wie viele Colón sind ein Euro".

   Zwei Dinge, die den Rest der App betreffen:

   1. Ein Kurs sagt immer, wie viele Einheiten der Landeswährung
      auf EINE Einheit deiner Basiswährung kommen.
      Bei Basis EUR und Costa Rica: 516,65 – ein Euro sind
      516,65 Colón. Rückrechnung also: Betrag geteilt durch Kurs.

   2. Jede Ausgabe speichert ihren EIGENEN Kurs vom Tag der
      Eingabe. Sonst würde sich deine gesamte Ausgaben-Historie
      jede Nacht mit dem Wechselkurs verschieben, und die
      Prognose wackelte ohne dein Zutun.

   Die Kurse liegen in einem eigenen Fach, getrennt von den
   Reisedaten: Es sind Marktdaten, keine persönlichen Daten –
   sie müssen weder abgeglichen noch gesichert werden.
   ========================================================== */

const Waehrung = (function () {

  const FACH = 'backpack-budget-kurse';
  const DIENST = 'https://open.er-api.com/v6/latest/';

  /* Die Währungen der üblichen Backpacker-Routen, mit deutschem
     Namen und – wo es einen gibt – einem Zeichen. Alles, was hier
     fehlt, funktioniert trotzdem: dann wird der Code angezeigt. */
  const LISTE = [
    { code: 'EUR', name: 'Euro',                 zeichen: '€' },
    { code: 'USD', name: 'US-Dollar',            zeichen: '$' },
    { code: 'GBP', name: 'Britisches Pfund',     zeichen: '£' },
    { code: 'CHF', name: 'Schweizer Franken',    zeichen: 'CHF' },
    { code: 'CZK', name: 'Tschechische Krone',   zeichen: 'Kč' },
    { code: 'PLN', name: 'Polnischer Złoty',     zeichen: 'zł' },
    { code: 'HUF', name: 'Ungarischer Forint',   zeichen: 'Ft' },
    { code: 'RON', name: 'Rumänischer Leu',      zeichen: 'lei' },
    { code: 'BGN', name: 'Bulgarischer Lew',     zeichen: 'лв' },
    { code: 'RSD', name: 'Serbischer Dinar',     zeichen: 'din' },
    { code: 'BAM', name: 'Bosnische Mark',       zeichen: 'KM' },
    { code: 'ALL', name: 'Albanischer Lek',      zeichen: 'L' },
    { code: 'DKK', name: 'Dänische Krone',       zeichen: 'kr' },
    { code: 'SEK', name: 'Schwedische Krone',    zeichen: 'kr' },
    { code: 'NOK', name: 'Norwegische Krone',    zeichen: 'kr' },
    { code: 'ISK', name: 'Isländische Krone',    zeichen: 'kr' },
    { code: 'TRY', name: 'Türkische Lira',       zeichen: '₺' },
    { code: 'MAD', name: 'Marokkanischer Dirham',zeichen: 'DH' },
    { code: 'EGP', name: 'Ägyptisches Pfund',    zeichen: 'E£' },
    { code: 'ZAR', name: 'Südafrikanischer Rand',zeichen: 'R' },
    { code: 'KES', name: 'Kenia-Schilling',      zeichen: 'KSh' },
    { code: 'TZS', name: 'Tansania-Schilling',   zeichen: 'TSh' },
    { code: 'CRC', name: 'Costa-Rica-Colón',     zeichen: '₡' },
    { code: 'GTQ', name: 'Guatemaltekischer Quetzal', zeichen: 'Q' },
    { code: 'PAB', name: 'Panamaischer Balboa',  zeichen: 'B/.' },
    { code: 'MXN', name: 'Mexikanischer Peso',   zeichen: 'MX$' },
    { code: 'COP', name: 'Kolumbianischer Peso', zeichen: 'COL$' },
    { code: 'PEN', name: 'Peruanischer Sol',     zeichen: 'S/' },
    { code: 'BOB', name: 'Bolivianischer Boliviano', zeichen: 'Bs' },
    { code: 'BRL', name: 'Brasilianischer Real', zeichen: 'R$' },
    { code: 'ARS', name: 'Argentinischer Peso',  zeichen: 'ARS$' },
    { code: 'CLP', name: 'Chilenischer Peso',    zeichen: 'CLP$' },
    { code: 'THB', name: 'Thailändischer Baht',  zeichen: '฿' },
    { code: 'VND', name: 'Vietnamesischer Dong', zeichen: '₫' },
    { code: 'LAK', name: 'Laotischer Kip',       zeichen: '₭' },
    { code: 'KHR', name: 'Kambodschanischer Riel', zeichen: '៛' },
    { code: 'MMK', name: 'Myanmarischer Kyat',   zeichen: 'K' },
    { code: 'IDR', name: 'Indonesische Rupiah',  zeichen: 'Rp' },
    { code: 'MYR', name: 'Malaysischer Ringgit', zeichen: 'RM' },
    { code: 'PHP', name: 'Philippinischer Peso', zeichen: '₱' },
    { code: 'SGD', name: 'Singapur-Dollar',      zeichen: 'S$' },
    { code: 'INR', name: 'Indische Rupie',       zeichen: '₹' },
    { code: 'NPR', name: 'Nepalesische Rupie',   zeichen: 'NPR' },
    { code: 'LKR', name: 'Sri-Lanka-Rupie',      zeichen: 'LKR' },
    { code: 'JPY', name: 'Japanischer Yen',      zeichen: '¥' },
    { code: 'KRW', name: 'Südkoreanischer Won',  zeichen: '₩' },
    { code: 'CNY', name: 'Chinesischer Yuan',    zeichen: 'CN¥' },
    { code: 'HKD', name: 'Hongkong-Dollar',      zeichen: 'HK$' },
    { code: 'TWD', name: 'Taiwan-Dollar',        zeichen: 'NT$' },
    { code: 'AUD', name: 'Australischer Dollar', zeichen: 'A$' },
    { code: 'NZD', name: 'Neuseeland-Dollar',    zeichen: 'NZ$' },
    { code: 'CAD', name: 'Kanadischer Dollar',   zeichen: 'CA$' },
    { code: 'AED', name: 'VAE-Dirham',           zeichen: 'AED' },
    { code: 'GEL', name: 'Georgischer Lari',     zeichen: '₾' },
    { code: 'UAH', name: 'Ukrainische Hrywnja',  zeichen: '₴' }
  ];

  function eintrag(code) {
    return LISTE.find(w => w.code === code) || { code: code, name: code, zeichen: code };
  }

  function zeichen(code) {
    return eintrag(code).zeichen;
  }

  /* --- Der Kursvorrat --------------------------------------
     Aufbau: { basis: 'EUR', kurse: { CRC: 516.6, … }, geholt: <ms> }
     Liegt bewusst in einem eigenen Fach. */

  function vorrat() {
    try {
      return JSON.parse(localStorage.getItem(FACH)) || null;
    } catch (e) {
      return null;
    }
  }

  function vorratSichern(v) {
    try { localStorage.setItem(FACH, JSON.stringify(v)); }
    catch (e) { /* voller oder gesperrter Speicher – nicht schlimm */ }
  }

  /* Wie viele Einheiten von `code` sind eine Einheit der Basis?
     Gibt null zurück, wenn wir es nicht wissen – dann muss die
     App nachfragen statt zu raten. */
  function kurs(basis, code) {
    if (code === basis) return 1;
    const v = vorrat();
    if (!v || v.basis !== basis) return null;
    const k = v.kurse[code];
    return (typeof k === 'number' && k > 0) ? k : null;
  }

  function alterTage() {
    const v = vorrat();
    if (!v || !v.geholt) return null;
    return Math.floor((Date.now() - v.geholt) / 86400000);
  }

  /* Kurse holen. Wirft, wenn es nicht klappt – die App faengt das
     ab und arbeitet mit den zuletzt bekannten Kursen weiter. */
  async function holen(basis) {
    const abbruch = new AbortController();
    const uhr = setTimeout(() => abbruch.abort(), 12000);
    try {
      const antwort = await fetch(DIENST + encodeURIComponent(basis), {
        signal: abbruch.signal, cache: 'no-store'
      });
      if (!antwort.ok) throw new Error(Sprache.t('Kursdienst antwortet mit {code}', { code: antwort.status }));
      const daten = await antwort.json();
      if (daten.result !== 'success' || !daten.rates) throw new Error(Sprache.t('Unerwartete Antwort'));

      vorratSichern({ basis: basis, kurse: daten.rates, geholt: Date.now() });
      return true;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error(Sprache.t('Kursdienst antwortet nicht'));
      if (e instanceof TypeError) throw new Error(Sprache.t('Keine Verbindung zum Kursdienst'));
      throw e;
    } finally {
      clearTimeout(uhr);
    }
  }

  /* Einmal am Tag reicht – der Dienst aktualisiert selbst nur
     taeglich. Laeuft im Hintergrund und darf stillschweigend
     scheitern. */
  async function beiGelegenheitHolen(basis) {
    const v = vorrat();
    const frisch = v && v.basis === basis && v.geholt &&
                   (Date.now() - v.geholt) < 20 * 3600 * 1000;
    if (frisch) return false;
    try { return await holen(basis); }
    catch (e) { return false; }
  }

  return { LISTE, eintrag, zeichen, kurs, alterTage, vorrat, holen, beiGelegenheitHolen };

})();
