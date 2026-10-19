// ============================================================
// main.js — Arranque de la aplicación.
// ============================================================

import { openDB } from './store/db.js';
import { ensureSeed } from './data/seed.js';
import { startRouter } from './router.js';
import { h, mount } from './ui/dom.js';

async function boot() {
  const app = document.getElementById('app');
  try {
    await openDB();
    await ensureSeed();        // carga mazos de secundaria la primera vez
    startRouter();
    registerSW();
  } catch (err) {
    console.error('No se pudo iniciar StudyFlow:', err);
    mount(app, h('div', { class: 'content' }, [
      h('div', { class: 'empty' }, [
        h('h3', {}, 'No se pudo iniciar StudyFlow'),
        h('p', {}, 'Tu navegador podría estar bloqueando el almacenamiento local (IndexedDB). ' +
          'Prueba en una ventana normal (no privada) y permite el almacenamiento del sitio.'),
        h('p', { class: 'muted' }, String(err && err.message || err)),
      ]),
    ]));
  }
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return; // el SW requiere http(s)/localhost
  const reg = () => navigator.serviceWorker.register('sw.js').catch((e) => {
    console.warn('No se registró el service worker (la app sigue funcionando):', e);
  });
  // Registra ya si la página terminó de cargar; si no, al terminar.
  if (document.readyState === 'complete') reg();
  else window.addEventListener('load', reg, { once: true });
}

boot();
