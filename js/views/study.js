// ============================================================
// study.js — Sesión de estudio: una tarjeta a la vez, con FSRS.
// ============================================================

import { h, mount, clear } from '../ui/dom.js';
import { emptyState } from '../ui/components.js';
import * as repo from '../store/repo.js';
import { preview, RATING } from '../domain/scheduler.js';
import { gradeText } from '../ui/components.js';

const RATING_META = [
  { key: RATING.AGAIN, cls: 'again', label: 'Otra vez', num: 1 },
  { key: RATING.HARD,  cls: 'hard',  label: 'Difícil',  num: 2 },
  { key: RATING.GOOD,  cls: 'good',  label: 'Bien',     num: 3 },
  { key: RATING.EASY,  cls: 'easy',  label: 'Fácil',    num: 4 },
];

// Reencolar en la MISMA sesión solo si el próximo repaso cae muy pronto
// (~3 min). En la práctica esto reaparece las tarjetas marcadas "Otra vez",
// mientras que "Difícil/Bien/Fácil" salen de la sesión y el avance se nota.
const REQUEUE_WINDOW_MS = 3 * 60 * 1000;

export async function studyView(deckId = null) {
  const now = new Date();
  const due = await repo.getDueCards(deckId, now);
  const deckCache = new Map();
  const cardCache = new Map();

  const deck = deckId ? await repo.getDeck(deckId) : null;
  if (deck) deckCache.set(deck.id, deck);

  const root = h('div', { class: 'study-wrap' });

  if (due.length === 0) {
    mount(root, renderEmpty(deck));
    return root;
  }

  // Cola de IDs y caché de tarjetas.
  const queue = [];
  for (const { card } of due) { queue.push(card.id); cardCache.set(card.id, card); }

  const session = { total: queue.length, done: 0, againCount: 0 };
  let current = null;       // { card, state }
  let revealed = false;

  async function getDeckOf(card) {
    if (!deckCache.has(card.deckId)) {
      deckCache.set(card.deckId, await repo.getDeck(card.deckId));
    }
    return deckCache.get(card.deckId);
  }

  async function nextCard() {
    revealed = false;
    if (queue.length === 0) { renderDone(); return; }
    const id = queue.shift();
    let card = cardCache.get(id) || await repo.getCard(id);
    if (!card || card.archivedAt) { nextCard(); return; }
    const state = await repo.getState(id);
    current = { card, state };
    await renderCard();
  }

  async function rate(rating) {
    if (!current) return;
    const cardId = current.card.id;
    const newState = await repo.reviewCard(cardId, rating, new Date());
    session.done++;
    if (rating === RATING.AGAIN) session.againCount++;
    // ¿reencolar en esta sesión?
    const dueMs = new Date(newState.due).getTime() - Date.now();
    if (dueMs <= REQUEUE_WINDOW_MS) queue.push(cardId);
    await nextCard();
  }

  async function renderCard() {
    const { card, state } = current;
    const deckOf = await getDeckOf(card);
    const remaining = queue.length + 1;
    const prev = preview(state, new Date());

    const crumb = [deckOf ? (deckOf.subject || deckOf.name) : 'Estudio'];
    if (card.tags && card.tags.length) crumb.push(card.tags[0]);

    const flashcard = h('div', { class: 'flashcard' }, [
      h('div', { class: 'q' }, card.front),
      revealed
        ? [h('div', { class: 'divider' }), h('div', { class: 'a' }, card.back)]
        : h('button', { class: 'link-btn reveal-btn', onClick: reveal }, '[ Mostrar respuesta ]'),
    ]);

    const ratingRow = revealed
      ? h('div', { class: 'rating-row' }, RATING_META.map((r) =>
          h('button', { class: `rating-btn ${r.cls}`, onClick: () => rate(r.key) }, [
            h('span', { class: 'r-label' }, r.label),
            h('span', { class: 'r-when' }, prev[r.key].intervalText),
          ])))
      : h('p', { class: 'session-foot' }, 'Pulsa Espacio o toca para mostrar la respuesta.');

    mount(root, [
      h('div', { class: 'progress-bar' }, h('span', {
        style: `width:${Math.round((session.done / Math.max(session.total, session.done + remaining)) * 100)}%`,
      })),
      h('nav', { class: 'breadcrumb' }, [
        h('a', { href: deckOf ? `#/mazo/${deckOf.id}` : '#/mazos' }, crumb[0]),
        crumb[1] ? ` · ${crumb[1]}` : '',
      ]),
      flashcard,
      ratingRow,
      h('div', { class: 'session-foot' },
        `Atajos de teclado · Guardado automático · ${remaining} ${remaining === 1 ? 'restante' : 'restantes'}`),
    ]);
  }

  function reveal() { if (!revealed) { revealed = true; renderCard(); } }

  function renderDone() {
    mount(root, emptyState({
      title: '¡Sesión terminada! 🎉',
      message: `Repasaste ${session.done} ${session.done === 1 ? 'tarjeta' : 'tarjetas'} en esta sesión.`,
      action: h('div', { class: 'actions-row', style: 'justify-content:center' }, [
        h('a', { class: 'btn', href: '#/' }, 'Ir al inicio'),
        h('a', { class: 'btn btn-primary', href: '#/mazos' }, 'Ver mis mazos'),
      ]),
    }));
    detachKeys();
  }

  // --- Teclado ---
  function onKeyDown(e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (!revealed && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); reveal(); return; }
    if (revealed) {
      const map = { '1': RATING.AGAIN, '2': RATING.HARD, '3': RATING.GOOD, '4': RATING.EASY };
      if (map[e.key] != null) { e.preventDefault(); rate(map[e.key]); }
    }
  }
  function detachKeys() { document.removeEventListener('keydown', onKeyDown); }
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('hashchange', detachKeys, { once: true });

  // Arranque
  nextCard();
  return root;
}

function renderEmpty(deck) {
  return emptyState({
    title: '¡Todo al día!',
    message: deck
      ? 'Este mazo no tiene tarjetas pendientes de repaso ahora mismo.'
      : 'No tienes repasos pendientes. Vuelve más tarde o estudia un mazo completo.',
    action: h('div', { class: 'actions-row', style: 'justify-content:center' }, [
      h('a', { class: 'btn', href: '#/' }, 'Inicio'),
      h('a', { class: 'btn btn-primary', href: '#/mazos' }, 'Ver mazos'),
    ]),
  });
}
