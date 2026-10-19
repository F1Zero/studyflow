// ============================================================
// home.js — Pantalla de inicio (dashboard).
// ============================================================

import { h } from '../ui/dom.js';
import { emptyState } from '../ui/components.js';
import * as repo from '../store/repo.js';

export async function homeView() {
  const now = new Date();
  const [profile, streak, ov, reviewed] = await Promise.all([
    repo.getProfile(),
    repo.getStreak(),
    repo.overview(now),
    repo.reviewedToday(now),
  ]);

  const name = (profile.displayName || '').trim();
  const greeting = name
    ? `¡Hola, ${name}! ¿Qué vas a estudiar hoy?`
    : '¡Hola! ¿Qué vas a estudiar hoy?';

  const stat = (label, value) =>
    h('div', { class: 'stat' }, [
      h('div', { class: 'label' }, label),
      h('div', { class: 'value' }, value),
    ]);

  const minutes = ov.dueCount > 0
    ? `${ov.dueCount} ${ov.dueCount === 1 ? 'tarjeta lista' : 'tarjetas listas'} para repasar · ${estimateTime(ov.dueCount)}`
    : 'No hay repasos pendientes por ahora. Puedes adelantar estudiando un mazo completo.';

  const cta = ov.dueCount > 0
    ? h('a', { class: 'cta', href: '#/estudiar' }, [
        h('div', { class: 'cta-title' }, 'Continuar estudiando'),
        h('div', { class: 'cta-sub' }, minutes),
      ])
    : h('a', { class: 'cta is-empty', href: '#/mazos' }, [
        h('div', { class: 'cta-title' }, ov.cardCount > 0 ? '¡Todo al día!' : 'Empieza con un mazo'),
        h('div', { class: 'cta-sub' }, minutes),
      ]);

  return [
    h('h1', { class: 'page-title' }, greeting),
    h('div', { class: 'stat-grid' }, [
      stat('Repasos pendientes', String(ov.dueCount)),
      stat('Mazos', String(ov.deckCount)),
      stat('Racha', `${streak.count} ${streak.count === 1 ? 'día' : 'días'}`),
    ]),
    cta,
    reviewed.reviews > 0
      ? h('p', { class: 'muted', style: 'margin-top:14px' },
          `Hoy ya repasaste ${reviewed.reviews} ${reviewed.reviews === 1 ? 'vez' : 'veces'} (${reviewed.cards} ${reviewed.cards === 1 ? 'tarjeta' : 'tarjetas'}).`)
      : null,
    h('div', { class: 'actions-row' }, [
      h('a', { class: 'btn', href: '#/mazos' }, 'Mis mazos'),
      h('a', { class: 'btn', href: '#/mazo/nuevo' }, '+ Crear mazo'),
      h('a', { class: 'btn', href: '#/transferir' }, 'Importar / Exportar'),
    ]),
    ov.deckCount === 0
      ? emptyState({
          title: 'Aún no tienes mazos',
          message: 'Crea tu primer mazo o importa tarjetas para empezar.',
          action: h('a', { class: 'btn btn-primary', href: '#/mazo/nuevo' }, 'Crear mazo'),
        })
      : null,
  ];
}

function estimateTime(n) {
  // ~4–8 s por tarjeta como referencia suave.
  const lo = Math.max(1, Math.round((n * 4) / 60));
  const hi = Math.max(lo + 1, Math.round((n * 9) / 60));
  return `${lo}–${hi} minutos`;
}
