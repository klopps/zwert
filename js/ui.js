import { berechneZWert, erlaubteFahrertypen, FAHRERTYPEN } from './zcalc.js';

const $ = (id) => document.getElementById(id);

/** Wert aus einem Zahlenfeld lesen (wie Legacy: ganzzahlig, sonst NaN). */
function zahl(id) {
  return parseInt($(id).value, 10);
}

function fahrertyp() {
  const checked = document.querySelector('input[name="fahrertyp"]:checked');
  return checked ? parseInt(checked.value, 10) : NaN;
}

function setzeFahrertyp(typ) {
  $(`fahrertyp${typ}`).checked = true;
}

/** Fahrertypen je nach Gewicht ein-/ausblenden und Auswahl korrigieren. */
function wendeGewichtsregelnAn(gewicht) {
  const erlaubt = Number.isNaN(gewicht) ? [1, 2, 3] : erlaubteFahrertypen(gewicht);
  for (const typ of [1, 2, 3]) {
    const option = document.querySelector(`label[data-typ="${typ}"]`);
    option.hidden = !erlaubt.includes(typ);
  }
  let typ = fahrertyp();
  if (!erlaubt.includes(typ)) {
    typ = Math.max(...erlaubt);
    setzeFahrertyp(typ);
  }
  return typ;
}

function zeige(el, text) {
  el.textContent = '';
  if (text === null) return;
  const span = document.createElement('span');
  span.className = 'badge';
  span.textContent = text;
  el.append(span);
}

export function berechnen() {
  const gewicht = zahl('gewicht');
  const typ = wendeGewichtsregelnAn(gewicht);
  $('fahrertyptext').textContent = FAHRERTYPEN[typ] ?? '';

  const r = berechneZWert({
    gewicht,
    groesse: zahl('groesse'),
    sohlenlaenge: zahl('sohlenlaenge'),
    fahrertyp: typ,
    alter: zahl('alter'),
  });

  zeige($('zwert'), r ? String(r.zwert) : null);
  zeige($('ausloesewertmz'), r ? `${r.mz} Nm` : null);
  zeige($('ausloesewertmy'), r ? `${r.my} Nm` : null);
  $('hinweis-norm').hidden = !(r && r.ausserhalbNorm);
}

function beispiel() {
  $('gewicht').value = 65;
  $('groesse').value = 175;
  $('sohlenlaenge').value = 285;
  $('alter').value = 16;
  setzeFahrertyp(2);
  berechnen();
}

$('rechner').addEventListener('input', berechnen);
$('rechner').addEventListener('change', berechnen);
$('drucken').addEventListener('click', () => {
  berechnen();
  window.print();
});

// Debug-Modus (index.html?debug=1): Beispiel-Button einblenden.
if (new URLSearchParams(location.search).has('debug')) {
  $('beispiel').hidden = false;
  $('beispiel').addEventListener('click', beispiel);
}

berechnen();
