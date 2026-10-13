/**
 * Z-Wert Kalkulator: Berechnungskern (ohne DOM).
 *
 * @author Christoph Steindorff <christoph@steindorff.de>
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Christoph Steindorff <christoph@steindorff.de>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/** Obere Gewichtsgrenzen (kg) der Tabellenzeilen 0..11; darüber Zeile 12. */
const GEWICHTSZEILE = [13, 17, 21, 25, 30, 35, 41, 48, 57, 66, 78, 94];
/** Obere Größengrenzen (cm) der Tabellenzeilen 7..11; darüber Zeile 12. */
const GROESSENZEILE = [148, 157, 166, 178, 194];
/** Obere Sohlenlängengrenzen (mm) der Spalten 0..4; darüber Spalte 5. */
const SOHLENSPALTE = [250, 270, 290, 310, 330];

/**
 * Z-Wert je Zeile (Skifahrer-Code) und Sohlenlängen-Spalte, wie in ISO 11088.
 * null = leere Normzelle (Kombination ist in der Norm nicht vorgesehen).
 * Für solche Zellen gibt berechneZWert() den nächstliegenden Wert der Zeile zurück
 * und kennzeichnet das Ergebnis mit ausserhalbNorm = true.
 */
const ZWERTTABELLE = [
  [0.75, 0.75, null, null, null, null],
  [1, 1, 0.75, null, null, null],
  [1.5, 1.25, 1, null, null, null],
  [1.75, 1.5, 1.5, 1.25, null, null],
  [2.25, 2, 1.75, 1.5, 1.5, null],
  [2.75, 2.5, 2.25, 2, 1.75, 1.75],
  [3.5, 3, 2.75, 2.5, 2.25, 2],
  [null, 3.5, 3, 3, 2.75, 2.5],
  [null, 4.5, 4, 3.5, 3.5, 3],
  [null, 5.5, 5, 4.5, 4, 3.5],
  [null, 6.5, 6, 5.5, 5, 4.5],
  [null, 7.5, 7, 6.5, 6, 5.5],
  [null, null, 8.5, 8, 7, 6.5],
  [null, null, 10, 9.5, 8.5, 8],
  [null, null, 11.5, 11, 10, 9.5],
];

/** Auslösewerte je Zeile: [Drehung Mz in Nm, Vorwärtsneigung My in Nm]. */
const AUSLOESEWERTE = [
  [8, 29], [11, 40], [14, 52], [17, 64], [20, 75], [23, 87], [27, 102],
  [31, 120], [37, 141], [43, 165], [50, 194], [58, 229], [67, 271],
  [78, 320], [91, 380], [105, 452], [118, 540],
];

export const FAHRERTYPEN = { 1: 'Anfänger', 2: 'Fortgeschritten', 3: 'Könner' };

/** Ist n eine endliche Zahl? */
export function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/** Index des ersten Grenzwerts, der value aufnimmt; sonst grenzen.length. */
function bucket(value, grenzen) {
  const i = grenzen.findIndex((g) => value <= g);
  return i === -1 ? grenzen.length : i;
}

/**
 * Fahrertypen, die bei gegebenem Gewicht zulässig sind (Norm-Ausnahmen).
 * @param {number} gewicht Körpergewicht in kg
 * @returns {number[]} z. B. [1], [1, 2] oder [1, 2, 3]
 */
export function erlaubteFahrertypen(gewicht) {
  if (gewicht < 13) return [1];
  if (gewicht < 22) return [1, 2];
  return [1, 2, 3];
}

/**
 * Z-Wert und Auslösemomente nach DIN/ISO 11088.
 *
 * @param {object} p
 * @param {number} p.gewicht Körpergewicht in kg
 * @param {number} p.groesse Körpergröße in cm
 * @param {number} p.sohlenlaenge Sohlenlänge des Skischuhs in mm
 * @param {number} p.fahrertyp 1 Anfänger, 2 Fortgeschritten, 3 Könner
 * @param {number} p.alter Alter in Jahren
 * @returns {{zwert: number, mz: number, my: number, ausserhalbNorm: boolean} | null}
 *   null, wenn keine Berechnung möglich ist. ausserhalbNorm ist true, wenn die Norm für
 *   die Kombination aus Zeile und Sohlenlänge keinen Wert vorsieht; zwert ist dann der
 *   nächstliegende Wert derselben Zeile (Rand der Tabelle).
 */
export function berechneZWert({ gewicht, groesse, sohlenlaenge, fahrertyp, alter }) {
  if (![gewicht, groesse, sohlenlaenge, fahrertyp, alter].every(isNumber)) return null;
  if (![1, 2, 3].includes(Number(fahrertyp))) return null;
  if (!erlaubteFahrertypen(gewicht).includes(Number(fahrertyp))) return null;

  gewicht = Math.round(gewicht);
  groesse = Math.round(groesse);
  sohlenlaenge = Math.round(sohlenlaenge);
  alter = Math.round(alter);
  if (gewicht < 10) return null;

  // Zeile nach Gewicht (0..12) und nach Größe (7..12); die kleinere zählt.
  const zeileGewicht = bucket(gewicht, GEWICHTSZEILE);
  const zeileGroesse = bucket(groesse, GROESSENZEILE) + 7;
  let zeile = Math.min(zeileGewicht, zeileGroesse);

  // Fahrertyp: Anfänger +0, Fortgeschritten +1, Könner +2.
  zeile += Number(fahrertyp) - 1;

  // Alter unter 10 oder ab 50: eine Zeile niedriger.
  if (zeile > 0 && (alter >= 50 || alter < 10)) zeile -= 1;

  const spalte = bucket(sohlenlaenge, SOHLENSPALTE);
  const werte = ZWERTTABELLE[zeile];
  const ausloese = AUSLOESEWERTE[zeile];
  if (!werte || !ausloese) return null;

  // Leere Normzellen liegen immer am Rand der Zeile: auf die nächste belegte Spalte klemmen.
  const erste = werte.findIndex((w) => w !== null);
  const letzte = werte.length - 1 - [...werte].reverse().findIndex((w) => w !== null);
  const genutzt = Math.min(Math.max(spalte, erste), letzte);

  return {
    zwert: werte[genutzt],
    mz: ausloese[0],
    my: ausloese[1],
    ausserhalbNorm: werte[spalte] === null,
  };
}
