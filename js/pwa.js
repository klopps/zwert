// Service-Worker-Registrierung, Update-Hinweis und Installationshinweise.
// Es werden weder Cookies noch localStorage/sessionStorage verwendet.

const standalone =
  window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

function banner(text, actionLabel, onAction) {
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.className = 'update-banner off-print';
  const p = document.createElement('p');
  p.textContent = text;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn';
  btn.textContent = actionLabel;
  btn.addEventListener('click', onAction);
  el.append(p, btn);
  document.body.append(el);
}

// Neu laden nur, wenn der Nutzer das Update selbst angestoßen hat (nicht bei Erstinstallation).
let updateAngefordert = false;

function zeigeUpdateHinweis(worker) {
  banner('Neue Version verfügbar.', 'Aktualisieren', () => {
    updateAngefordert = true;
    worker.postMessage('SKIP_WAITING');
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      if (reg.waiting && navigator.serviceWorker.controller) zeigeUpdateHinweis(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const neu = reg.installing;
        neu?.addEventListener('statechange', () => {
          if (neu.state === 'installed' && navigator.serviceWorker.controller) zeigeUpdateHinweis(neu);
        });
      });
      let neuGeladen = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!updateAngefordert || neuGeladen) return;
        neuGeladen = true;
        location.reload();
      });
    } catch (err) {
      console.warn('Service Worker nicht registriert:', err);
    }
  });
}

// Installations-Link im Footer (nur auf der Kalkulator-Seite, nicht im Standalone-Modus).
// Er ist immer sichtbar, weil nicht jeder Browser einen Installationsdialog anbietet
// (iOS und Firefox nie, Chrome nur unter HTTPS und nur wenn die App installierbar ist).
// Gibt es den Dialog (beforeinstallprompt), öffnet der Klick ihn, sonst erscheint eine Anleitung.
const hint = document.getElementById('install-hint');
if (hint && !standalone) {
  const btn = document.getElementById('install-btn');
  const help = document.getElementById('install-help');

  const ua = navigator.userAgent;
  const istIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const istSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);

  let anleitung = 'Browser-Menü (⋮) öffnen, dann „App installieren“ oder „Zum Startbildschirm hinzufügen“.';
  if (istIOS) {
    anleitung = 'Teilen-Symbol antippen, dann „Zum Home-Bildschirm“.';
    if (!istSafari) anleitung += ' Fehlt die Option, die Seite in Safari öffnen.';
  }

  hint.hidden = false;

  let angebot = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    angebot = e;
  });

  btn.addEventListener('click', async () => {
    if (angebot) {
      angebot.prompt();
      await angebot.userChoice;
      angebot = null;
      hint.hidden = true;
    } else {
      help.textContent = anleitung;
      help.hidden = false;
    }
  });

  window.addEventListener('appinstalled', () => {
    hint.hidden = true;
    help.hidden = true;
  });
}
