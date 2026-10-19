// ============================================================
// router.js — Enrutador mínimo basado en el hash de la URL.
// ============================================================

import { renderShell } from './ui/components.js';
import { h } from './ui/dom.js';

import { homeView } from './views/home.js';
import { decksView } from './views/decks.js';
import { deckDetailView } from './views/deck-detail.js';
import { cardEditorView } from './views/card-editor.js';
import { studyView } from './views/study.js';
import { profileView } from './views/profile.js';
import { transferView } from './views/transfer.js';

export function navigate(path) {
  if (location.hash === path) render();
  else location.hash = path;
}

function parse() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [pathPart] = raw.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  return segments;
}

async function resolve(segments) {
  // segments: p. ej. ['mazo','ID','tarjeta','CID']
  const [a, b, c, d] = segments;

  if (!a) return homeView();
  if (a === 'mazos') return decksView();
  if (a === 'estudiar') return studyView(b || null);          // b = deckId opcional
  if (a === 'perfil') return profileView();
  if (a === 'transferir') return transferView();

  if (a === 'mazo') {
    if (b === 'nuevo') return cardEditorView({ mode: 'new-deck' });
    if (b && c === 'nueva') return cardEditorView({ mode: 'new-card', deckId: b });
    if (b && c === 'tarjeta' && d) return cardEditorView({ mode: 'edit-card', deckId: b, cardId: d });
    if (b) return deckDetailView(b);
  }

  return notFound();
}

function notFound() {
  return h('div', { class: 'empty' }, [
    h('h3', {}, 'Página no encontrada'),
    h('p', {}, 'La ruta no existe.'),
    h('a', { class: 'btn btn-primary', href: '#/' }, 'Ir al inicio'),
  ]);
}

let rendering = false;
export async function render() {
  if (rendering) return;
  rendering = true;
  try {
    const node = await resolve(parse());
    renderShell(node);
  } catch (err) {
    console.error('Error al renderizar la vista:', err);
    renderShell(h('div', { class: 'empty' }, [
      h('h3', {}, 'Ocurrió un error'),
      h('p', {}, String(err && err.message || err)),
      h('a', { class: 'btn', href: '#/' }, 'Volver al inicio'),
    ]));
  } finally {
    rendering = false;
  }
}

export function startRouter() {
  window.addEventListener('hashchange', render);
  render();
}
