// ============================================================
// decks.js — Lista de mazos, agrupada por grado.
// ============================================================

import { h } from '../ui/dom.js';
import { navigate } from '../router.js';
import { emptyState, gradeText } from '../ui/components.js';
import * as repo from '../store/repo.js';

export async function decksView() {
  const now = new Date();
  const decks = await repo.listDecks();

  // calcular stats por mazo
  const withStats = [];
  for (const d of decks) {
    withStats.push({ deck: d, stats: await repo.deckStats(d.id, now) });
  }

  // agrupar por grado
  const groups = new Map();
  for (const item of withStats) {
    const key = item.deck.grade || 0;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  const orderedKeys = [...groups.keys()].sort((a, b) => (a || 99) - (b || 99));

  const header = h('div', { class: 'actions-row spread' }, [
    h('h1', { class: 'page-title', style: 'margin:0' }, 'Mis mazos'),
    h('a', { class: 'btn btn-primary', href: '#/mazo/nuevo' }, '+ Crear mazo'),
  ]);

  if (decks.length === 0) {
    return [
      header,
      emptyState({
        title: 'No hay mazos',
        message: 'Crea un mazo nuevo o importa tarjetas desde un archivo.',
        action: h('a', { class: 'btn btn-primary', href: '#/mazo/nuevo' }, 'Crear mazo'),
      }),
    ];
  }

  const sections = orderedKeys.map((key) => {
    const items = groups.get(key);
    const title = key ? `${gradeText(key)} de secundaria` : 'Otros mazos';
    return h('section', {}, [
      h('div', { class: 'subject-head' }, [
        h('h2', {}, title),
        h('span', { class: 'count' }, `${items.length} ${items.length === 1 ? 'mazo' : 'mazos'}`),
      ]),
      h('div', { class: 'list' }, items.map(renderDeckItem)),
    ]);
  });

  return [header, ...sections];
}

function renderDeckItem({ deck, stats }) {
  const openDetail = () => navigate(`#/mazo/${deck.id}`);

  const meta = [
    `${stats.total} ${stats.total === 1 ? 'tarjeta' : 'tarjetas'}`,
    stats.due > 0 ? `· ${stats.due} por repasar` : '· al día',
  ].join(' ');

  return h('div', { class: 'deck-item' }, [
    h('div', { class: 'main', role: 'button', tabindex: '0',
      onClick: openDetail,
      onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(); } },
    }, [
      h('div', { class: 'title' }, [
        deck.subject || deck.name,
        deck.grade ? h('span', { class: 'pill grade' }, gradeText(deck.grade)) : null,
        deck.origin === 'seed' ? h('span', { class: 'pill seed' }, 'incluido') : null,
      ]),
      h('div', { class: 'meta' }, meta),
    ]),
    h('div', { class: 'row-actions' }, [
      stats.due > 0
        ? h('a', { class: 'btn btn-primary', href: `#/estudiar/${deck.id}` }, 'Estudiar')
        : h('a', { class: 'btn', href: `#/mazo/${deck.id}` }, 'Abrir'),
    ]),
  ]);
}
