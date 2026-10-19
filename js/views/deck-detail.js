// ============================================================
// deck-detail.js — Detalle de un mazo: tarjetas y acciones.
// ============================================================

import { h, mount } from '../ui/dom.js';
import { navigate } from '../router.js';
import { confirmDialog, toast, gradeText, emptyState } from '../ui/components.js';
import * as repo from '../store/repo.js';
import { deckToJSON, cardsToCSV, download, safeFilename } from '../domain/csv.js';

export async function deckDetailView(deckId) {
  const deck = await repo.getDeck(deckId);
  if (!deck) {
    return emptyState({
      title: 'Mazo no encontrado',
      message: 'Puede que se haya eliminado.',
      action: h('a', { class: 'btn btn-primary', href: '#/mazos' }, 'Ver mazos'),
    });
  }

  const [cards, stats] = await Promise.all([
    repo.listCards(deckId),
    repo.deckStats(deckId, new Date()),
  ]);

  return [
    h('nav', { class: 'breadcrumb' }, [
      h('a', { href: '#/mazos' }, 'Mis mazos'),
      ' · ',
      deck.subject || deck.name,
    ]),

    h('div', { class: 'actions-row spread' }, [
      h('div', {}, [
        h('h1', { class: 'page-title', style: 'margin:0' }, [
          deck.subject || deck.name,
          deck.grade ? h('span', { class: 'pill grade' }, gradeText(deck.grade)) : null,
        ]),
        deck.description ? h('p', { class: 'muted', style: 'margin:6px 0 0' }, deck.description) : null,
      ]),
      stats.due > 0
        ? h('a', { class: 'btn btn-primary btn-lg', href: `#/estudiar/${deckId}` }, `Estudiar (${stats.due})`)
        : h('span', { class: 'muted' }, 'Sin repasos pendientes'),
    ]),

    h('p', { class: 'muted', style: 'margin:10px 0' },
      `${stats.total} ${stats.total === 1 ? 'tarjeta' : 'tarjetas'} · ${stats.due} por repasar`),

    // Acciones del mazo
    h('div', { class: 'actions-row' }, [
      h('a', { class: 'btn btn-primary', href: `#/mazo/${deckId}/nueva` }, '+ Nueva tarjeta'),
      h('button', { class: 'btn', onClick: () => editDeckDialog(deck) }, 'Editar mazo'),
      h('button', { class: 'btn', onClick: () => duplicate(deckId) }, 'Duplicar'),
      h('button', { class: 'btn', onClick: () => exportDeck(deck, cards) }, 'Exportar'),
      h('button', { class: 'btn btn-danger', onClick: () => removeDeck(deck, stats.total) }, 'Eliminar'),
    ]),

    // Compartir con el grupo (orientado a docentes)
    h('div', { class: 'notice' }, [
      h('strong', {}, 'Compartir con tu grupo: '),
      `código ${deck.shareCode}. `,
      'Por ahora, para que tus alumnos reciban este mazo, usa ',
      h('strong', {}, 'Exportar'),
      ' y que lo abran con ',
      h('a', { href: '#/transferir' }, 'Importar'),
      '. La sincronización en línea por código llegará en una fase posterior.',
    ]),

    // Lista de tarjetas
    h('div', { class: 'subject-head' }, [
      h('h2', {}, 'Tarjetas'),
      h('span', { class: 'count' }, `${cards.length}`),
    ]),
    cards.length === 0
      ? emptyState({
          title: 'Este mazo no tiene tarjetas',
          message: 'Agrega la primera para poder estudiar.',
          action: h('a', { class: 'btn btn-primary', href: `#/mazo/${deckId}/nueva` }, 'Crear tarjeta'),
        })
      : h('div', { class: 'list' }, cards.map((c) => renderCardItem(deckId, c))),
  ];
}

function renderCardItem(deckId, card) {
  const edit = () => navigate(`#/mazo/${deckId}/tarjeta/${card.id}`);
  return h('div', { class: 'card-item' }, [
    h('div', { class: 'main', role: 'button', tabindex: '0',
      onClick: edit,
      onKeydown: (e) => { if (e.key === 'Enter') edit(); },
    }, [
      h('div', { class: 'front' }, card.front),
      h('div', { class: 'back' }, card.back),
      (card.tags && card.tags.length)
        ? h('div', { style: 'margin-top:6px' }, card.tags.map((t) => h('span', { class: 'tag' }, t)))
        : null,
    ]),
    h('div', { class: 'row-actions' }, [
      h('button', { class: 'btn btn-ghost', onClick: edit, 'aria-label': 'Editar tarjeta' }, 'Editar'),
      h('button', { class: 'btn btn-ghost', onClick: () => removeCard(card), 'aria-label': 'Eliminar tarjeta' }, 'Eliminar'),
    ]),
  ]);
}

// ---------- acciones ----------

async function duplicate(deckId) {
  const copy = await repo.duplicateDeck(deckId);
  toast('Mazo duplicado', 'ok');
  navigate(`#/mazo/${copy.id}`);
}

function exportDeck(deck, cards) {
  const data = JSON.stringify(deckToJSON(deck, cards), null, 2);
  download(`${safeFilename(deck.name)}.studyflow.json`, data, 'application/json');
  // También ofrecemos CSV de las tarjetas.
  toast('Mazo exportado como archivo', 'ok');
}

async function removeDeck(deck, total) {
  const ok = await confirmDialog({
    title: `¿Eliminar "${deck.name}"?`,
    message: `Se eliminarán el mazo y sus ${total} ${total === 1 ? 'tarjeta' : 'tarjetas'}, junto con su progreso. Esta acción no se puede deshacer.`,
    confirmLabel: 'Eliminar',
    danger: true,
  });
  if (!ok) return;
  await repo.deleteDeck(deck.id);
  toast('Mazo eliminado', 'ok');
  navigate('#/mazos');
}

async function removeCard(card) {
  const ok = await confirmDialog({
    title: '¿Eliminar tarjeta?',
    message: card.front,
    confirmLabel: 'Eliminar',
    danger: true,
  });
  if (!ok) return;
  await repo.deleteCard(card.id);
  toast('Tarjeta eliminada', 'ok');
  // recargar la vista
  const { render } = await import('../router.js');
  render();
}

function editDeckDialog(deck) {
  const dlg = document.getElementById('modal-root');
  const name = h('input', { class: 'input', value: deck.name });
  const subject = h('input', { class: 'input', value: deck.subject || '' });
  const grade = h('select', { class: 'input' }, [
    h('option', { value: '' }, 'Sin grado'),
    h('option', { value: '1', selected: deck.grade === 1 }, '1° de secundaria'),
    h('option', { value: '2', selected: deck.grade === 2 }, '2° de secundaria'),
    h('option', { value: '3', selected: deck.grade === 3 }, '3° de secundaria'),
  ]);
  const desc = h('textarea', { class: 'textarea', value: deck.description || '' });

  const field = (label, control) => h('div', { class: 'field' }, [h('label', {}, label), control]);

  const save = async () => {
    const nm = name.value.trim();
    if (!nm) { name.classList.add('invalid'); return; }
    await repo.updateDeck(deck.id, {
      name: nm,
      subject: subject.value.trim(),
      grade: grade.value ? Number(grade.value) : null,
      description: desc.value.trim(),
    });
    dlg.close();
    toast('Mazo actualizado', 'ok');
    const { render } = await import('../router.js');
    render();
  };

  mount(dlg, h('div', { class: 'modal-body' }, [
    h('h3', {}, 'Editar mazo'),
    field('Nombre', name),
    field('Materia', subject),
    field('Grado', grade),
    field('Descripción', desc),
    h('div', { class: 'modal-actions' }, [
      h('button', { class: 'btn', onClick: () => dlg.close() }, 'Cancelar'),
      h('button', { class: 'btn btn-primary', onClick: save }, 'Guardar'),
    ]),
  ]));
  dlg.showModal();
}
