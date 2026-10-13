# Z-Wert-Kalkulator

Webtool zur Berechnung der Skibindungseinstellung nach DIN/ISO 11088. Aus Körpergewicht, Körpergröße, Sohlenlänge, Alter und Fahrertyp berechnet es den **Z-Wert** sowie die Auslösemomente **Mz** (Drehung) und **My** (Vorwärtsneigung).

Live: [www.bindungseinstellung.de](https://www.bindungseinstellung.de)

> **Hinweis:** Für die berechneten Werte wird keinerlei Gewähr übernommen. Die Bindung sollte immer von einem Fachbetrieb mit dem passenden Skischuh eingestellt und gemessen werden. Der Kalkulator dient zur Kontrolle, nicht als Ersatz.

## Eigenschaften

- **Nur HTML und JavaScript:** Kein Node, kein Build. Die Dateien werden so ausgeliefert, wie sie vorliegen.
- **Mobile First:** Entworfen für Smartphones ab 320 px Breite, skaliert auf Tablet und Desktop.
- **Eigenes schlankes CSS:** Eine Datei (`app.css`, rund 9 KB), kein Framework.
- **PWA, offline lauffähig:** Installierbar auf Android und iOS, nach dem ersten Besuch ohne Internetverbindung nutzbar.
- **Keine Cookies:** Kein Tracking, keine Analyse, keine Drittanbieter. Eingaben verlassen das Gerät nicht und werden nicht gespeichert.
- **Datenschutzerklärung:** Eigene Seite, ebenfalls offline verfügbar.
- **Hinweis außerhalb der Norm:** Sieht die Norm für Gewicht, Größe und Sohlenlänge keinen Wert vor, wird der nächstliegende Tabellenwert angezeigt und ausdrücklich als „außerhalb der Norm“ gekennzeichnet.
- **Druckansicht:** Protokoll mit Feldern für Name, Datum und Unterschrift.

## Installation als App

**Android (Chrome):** Seite öffnen, Menü ⋮ → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“.

**iOS (Safari):** Seite öffnen, Teilen-Symbol → „Zum Home-Bildschirm“. Unter iOS funktioniert die Installation nur über Safari.

Beim ersten Öffnen mit Internetverbindung lädt die App alle Seiten in den Gerätespeicher. Danach läuft sie auch ohne Netz.

## Entwicklung

Es wird nur ein statischer Webserver benötigt, weil Service Worker und ES-Module nicht über `file://` laufen. Zum Beispiel mit Python:

```sh
python -m http.server 8080
```

| Adresse | Zweck |
|---|---|
| `http://localhost:8080/` | App |
| `http://localhost:8080/?debug=1` | App mit Button „Beispiel“ |
| `http://localhost:8080/test/` | Tests der Berechnung (Titel `OK` oder `FEHLER`) |

### Projektstruktur

```
index.html, info.html, impressum.html, datenschutz.html
app.css                Styling
app.webmanifest        PWA-Manifest
sw.js                  Service Worker
js/zcalc.js            Berechnung (ohne DOM)
js/ui.js               Formular und Ausgabe
js/pwa.js              Service-Worker-Registrierung, Hinweise
fonts/ icons/ images/
test/                  Browser-Tests mit Vergleich gegen den Legacy-Code
legacy/                Altstand von 2015 (Referenz)
```

### Änderungen veröffentlichen

1. Dateien ändern. Die Kopf- und Fußbereiche stehen in allen vier Seiten und müssen überall angepasst werden.
2. Neue Dateien in die Liste `PRECACHE` in `sw.js` eintragen.
3. `VERSION` in `sw.js` erhöhen, damit Geräte den neuen Stand laden.
4. Alles auf einen statischen Webserver mit HTTPS legen. Der Server soll keine Cookies setzen.

## Datenschutz

Die App rechnet vollständig im Browser. Es werden keine Cookies gesetzt und keine Eingaben gespeichert oder übertragen. Schriften und alle Dateien kommen vom eigenen Server. Der Service Worker legt die App-Dateien im Cache Storage des Browsers ab, damit sie offline funktioniert. Einzelheiten stehen in der Datenschutzerklärung (`datenschutz.html`). Die Hoster-Angaben dort sind noch mit `TODO:` markiert und müssen vor dem Livegang ergänzt werden.

## Offene Punkte

- Fahrertyp-Verschiebung gegen den Normtext ISO 11088 prüfen (Legacy: Typ 1 = 0, Typ 2 = +1, Typ 3 = +2 Zeilen; andere Quellen: -1/0/+1). 
- Datenschutzerklärung und Impressum rechtlich prüfen lassen (Impressum nennt noch § 5 TMG statt § 5 DDG).
- Test auf echten Android- und iOS-Geräten.

## Lizenz

MIT-Lizenz, Copyright © 2015 Christoph Steindorff. Die Schrift Roboto Condensed (SIL OFL 1.1) ist enthalten.

Hintergrundbild: Ski i Trysil / Ola Matsson, bearbeitet von Christoph Steindorff, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), Quelle: [Flickr](https://www.flickr.com/photos/trysil/5592126846/).
