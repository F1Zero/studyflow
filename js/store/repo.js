// ============================================================
// repo.js — Repositorio de dominio sobre IndexedDB.
// Expone operaciones de alto nivel: mazos, tarjetas, repasos,
// racha y estadísticas. Las vistas usan SOLO este módulo.
// ============================================================

import * as db from './db.js';
import { newState, applyRating, isDue } from '../domain/scheduler.js';

// ---------- utilidades ----------

export function uid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function shareCode() {
  const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin caracteres ambiguos
  let s = '';
  for (let i = 0; i < 6; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
  return s;
}

function localDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---------- meta / perfil / racha ----------

export async function getMeta(key, fallback = null) {
  const row = await db.get('meta', key);
  return row ? row.value : fallback;
}
export async function setMeta(key, value) {
  await db.put('meta', { key, value });
  return value;
}

export async function getProfile() {
  return (await getMeta('profile')) || { displayName: '', role: 'docente', locale: 'es-MX' };
}
export async function setProfile(patch) {
  const current = await getProfile();
  return setMeta('profile', { ...current, ...patch });
}

export async function getStreak() {
  return (await getMeta('streak')) || { count: 0, lastStudyDay: null };
}

/** Registra actividad de hoy y actualiza la racha (sin castigar al perderla). */
export async function registerStudyDay(now = new Date()) {
  const streak = await getStreak();
  const today = localDay(now);
  if (streak.lastStudyDay === today) return streak;

  const yesterday = localDay(new Date(now.getTime() - 86400000));
  const next = streak.lastStudyDay === yesterday
    ? { count: (streak.count || 0) + 1, lastStudyDay: today }
    : { count: 1, lastStudyDay: today };
  return setMeta('streak', next);
}

// ---------- mazos ----------

export async function listDecks() {
  const decks = (await db.getAll('decks')).filter((d) => !d.archivedAt);
  decks.sort((a, b) => {
    if ((a.grade || 99) !== (b.grade || 99)) return (a.grade || 99) - (b.grade || 99);
    return (a.subject || a.name).localeCompare(b.subject || b.name, 'es');
  });
  return decks;
}

export async function getDeck(id) {
  return db.get('decks', id);
}

export async function createDeck({ name, subject = '', grade = null, description = '', origin = 'user' }) {
  const now = new Date().toISOString();
  const deck = {
    id: uid(),
    name: (name || '').trim() || 'Mazo sin nombre',
    subject: subject.trim(),
    grade,
    description: description.trim(),
    origin,
    shareCode: shareCode(),
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  };
  await db.put('decks', deck);
  return deck;
}

export async function updateDeck(id, patch) {
  const deck = await getDeck(id);
  if (!deck) throw new Error('Mazo no encontrado');
  const updated = { ...deck, ...patch, updatedAt: new Date().toISOString() };
  await db.put('decks', updated);
  return updated;
}

/** Elimina un mazo y, en cascada, sus tarjetas, estados y registros. */
export async function deleteDeck(id) {
  const cards = await db.getAllByIndex('cards', 'deckId', id);
  const cardIds = cards.map((c) => c.id);
  await db.delMany('cards', cardIds);
  await db.delMany('states', cardIds);
  // logs: borrar por índice
  for (const cid of cardIds) {
    const logs = await db.getAllByIndex('logs', 'cardId', cid);
    await db.delMany('logs', logs.map((l) => l.id));
  }
  await db.del('decks', id);
}

export async function duplicateDeck(id) {
  const deck = await getDeck(id);
  if (!deck) throw new Error('Mazo no encontrado');
  const copy = await createDeck({
    name: `${deck.name} (copia)`,
    subject: deck.subject,
    grade: deck.grade,
    description: deck.description,
    origin: 'user',
  });
  const cards = await db.getAllByIndex('cards', 'deckId', id);
  for (const c of cards) {
    await createCard(copy.id, { front: c.front, back: c.back, tags: c.tags });
  }
  return copy;
}

// ---------- tarjetas ----------

export async function listCards(deckId) {
  const cards = (await db.getAllByIndex('cards', 'deckId', deckId)).filter((c) => !c.archivedAt);
  cards.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  return cards;
}

export async function getCard(id) {
  return db.get('cards', id);
}

export async function createCard(deckId, { front, back, tags = [] }) {
  const now = new Date().toISOString();
  const card = {
    id: uid(),
    deckId,
    front: (front || '').trim(),
    back: (back || '').trim(),
    tags: normalizeTags(tags),
    origin: 'user',
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  };
  const s = newState(new Date());
  const state = { ...s, cardId: card.id, deckId };
  await db.putMany([
    { store: 'cards', value: card },
    { store: 'states', value: state },
  ]);
  return card;
}

export async function updateCard(id, patch) {
  const card = await getCard(id);
  if (!card) throw new Error('Tarjeta no encontrada');
  const updated = {
    ...card,
    ...patch,
    tags: patch.tags != null ? normalizeTags(patch.tags) : card.tags,
    updatedAt: new Date().toISOString(),
  };
  await db.put('cards', updated);
  return updated;
}

export async function deleteCard(id) {
  const logs = await db.getAllByIndex('logs', 'cardId', id);
  await db.delMany('logs', logs.map((l) => l.id));
  await db.del('states', id);
  await db.del('cards', id);
}

function normalizeTags(tags) {
  if (typeof tags === 'string') {
    tags = tags.split(',');
  }
  return [...new Set((tags || []).map((t) => String(t).trim()).filter(Boolean))];
}

// ---------- repaso / sesión ----------

export async function getState(cardId) {
  return db.get('states', cardId);
}

/** Tarjetas listas para repasar (nuevas o vencidas), opcionalmente de un mazo. */
export async function getDueCards(deckId = null, now = new Date(), limit = null) {
  const states = deckId
    ? await db.getAllByIndex('states', 'deckId', deckId)
    : await db.getAll('states');
  const dueStates = states.filter((s) => isDue(s, now));
  dueStates.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());

  const result = [];
  for (const s of dueStates) {
    const card = await getCard(s.cardId);
    if (card && !card.archivedAt) result.push({ card, state: s });
    if (limit && result.length >= limit) break;
  }
  return result;
}

export async function countDue(deckId = null, now = new Date()) {
  const states = deckId
    ? await db.getAllByIndex('states', 'deckId', deckId)
    : await db.getAll('states');
  // Solo contar los que tienen tarjeta activa
  let n = 0;
  for (const s of states) {
    if (!isDue(s, now)) continue;
    const card = await getCard(s.cardId);
    if (card && !card.archivedAt) n++;
  }
  return n;
}

/**
 * Aplica una calificación a una tarjeta: guarda el nuevo estado y el
 * registro histórico en una sola transacción, y actualiza la racha.
 * No marca la tarjeta como revisada si la escritura falla.
 */
export async function reviewCard(cardId, rating, now = new Date()) {
  const prev = await getState(cardId);
  const card = await getCard(cardId);
  if (!card) throw new Error('Tarjeta no encontrada');

  const { state, log } = applyRating(prev, rating, now);
  const newStateRow = { ...state, cardId, deckId: card.deckId };
  const logRow = {
    id: uid(),
    cardId,
    deckId: card.deckId,
    rating,
    reviewedAt: now.toISOString(),
    stateAfter: log.state,
    stability: log.stability,
    difficulty: log.difficulty,
    elapsed_days: log.elapsed_days,
    scheduled_days: log.scheduled_days,
    due: new Date(log.due).toISOString(),
  };

  await db.putMany([
    { store: 'states', value: newStateRow },
    { store: 'logs', value: logRow },
  ]);
  await registerStudyDay(now);
  return newStateRow;
}

// ---------- estadísticas ----------

export async function overview(now = new Date()) {
  const [decks, cardCount, dueCount] = await Promise.all([
    listDecks(),
    db.count('cards'),
    countDue(null, now),
  ]);
  return { deckCount: decks.length, cardCount, dueCount };
}

export async function reviewedToday(now = new Date()) {
  const logs = await db.getAll('logs');
  const today = localDay(now);
  const ids = new Set();
  for (const l of logs) {
    if (localDay(new Date(l.reviewedAt)) === today) ids.add(l.cardId);
  }
  return { reviews: logs.filter((l) => localDay(new Date(l.reviewedAt)) === today).length, cards: ids.size };
}

export async function deckStats(deckId, now = new Date()) {
  const cards = await listCards(deckId);
  const due = await countDue(deckId, now);
  return { total: cards.length, due };
}

// ---------- datos de demostración / reinicio ----------

export async function wipeEverything() {
  await db.clearAll();
}
