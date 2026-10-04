/* ==========================================================
   beispiel.js – Eine erfundene Reise zum Anschauen.

   Wer die App zum ersten Mal oeffnet, landet in einer leeren
   Huelle: Die Mechanik ist zu sehen, der Nutzen nicht. Um das zu
   beurteilen, muesste man sich eine Reise ausdenken und zweihundert
   Ausgaben eintippen - das macht niemand.

   Diese Datei erzeugt deshalb eine vollstaendige Beispielreise mit
   acht Staedten in vier Waehrungen. Alle Zahlen sind erfunden, aber
   plausibel.

   Zwei Entscheidungen, die wichtig sind:

   1. Die Reise liegt RELATIV zum heutigen Tag - sie hat vor 37
      Tagen begonnen und laeuft noch 52. Sonst waere sie beim
      Anschauen laengst vorbei und der Heute-Bildschirm leer.

   2. Die Zufallszahlen kommen aus einem eigenen, gesaeten
      Generator. Damit sieht die Beispielreise bei jedem Aufruf
      gleich aus - man kann ueber sie reden, ohne dass sich die
      Zahlen unter der Hand aendern.
   ========================================================== */

const Beispiel = (function () {

  /* Ein winziger Zufallsgenerator mit festem Startwert.
     Math.random() waere hier falsch: Die Beispielreise soll bei
     jedem reproduzierbar dieselbe sein. */
  function wuerfel(saat) {
    let z = saat;
    return function () {
      z = (z * 1103515245 + 12345) & 0x7fffffff;
      return z / 0x7fffffff;
    };
  }

  /* Die Stationen der Reise. Tag = Offset zum Reisebeginn.
     Die Betraege sind Spannen in der jeweiligen Landeswaehrung. */
  const STATIONEN = [
    { ort: 'Bangkok',       waehrung: 'THB', kurs: 38.1,   tag:  0, naechte:  5,
      bett: [420, 900],   essen: [60, 280],    fahrt: [40, 180] },
    { ort: 'Chiang Mai',    waehrung: 'THB', kurs: 38.1,   tag:  5, naechte:  7,
      bett: [350, 700],   essen: [50, 220],    fahrt: [30, 150] },
    { ort: 'Luang Prabang', waehrung: 'LAK', kurs: 24100,  tag: 12, naechte:  5,
      bett: [120000, 260000], essen: [25000, 95000], fahrt: [15000, 70000] },
    { ort: 'Hanoi',         waehrung: 'VND', kurs: 29400,  tag: 17, naechte:  6,
      bett: [200000, 520000], essen: [40000, 160000], fahrt: [20000, 90000] },
    { ort: 'Ninh Binh',     waehrung: 'VND', kurs: 29400,  tag: 23, naechte:  3,
      bett: [250000, 450000], essen: [50000, 140000], fahrt: [25000, 80000] },
    { ort: 'Hoi An',        waehrung: 'VND', kurs: 29400,  tag: 26, naechte:  6,
      bett: [230000, 600000], essen: [45000, 180000], fahrt: [20000, 70000] },
    { ort: 'Siem Reap',     waehrung: 'KHR', kurs: 4710,   tag: 32, naechte:  6,
      bett: [40000, 95000],   essen: [8000, 32000],   fahrt: [5000, 25000] },
    { ort: 'Phnom Penh',    waehrung: 'KHR', kurs: 4710,   tag: 38, naechte:  5,
      bett: [38000, 88000],   essen: [9000, 30000],   fahrt: [6000, 28000] }
  ];

  /* Die Notizen laufen durch die Uebersetzung: Wer die
     Beispielreise auf Englisch oeffnet, soll auch englische
     Eintraege lesen - sonst wirkt die App halb fertig. */
  const ESSEN_NOTIZEN = ['Streetfood', 'Markt', 'Frühstück', 'Nudelsuppe',
                         'Abendessen', 'Kaffee', 'Smoothie', ''];
  const SONST_NOTIZEN = ['Wäscherei', 'SIM-Karte', 'Apotheke', 'Sonnencreme', ''];
  /* Nicht 't' nennen: In der Tagesschleife unten laeuft ein
     Zaehler gleichen Namens und wuerde ihn ueberdecken. */
  const notizText = (x) => x ? Sprache.t(x) : '';

  function zahl(w, von, bis, stufe) {
    const roh = von + w() * (bis - von);
    return Math.round(roh / stufe) * stufe;
  }

  function erzeugen() {
    const w = wuerfel(20260104);
    const heute = Store.heuteAlsText();

    /* Die Reise laeuft bereits: 37 Tage sind vorbei, 52 kommen noch. */
    const start = Budget.tagVerschieben(heute, -37);
    const ende  = Budget.tagVerschieben(start, 89);

    const z = Store.startZustand();
    z.reise = {
      name: Sprache.t('Südostasien'),
      start: start,
      ende: ende,
      gesamtbudget: 4500,
      waehrung: 'EUR'
    };
    /* Die Waehrung der Station, in der die Reise heute steht -
       sonst zeigt die Kopfzeile Baht, waehrend man in Kambodscha ist. */
    const tagHeute = 37;
    const jetzt = STATIONEN.filter(s => s.tag <= tagHeute).pop() || STATIONEN[0];
    z.aktuell = { ort: '', waehrung: jetzt.waehrung };
    z.ruecklagen = [{
      id: Store.neueId(), name: Sprache.t('Rückflug ab Bangkok'),
      betrag: 620, kategorie: 'fortbewegung', bezahlt: true
    }];

    const ich = z.ichBinId;
    let angelegt = Date.now() - 40 * 86400000;
    const neu = (daten) => {
      angelegt += 60000;
      z.ausgaben.push(Object.assign({
        id: Store.neueId(), angelegt: angelegt,
        bisDatum: '', notiz: '', ort: '',
        bezahltVon: ich, geteiltMit: [ich]
      }, daten));
    };

    STATIONEN.forEach((s, i) => {
      const anreise = Budget.tagVerschieben(start, s.tag);
      const abreise = Budget.tagVerschieben(start, s.tag + s.naechte - 1);

      /* Die Unterkunft traegt die Stadt - aus ihr leitet die App
         den Ort aller anderen Ausgaben dieses Zeitraums ab. */
      neu({
        betrag: zahl(w, s.bett[0], s.bett[1], 10) * s.naechte,
        waehrung: s.waehrung, kurs: s.kurs,
        kategorie: 'unterkunft', datum: anreise, bisDatum: abreise,
        ort: s.ort, notiz: Sprache.t('Hostel {ort}', { ort: s.ort })
      });

      /* Die Fahrt hierher, ausser zur allerersten Station. */
      if (i > 0) {
        neu({
          betrag: zahl(w, s.fahrt[1] * 3, s.fahrt[1] * 9, 10),
          waehrung: s.waehrung, kurs: s.kurs,
          kategorie: 'fortbewegung', datum: anreise,
          notiz: Sprache.t('Bus von {ort}', { ort: STATIONEN[i - 1].ort })
        });
      }

      /* Pro Tag zwei bis drei Mahlzeiten, dazu gelegentlich
         Nahverkehr, Aktivitaeten und Sonstiges. */
      for (let t = 0; t < s.naechte; t++) {
        const tag = Budget.tagVerschieben(anreise, t);
        if (tag > heute) break;          /* nichts aus der Zukunft erfinden */

        const mahlzeiten = 2 + (w() > 0.45 ? 1 : 0);
        for (let m = 0; m < mahlzeiten; m++) {
          neu({
            betrag: zahl(w, s.essen[0], s.essen[1], 5),
            waehrung: s.waehrung, kurs: s.kurs,
            kategorie: 'essen', datum: tag,
            notiz: notizText(ESSEN_NOTIZEN[Math.floor(w() * ESSEN_NOTIZEN.length)])
          });
        }
        if (w() > 0.55) {
          neu({
            betrag: zahl(w, s.fahrt[0], s.fahrt[1], 5),
            waehrung: s.waehrung, kurs: s.kurs,
            kategorie: 'fortbewegung', datum: tag
          });
        }
        if (w() > 0.78) {
          neu({
            betrag: zahl(w, s.essen[1], s.essen[1] * 3, 10),
            waehrung: s.waehrung, kurs: s.kurs,
            kategorie: 'aktivitaet', datum: tag,
            notiz: w() > 0.5 ? Sprache.t('Tempel') : Sprache.t('Tour')
          });
        }
        if (w() > 0.82) {
          neu({
            betrag: zahl(w, s.essen[0], s.essen[1] * 2, 5),
            waehrung: s.waehrung, kurs: s.kurs,
            kategorie: 'sonstiges', datum: tag,
            notiz: notizText(SONST_NOTIZEN[Math.floor(w() * SONST_NOTIZEN.length)])
          });
        }
      }
    });

    /* Markierung, damit die App weiss, dass das nicht echt ist. */
    z.beispiel = true;
    z.stand = Date.now();
    return z;
  }

  return { erzeugen };

})();
