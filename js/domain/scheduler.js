// ============================================================
// scheduler.js — Programación de repasos con FSRS.
// Envuelve la librería ts-fsrs (MIT, Open Spaced Repetition),
// vendorizada en /vendor/ts-fsrs.mjs. NO reimplementamos el algoritmo:
// usamos la implementación oficial del algoritmo FSRS.
// ============================================================

import {
  fsrs,
  generatorParameters,
  createEmptyCard,
  Rating,
  State,
} from '../../vendor/ts-fsrs.mjs';

// Correspondencia UI ↔ motor (documentada):
//   "Otra vez" → Again (1)   |  "Difícil" → Hard (2)
//   "Bien"     → Good  (3)   |  "Fácil"   → Easy (4)
export const RATING = {
  AGAIN: Rating.Again, // 1
  HARD: Rating.Hard,   // 2
  GOOD: Rating.Good,   // 3
  EASY: Rating.Easy,   // 4
};

export { State };

// Retención objetivo por defecto 0.90 (valor por defecto de FSRS).
// enable_fuzz evita que muchas tarjetas caigan exactamente el mismo día.
const params = generatorParameters({
  request_retention: 0.9,
  enable_fuzz: true,
});

const engine = fsrs(params);

/** Estado FSRS inicial de una tarjeta nueva (vence de inmediato). */
export function newState(now = new Date()) {
  return createEmptyCard(now);
}

/**
 * Previsualiza las 4 opciones de calificación: para cada una devuelve
 * el nuevo estado y cuándo volvería a tocar. Sirve para mostrar al
 * usuario "cuándo" se repasará con cada botón.
 */
export function preview(state, now = new Date()) {
  const record = engine.repeat(normalize(state), now);
  const out = {};
  for (const key of [RATING.AGAIN, RATING.HARD, RATING.GOOD, RATING.EASY]) {
    const item = record[key];
    out[key] = {
      state: item.card,
      due: item.card.due,
      intervalText: humanInterval(now, item.card.due),
    };
  }
  return out;
}

/**
 * Aplica una calificación y devuelve { state, log }.
 * state = nuevo estado FSRS a guardar; log = registro histórico del repaso.
 */
export function applyRating(state, rating, now = new Date()) {
  const { card, log } = engine.next(normalize(state), now, rating);
  return { state: card, log };
}

/** ¿La tarjeta está lista para repasar a la fecha dada? */
export function isDue(state, now = new Date()) {
  if (!state) return true; // sin estado = nueva
  const due = state.due instanceof Date ? state.due : new Date(state.due);
  return due.getTime() <= now.getTime();
}

// --- Utilidades internas ---

// Asegura que due/last_review sean Date (IndexedDB los conserva, pero
// por si acaso vinieran como número o texto).
function normalize(state) {
  if (!state) return newState();
  const s = { ...state };
  if (s.due != null && !(s.due instanceof Date)) s.due = new Date(s.due);
  if (s.last_review != null && !(s.last_review instanceof Date)) {
    s.last_review = new Date(s.last_review);
  }
  return s;
}

/** Texto humano del intervalo en español: "10 min", "1 h", "3 días", "2 meses". */
export function humanInterval(from, to) {
  const ms = (to instanceof Date ? to : new Date(to)).getTime() -
             (from instanceof Date ? from : new Date(from)).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} ${d === 1 ? 'día' : 'días'}`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo} ${mo === 1 ? 'mes' : 'meses'}`;
  const y = (d / 365).toFixed(d < 365 * 2 ? 1 : 0);
  return `${y} ${y === '1' ? 'año' : 'años'}`;
}
