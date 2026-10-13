/**
* z-Wert Kalkulator
*
* @author: Christoph Steindorff <christoph@steindorff.de>
* @version: 1.0
*
* The MIT License (MIT)
* 
* Copyright (c) 2015 Christoph Steindorff <christoph@steindorff.de>

* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:

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

/**
* Ist n eine Zahl?
* @param n Zu untersuchender Wert
* @return bool
*/
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
* Berechnung des Z-Werts und der Auslösemomente zur Skibindungseinstellung gemäß DIN/ISO 11088
*
* @param gewicht Körpergewicht des Skifahrers in kg
* @param groesse Körpergröße des Skifahrers in cm
* @param sohlenlaenge Länge der Skischuhsohle in mm
* @param fahrertyp 1,2 oder 3
* @param alter Alter des Skifahrers in Jahren
* @return array | -1 Ein Array bestehend aus Z-Wert, Auslösewert Mz, Auslösewert My oder -1, wenn eine Berechnung nicht möglich ist
*/
function getZWert(gewicht, groesse, sohlenlaenge, fahrertyp, alter) {
	
	var zwert = -1;
	var zeile = -1;
	var zeile1 = -1;
	var zeile2 = -1;
	var spalte = -1;
	
	var gewichtszeile = [13, 17, 21, 25, 30, 35, 41, 48, 57, 66, 78, 94];
	var groessenzeile = [148, 157, 166, 178, 194];
	var sohlenspalte = [250, 270, 290, 310, 330];
	
	var zwerttabelle = [[ 0.75,  0.75,  0.75,  0.75,  0.75,  0.75], 
						[ 1.00,  1.00,  0.75,  0.75,  0.75,  0.75], 
						[ 1.50,  1.25,  1.00,  1.00,  1.00,  1.00], 
						[ 1.75,  1.50,  1.50,  1.25,  1.25,  1.25], 
						[ 2.25,  2.00,  1.75,  1.50,  1.50,  1.50], 
						[ 2.75,  2.50,  2.25,  2.00,  1.75,  1.75], 
						[ 3.50,  3.00,  2.75,  2.50,  2.25,  2.00], 
						[ 3.50,  3.50,  3.00,  3.00,  2.75,  2.50], 
						[ 4.50,  4.50,  4.00,  3.50,  3.50,  3.00], 
						[ 5.50,  5.50,  5.00,  4.50,  4.00,  3.50], 
						[ 6.50,  6.50,  6.00,  5.50,  5.00,  4.50], 
						[ 7.50,  7.50,  7.00,  6.50,  6.00,  5.50], 
						[ 8.50,  8.50,  8.50,  8.00,  7.00,  6.50], 
						[10.00, 10.00, 10.00,  9.50,  8.50,  8.00], 
						[11.50, 11.50, 11.50, 11.00, 10.00,  9.50]];

	// Drehung Mz in Nm und Vorwärtsneigung My in Nm
	var ausloesewerte = [[ 8, 29], 
						[ 11, 40],
						[ 14, 52],
						[ 17, 64],
						[ 20, 75],
						[ 23, 87],
						[ 27,102],
						[ 31,120],
						[ 37,141],
						[ 43,165],
						[ 50,194],
						[ 58,229],
						[ 67,271],
						[ 78,320],
						[ 91,380],
						[105,452],
						[118,540]];


	// Eingangswerte checken
	if (!isNumber(gewicht)) {
		console.log("Gewicht (" + gewicht + ") ist keine Zahl");
		return -1;
	}
	if (!isNumber(groesse)) {
		console.log("Größe (" + groesse + ") ist keine Zahl");
		return -1;
	}
	if (!isNumber(sohlenlaenge))  {
		console.log("Sohlenlänge (" + sohlenlaenge + ") ist keine Zahl");
		return -1;
	}
	if (!isNumber(fahrertyp)) {
		console.log("Fahrertyp (" + fahrertyp + ") ist keine Zahl");
		return -1;
	}
	if (!isNumber(alter)) {
		console.log("Alter (" + alter + ") ist keine Zahl");
		return -1;
	}
	if ($.inArray(fahrertyp, [1,2,3]) === false) {
		console.log("Fahrertyp (" + fahrertyp + ") ist nicht 1,2 oder 3");
		return -1;
	}

	// Gewichtsausnahmen
	if ((gewicht < 13) && (fahrertyp != 1)) {
		console.log("Bei einem Gewicht von weniger als 13kg kann nur der Fahrertyp 1 gewählt werden.");
		return -1;
	}
	if ((gewicht < 22) && (fahrertyp > 2)) {
		console.log("Bei einem Gewicht von weniger als 22kg kann nur der Fahrertyp 1 oder 2 gewählt werden.");
		return -1;
	}
	
	
	// Werte runden
	gewicht = Math.round(gewicht);
	groesse = Math.round(groesse);
	sohlenlaenge = Math.round(sohlenlaenge);
	alter = Math.round(alter);
	
	// Ermitteln der Tabellenzeile anhand des Gewichts
	if (gewicht < 10) return -1;
	for (var x=0;x < gewichtszeile.length; x++) {
		if (gewicht <= gewichtszeile[x]) {
			zeile1 = x;
			break;
		}
	}
	if (zeile1 == -1) {
		console.log("Gewicht (" + gewicht +") > 94kg");
		zeile1 = 12;
	}
	console.log('Gewichtszeile: ' + zeile1);

	// Ermitteln der Tabellenzeile anhand des Größe
	for (var x=0;x < groessenzeile.length;x++) {
		if (groesse <= groessenzeile[x]) {
			zeile2 = x + 7;
			break;
		}
	}
	if (zeile2 == -1) {
		zeile2 = 12;
	}
	console.log('Größenzeile: ' + zeile2);
	
	
	// Der kleinere Zeilenwert ist der entscheidende
	zeile = Math.min(zeile1, zeile2);
	console.log('kleinste Zeile: ' + zeile);
	
	console.log('Fahrertyp: ' + fahrertyp);
	
	// Fahrertypkorrektur
	if (fahrertyp == 2) { 
		zeile = zeile + 1; // Fortgeschritten
	}
	if (fahrertyp == 3) {
		zeile = zeile + 2; // Könner
	}
	console.log('Zeile mit berücksichtigung des Fahrertyps ' + fahrertyp + ': ' + zeile);
	
	// Alterskorrektur vornehmen
	if ((zeile > 0) && ((alter >= 50) || (alter < 10))) {
		zeile = zeile - 1;
	}
	console.log('Zeile mit berücksichtigung des Alters (' + alter + ' Jahr): ' + zeile);
	
	// Ermitteln der Tabellenspalte anhand der Sohlenlänge
	for (var x=0;x < sohlenspalte.length;x++) {
		if (sohlenlaenge <= sohlenspalte[x]) {
			spalte = x;
			break;
		}
	}
	if (spalte == -1) {
		spalte = 5;
	}
	console.log('Spalte: ' + spalte);
	console.log('Zelle: [' + zeile + "," + spalte + ']');
	zwert = zwerttabelle[zeile][spalte];

	ausloesewertmz = ausloesewerte[zeile][0];
	console.log('Mz: ' + ausloesewertmz);
	ausloesewertmy = ausloesewerte[zeile][1];
	console.log('My: ' + ausloesewertmy);
	
	var ergebnis = [zwert, ausloesewertmz, ausloesewertmy];
	return ergebnis;
}
