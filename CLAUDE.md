# CLAUDE.md

Anweisungen für Claude Code im Projekt **Z-Wert-Kalkulator**. Projektsprache: Deutsch (UI, Texte, Doku, Commit-Messages). Code-Bezeichner und Code-Kommentare: Deutsch oder Englisch wie im umgebenden Code. Die Domänenbegriffe (`zwert`, `sohlenlaenge`, `fahrertyp`) bleiben erhalten.

## Zweck

Webtool zur Berechnung der Skibindungseinstellung (Z-Wert und Auslösemomente Mz/My) nach DIN/ISO 11088. Aus Körpergewicht, Körpergröße, Sohlenlänge, Alter und Fahrertyp (1 Anfänger, 2 Fortgeschritten, 3 Könner) ergeben sich Z-Wert, Mz (Drehung) und My (Vorwärtsneigung). Veröffentlichung: www.bindungseinstellung.de.

## Verbindliche Anforderungen

1. **Nur HTML, CSS und JavaScript. Kein Node, kein npm, kein Build-Schritt.** Das Projekt besteht aus statischen Dateien, die so ausgeliefert werden, wie sie im Repository liegen. Keine `package.json`, keine Bundler, keine Templating-Skripte, keine generierten Dateien. Einmalige Hilfswerkzeuge (z. B. Bildkonvertierung) gehören nicht ins Projekt.
2. **Mobile First.** Die Basis-Styles gelten für kleinste Viewports (ab 320 px). Breitere Layouts nur über `min-width`-Media-Queries, bisher ist keine nötig (die Seite ist auf 32 rem Breite begrenzt). Touch-Ziele mindestens 44×44 px. Numerische Felder mit `inputmode="numeric"`, Schriftgröße mindestens 16 px (sonst zoomt iOS beim Fokus).
3. **Eigenes, schlankes CSS** in einer Datei, `app.css` (rund 9 KB, ohne Framework und ohne Build). Semantische Klassennamen (`.card`, `.row`, `.btn`, …), Design-Werte als Variablen in `:root`. Kein Tailwind, kein Bootstrap, kein jQuery, keine CSS-Präprozessoren.
4. **PWA, vollständig offline** auf Android (Chrome) und iOS (Safari, „Zum Home-Bildschirm“). Siehe Abschnitt PWA.
5. **Keine Cookies.** Weder `Set-Cookie` noch `document.cookie`. Auch kein `localStorage`, `sessionStorage` oder IndexedDB für Nutzerdaten. Kein Tracking, keine Analytics, kein Consent-Banner.
6. **Datenschutzerklärung** als Seite `datenschutz.html`, aus jeder Seite verlinkt (Footer), im Precache, offline lesbar. Das Impressum verweist darauf.
7. **Keine externen Requests zur Laufzeit.** Schrift Roboto Condensed (WOFF2) liegt in `fonts/`. Alle Assets same-origin.

## Dateistruktur

```
index.html  info.html  impressum.html  datenschutz.html   Seiten (jeweils vollständiges HTML)
app.css                  gesamtes Styling (Basis, Bausteine, Formular, Textseiten, Druck)
manifest.webmanifest     PWA-Manifest
sw.js                    Service Worker (Precache-Liste und VERSION von Hand pflegen)
js/zcalc.js              Berechnung, reine Funktionen, kein DOM (ES-Modul)
js/ui.js                 Formular, Ausgabe (nur index.html)
js/pwa.js                SW-Registrierung, Update- und Installationshinweis
fonts/ icons/ images/    Assets
test/index.html          Browser-Tests (ohne Framework), test/zcalc.test.js, test/fixtures/
legacy/                  Altstand 2015 zur Referenz (nicht ausliefern, nicht pflegen)
```

Es gibt kein Layout-Template: `<head>`, Header-Navigation und Footer stehen in allen vier Seiten. Änderungen daran in **allen vier** Dateien nachziehen. Aktive Navigation: `aria-current="page"` am passenden Link.

`zcalc.js` kennt kein DOM und schreibt keine Debug-Ausgaben. `ui.js` kennt keine Tabellen.

## Lokal starten und testen

Service Worker und ES-Module brauchen `http://localhost`, `file://` genügt nicht. Beliebiger statischer Server, zum Beispiel:

```sh
python -m http.server 8080
```

- App: `http://localhost:8080/`, Debug-Modus mit Beispiel-Button: `/?debug=1`
- Tests: `http://localhost:8080/test/`. Der Titel der Seite ist `OK` oder `FEHLER`, Details stehen in der Seite.

## Berechnungslogik: besondere Sorgfalt

Sicherheitsrelevant (Fehleinstellung kann zu Verletzungen führen). Änderungen an Tabellen oder Regeln nur mit Test und Nachweis gegen die Norm.

`test/fixtures/legacy-snapshot.json` enthält 65.520 Ergebnisse des Legacy-Codes (Raster aus Gewicht, Größe, Sohle, Typ, Alter). Die Tests belegen, dass `js/zcalc.js` identisch rechnet. Das Skript, das den Snapshot erzeugt hat, liegt in `legacy/make-snapshot.cjs` (braucht einmalig Node, gehört nicht zum System).

Regeln (aus Legacy übernommen):

- Eingaben auf ganze Zahlen runden. Gewicht < 10 kg: kein Ergebnis. Gewicht < 13 kg: nur Typ 1. Gewicht < 22 kg: höchstens Typ 2.
- Zeile = Minimum aus Gewichtszeile (0..12) und Größenzeile (7..12). Dann Fahrertyp +0/+1/+2, dann Alter < 10 oder ≥ 50: −1 (nur wenn Zeile > 0).
- Spalte nach Sohlenlänge, Grenzen 250/270/290/310/330 mm, darüber letzte Spalte.

**Leere Normzellen:** Die Norm (ISO 11088, laut craftski.de und snow-online.de) hat in der Z-Wert-Tabelle leere Zellen, vor allem bei leichten Fahrern mit langer Sohle und bei schweren Fahrern mit kurzer Sohle. `ZWERTTABELLE` bildet sie als `null` ab. Für solche Kombinationen gibt `berechneZWert()` trotzdem einen Wert aus: den nächstliegenden belegten Wert derselben Zeile. Das Ergebnis trägt `ausserhalbNorm: true`, und `ui.js` zeigt den Hinweis `#hinweis-norm` („Außerhalb der Norm … Fachbetrieb prüfen lassen“). Der Hinweis erscheint auch im Ausdruck. Das ist Entscheidung des Betreibers, nicht der Norm. Die Auffüll-Regel (Wert vom Rand der Zeile) ist nicht normativ.

**Offene Punkte, vor Release klären** (Vergleich mit skibindung-einstellen.de, craftski.de und snow-online.de, Stand 2026-10-13): (1) Fahrertyp-Verschiebung: Legacy rechnet Typ 1 = 0, Typ 2 = +1, Typ 3 = +2 Zeilen. Der Rechner auf skibindung-einstellen.de rechnet Typ 1 = −1, Typ 2 = 0, Typ 3 = +1. Das entscheidet über jeden Z-Wert. Nur mit dem Normtext klärbar. (2) Die Tabelle auf skibindung-einstellen.de ist ab Zeile 42–48 kg um eine Spalte nach links verrutscht und gilt nicht als Referenz. (3) Zeile 22–25 kg, Sohle 291–310 mm: unsere Tabelle und snow-online.de haben 1,25, skibindung-einstellen.de hat 1,00; craftski.de hat für Gewichte unter 36 kg keine Werte.

Weitere Abweichungen vom Legacy-Code (bewusst): Die leere Normzelle Zeile 4/Spalte 5 liefert jetzt wie alle leeren Normzellen einen Randwert (1,5) mit Hinweis statt `undefined`. Fahrertyp außerhalb 1..3 liefert kein Ergebnis (die Legacy-Prüfung mit `$.inArray(...) === false` griff nie). Leeres Gewichtsfeld schränkt die Fahrertypen nicht ein (Legacy: wie 0 kg, nur Typ 1).

## UI-Verhalten

- Berechnung bei jeder Eingabeänderung, kein Absenden-Button.
- Typ 2 und 3 werden je nach Gewicht ausgeblendet; die Auswahl wird bei Bedarf korrigiert.
- Ausgabe Z-Wert, Mz und My in Nm. Bei unvollständiger oder ungültiger Eingabe bleibt die Ausgabe leer. Liegt die Kombination außerhalb der Norm (leere Normzelle), erscheint zusätzlich der Hinweis `#hinweis-norm`.
- Druckansicht über `@media print` in `app.css` (`.off-print` blendet aus, `.on-print` und `.protokoll` blenden ein): Titel „Skibindungseinstellung nach DIN/ISO 11088“, Felder für Name, Datum, Unterschrift, Fußzeile `www.bindungseinstellung.de`. Navigation und Hinweise ausgeblendet.
- `?debug=1` blendet den Button „Beispiel“ ein (65 kg, 175 cm, 285 mm, 16 Jahre, Typ 2).
- Eingaben werden nicht gespeichert.

## CSS

- Ein Stylesheet, `app.css`, nach Abschnitten gegliedert: Schriften, Variablen, Seitengerüst, Bausteine, Formular und Ergebnis, Textseiten, Druck. Neue Regeln in den passenden Abschnitt.
- Klassen benennen, was etwas ist (`.card`, `.row`, `.value`), nicht wie es aussieht. Keine Utility-Klassen in den Seiten.
- Hilfsklassen mit festem Zweck: `.sr-only` (nur für Screenreader), `.off-print` und `.on-print` (nur Bildschirm bzw. nur Druck), `[hidden]` blendet immer aus.
- Der Hintergrund (Farbe und Bild) steht am `body`. Nicht zusätzlich an `html` setzen, sonst entsteht über dem Bild ein weißer Streifen.
- Abstände über `padding` statt über Außenabstand am ersten Element, wegen Margin-Kollaps.
- Von JS erzeugte Elemente (Ausgabe-Badge, Update-Leiste) nutzen dieselben Klassen (`.badge`, `.update-banner`).

## PWA-Regeln

- `app.webmanifest`: `start_url` und `scope` relativ, Icons `icons/android-chrome-192x192.png` und `-512x512.png` (ein maskable-Icon gibt es noch nicht; Chrome nutzt sonst das normale Icon mit weißem Rand). iOS: `apple-touch-icon` und `apple-mobile-web-app-*` Meta-Tags in jedem `<head>`, `viewport-fit=cover` mit Safe-Area-Abständen.
- Installations-Link „Z-Wert als Offline-App installieren“ im Footer von `index.html`, optisch wie die Links zu Datenschutz und Impressum (`.link-btn`), ohne Schließen-Schaltfläche. Er ist **immer sichtbar**, außer im Standalone-Modus, weil nicht jeder Browser ein `beforeinstallprompt` feuert (iOS und Firefox nie, Chrome nur unter HTTPS und wenn die App installierbar ist). Mit Ereignis öffnet der Klick den Installationsdialog, sonst zeigt er eine Anleitung (iOS: „Teilen-Symbol antippen, dann „Zum Home-Bildschirm““, sonst Browser-Menü → „App installieren“ / „Zum Startbildschirm hinzufügen“).
- `sw.js` im Root. **Jede Datei, die offline gebraucht wird, muss in `PRECACHE` stehen.** Strategie: cache-first (`ignoreSearch`, damit `?debug=1` trifft), bei Navigation ohne Treffer Fallback auf `index.html`.
- **Bei jeder Änderung an einer gecachten Datei `VERSION` in `sw.js` erhöhen**, sonst sehen Nutzer den alten Stand. Alte Caches (`zwert-*`) werden beim Aktivieren gelöscht.
- Updates: Ein neuer Service Worker wartet. `js/pwa.js` zeigt einen Hinweis „Neue Version verfügbar“; erst nach Klick auf „Aktualisieren“ wird aktiviert und neu geladen.
- Nur Cache Storage und Service Worker. Keine Cookies.

## Datenschutz

- Keine Cookies, kein Web-Storage, kein Fingerprinting, keine Drittanbieter-Requests. Beim Hosting prüfen, dass der Server keine Cookies setzt (z. B. Sticky-Session- oder CDN-Cookies).
- `datenschutz.html` nennt Verantwortlichen, Server-Logfiles, keine Cookies, Service Worker und Cache Storage (§ 25 Abs. 2 Nr. 2 TDDDG, technisch erforderlich), lokale Schriften, Betroffenenrechte, Aufsichtsbehörde Niedersachsen.
- Die Seite enthält eine mit `TODO:` markierte Stelle (Hoster, Speicherdauer der Logs, AV-Vertrag). **Vor dem Livegang ausfüllen und die Erklärung rechtlich prüfen lassen.** Nicht raten.
- Das Impressum enthält die Privatanschrift des Betreibers. Nicht ohne Auftrag ändern. Es nennt noch „§ 5 TMG“ (inzwischen § 5 DDG) und den Haftungsausschluss nach TMG; Texte unverändert gelassen, Aktualisierung mit dem Betreiber klären.

## Barrierefreiheit und Qualität

- `<label for>` zu jedem Eingabefeld, `fieldset`/`legend` für den Fahrertyp, `aria-live="polite"` am Ergebnis, dekorative Icons mit `alt=""`, `lang="de"`, Kontrast mindestens WCAG AA, sichtbarer Fokus.
- Lizenz MIT, Copyright Christoph Steindorff (Header in `js/zcalc.js` erhalten). Bildnachweis des Hintergrundbilds (Ola Matsson, CC BY 2.0) im Impressum erhalten. Roboto Condensed steht unter der SIL OFL.
- Inhalte (Texte in `info.html`, Impressum) nur im Markup ändern, nicht inhaltlich. Textvorschläge getrennt machen.

## Verifikation vor „fertig“

1. `test/` im Browser öffnen: Titel `OK`.
2. App über `http://localhost` öffnen, Rechnung mit `/?debug=1` und Beispiel prüfen.
3. DevTools → Application: Service Worker aktiv, Cache `zwert-<VERSION>` gefüllt, Manifest ohne Fehler, Cookies leer, Storage leer.
4. Server beenden oder „Offline“ setzen, alle vier Seiten laden, rechnen.
5. Viewport 320 und 390 px: kein horizontales Scrollen. Druckvorschau prüfen.
6. Real auf Android Chrome und iOS Safari testen (Installation, Offline-Start, Standalone). Nicht getestet? Im Ergebnis so sagen.
