// Browser-Tests ohne Framework und ohne Node. Ergebnis steht im DOM (#out, #summary).
import { berechneZWert, erlaubteFahrertypen, isNumber } from '../js/zcalc.js';

const out = document.getElementById('out');
let fehler = 0;
let anzahl = 0;

function gleich(ist, soll, msg = '') {
  if (JSON.stringify(ist) !== JSON.stringify(soll)) {
    throw new Error(`${msg} erwartet ${JSON.stringify(soll)}, erhalten ${JSON.stringify(ist)}`);
  }
}

async function test(name, fn) {
  anzahl++;
  const li = document.createElement('li');
  try {
    await fn();
    li.className = 'ok';
    li.textContent = `OK ${name}`;
  } catch (e) {
    fehler++;
    li.className = 'fail';
    li.textContent = `FEHLER ${name}: ${e.message}`;
  }
  out.append(li);
}

const snapshot = await (await fetch('fixtures/legacy-snapshot.json')).json();

await test(`Characterization: ${snapshot.length} Fälle wie Legacy-getZWert()`, () => {
  const abweichungen = [];
  for (const [gewicht, groesse, sohlenlaenge, fahrertyp, alter, erwartet] of snapshot) {
    const r = berechneZWert({ gewicht, groesse, sohlenlaenge, fahrertyp, alter });
    const ist = r ? [r.zwert, r.mz, r.my] : -1;
    // Bekannte Abweichung: leere Normzelle Zeile 4/Spalte 5 (Legacy: undefined) wird jetzt wie
    // die anderen leeren Zellen auf den Rand der Zeile gesetzt (1,5) und als außerhalb der Norm markiert.
    const legacyFehlzelle = Array.isArray(erwartet) && erwartet.includes(null);
    const soll = legacyFehlzelle ? [1.5, 20, 75] : erwartet;
    if (JSON.stringify(ist) !== JSON.stringify(soll)) abweichungen.push([gewicht, groesse, sohlenlaenge, fahrertyp, alter, ist, erwartet]);
  }
  gleich(abweichungen.slice(0, 5), []);
});

await test('Beispielwerte (65 kg, 175 cm, 285 mm, 16 J., Typ 2)', () => {
  gleich(berechneZWert({ gewicht: 65, groesse: 175, sohlenlaenge: 285, fahrertyp: 2, alter: 16 }), { zwert: 6, mz: 50, my: 194, ausserhalbNorm: false });
});

await test('Gewichtsausnahmen', () => {
  gleich(erlaubteFahrertypen(12), [1]);
  gleich(erlaubteFahrertypen(21), [1, 2]);
  gleich(erlaubteFahrertypen(22), [1, 2, 3]);
  gleich(berechneZWert({ gewicht: 12, groesse: 120, sohlenlaenge: 220, fahrertyp: 2, alter: 6 }), null);
  gleich(berechneZWert({ gewicht: 9, groesse: 120, sohlenlaenge: 220, fahrertyp: 1, alter: 6 }), null);
});

await test('Ungültige Eingaben liefern null', () => {
  const ok = { gewicht: 65, groesse: 175, sohlenlaenge: 285, fahrertyp: 2, alter: 16 };
  for (const feld of Object.keys(ok)) {
    gleich(berechneZWert({ ...ok, [feld]: NaN }), null, feld);
    gleich(berechneZWert({ ...ok, [feld]: undefined }), null, feld);
  }
  gleich(berechneZWert({ ...ok, fahrertyp: 4 }), null);
  gleich(berechneZWert({ ...ok, fahrertyp: 0 }), null);
});

await test('Leere Normzellen: Wert vom Zeilenrand, ausserhalbNorm = true', () => {
  const f = (gewicht, groesse, sohlenlaenge, fahrertyp, alter) =>
    berechneZWert({ gewicht, groesse, sohlenlaenge, fahrertyp, alter });
  // Zeile 4 (26-30 kg), Sohle > 330 mm: Norm leer, Rand der Zeile = 1,5
  gleich(f(30, 148, 331, 1, 30), { zwert: 1.5, mz: 20, my: 75, ausserhalbNorm: true });
  // Zeile 0 (10-13 kg), Sohle 300 mm: Norm leer, Rand der Zeile = 0,75
  gleich(f(12, 120, 300, 1, 30), { zwert: 0.75, mz: 8, my: 29, ausserhalbNorm: true });
  // Zeile 7 (42-48 kg), Sohle <= 250 mm: Norm leer, Rand der Zeile = 3,5
  gleich(f(45, 140, 240, 1, 30), { zwert: 3.5, mz: 31, my: 120, ausserhalbNorm: true });
  // Zeile 12 (95+ kg, 195+ cm), Sohle <= 270 mm: Norm leer, Rand der Zeile = 8,5
  gleich(f(100, 200, 260, 1, 30), { zwert: 8.5, mz: 67, my: 271, ausserhalbNorm: true });
});

await test('Belegte Normzellen sind nicht markiert', () => {
  const r = berechneZWert({ gewicht: 31, groesse: 140, sohlenlaenge: 331, fahrertyp: 1, alter: 30 });
  gleich(r, { zwert: 1.75, mz: 23, my: 87, ausserhalbNorm: false });
  gleich(berechneZWert({ gewicht: 100, groesse: 200, sohlenlaenge: 280, fahrertyp: 1, alter: 30 }).ausserhalbNorm, false);
});

await test('isNumber', () => {
  gleich([isNumber(5), isNumber('5'), isNumber(NaN), isNumber(''), isNumber(undefined)], [true, true, false, false, false]);
});

document.getElementById('summary').textContent = fehler ? `${fehler} von ${anzahl} fehlgeschlagen` : `Alle ${anzahl} Tests bestanden`;
document.title = fehler ? 'FEHLER' : 'OK';
