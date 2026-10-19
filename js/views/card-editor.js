// ============================================================
// card-editor.js — Crear mazo, crear tarjeta y editar tarjeta.
// ============================================================

import { h } from '../ui/dom.js';
import { navigate, render } from '../router.js';
import { toast, gradeText, emptyState } from '../ui/components.js';
import * as repo from '../store/repo.js';

export async function cardEditorView(opts) {
  if (opts.mode === 'new-deck') return newDeckForm();
  return cardForm(opts);
}

// ---------- Crear mazo ----------

function newDeckForm() {
  const name = h('input', { class: 'input', placeholder: 'Ej. Biología · 1°', autofocus: true });
  const subject = h('input', { class: 'input', placeholder: 'Ej. Biología' });
  const grade = h('select', { class: 'input' }, [
    h('option', { value: '' }, 'Sin grado'),
    h('option', { value: '1' }, '1° de secundaria'),
    h('option', { value: '2' }, '2° de secundaria'),
    h('option', { value: '3' }, '3° de secundaria'),
  ]);
  const desc = h('textarea', { class: 'textarea', placeholder: 'Opcional' });
  const err = h('div', { class: 'error-text', style: 'display:none' }, '');

  const field = (label, control, hint) => h('div', { class: 'field' }, [
    h('label', {}, label), control, hint ? h('div', { class: 'hint' }, hint) : null,
  ]);

  const save = async () => {
    const nm = name.value.trim();
    if (!nm) {
      name.classList.add('invalid');
      err.textContent = 'El mazo necesita un nombre.';
      err.style.display = 'block';
      name.focus();
      return;
    }
    const deck = await repo.createDeck({
      name: nm,
      subject: subject.value.trim(),
      grade: grade.value ? Number(grade.value) : null,
      description: desc.value.trim(),
    });
    toast('Mazo creado', 'ok');
    navigate(`#/mazo/${deck.id}`);
  };

  return [
    h('nav', { class: 'breadcrumb' }, [h('a', { href: '#/mazos' }, 'Mis mazos'), ' · Nuevo mazo']),
    h('h1', { class: 'page-title' }, 'Crear mazo'),
    field('Nombre', name, 'Como lo verás en tu lista de mazos.'),
    field('Materia', subject),
    field('Grado', grade),
    field('Descripción', desc),
    err,
    h('div', { class: 'actions-row spread' }, [
      h('a', { class: 'btn btn-ghost', href: '#/mazos' }, 'Cancelar'),
      h('button', { class: 'btn btn-primary btn-lg', onClick: save }, 'Crear mazo'),
    ]),
  ];
}

// ---------- Crear / editar tarjeta ----------

async function cardForm({ mode, deckId, cardId }) {
  const deck = await repo.getDeck(deckId);
  if (!deck) {
    return emptyState({
      title: 'Mazo no encontrado',
      message: 'No se puede agregar la tarjeta.',
      action: h('a', { class: 'btn btn-primary', href: '#/mazos' }, 'Ver mazos'),
    });
  }

  let card = null;
  if (mode === 'edit-card') {
    card = await repo.getCard(cardId);
    if (!card) {
      return emptyState({
        title: 'Tarjeta no encontrada',
        message: 'Puede que se haya eliminado.',
        action: h('a', { class: 'btn btn-primary', href: `#/mazo/${deckId}` }, 'Volver al mazo'),
      });
    }
  }

  const front = h('textarea', { class: 'textarea', placeholder: 'Escribe la pregunta…',
    value: card ? card.front : '', autofocus: true });
  const back = h('textarea', { class: 'textarea', placeholder: 'Escribe la respuesta…',
    value: card ? card.back : '' });
  const tags = h('input', { class: 'input', placeholder: 'Separadas por comas (opcional)',
    value: card ? (card.tags || []).join(', ') : '' });
  const err = h('div', { class: 'error-text', style: 'display:none' }, '');

  const validate = () => {
    front.classList.toggle('invalid', !front.value.trim());
    back.classList.toggle('invalid', !back.value.trim());
    if (!front.value.trim() || !back.value.trim()) {
      err.textContent = 'La pregunta y la respuesta son obligatorias.';
      err.style.display = 'block';
      return false;
    }
    err.style.display = 'none';
    return true;
  };

  const collect = () => ({
    front: front.value.trim(),
    back: back.value.trim(),
    tags: tags.value.split(',').map((t) => t.trim()).filter(Boolean),
  });

  const saveAndBack = async () => {
    if (!validate()) return;
    if (mode === 'edit-card') await repo.updateCard(cardId, collect());
    else await repo.createCard(deckId, collect());
    toast('Tarjeta guardada', 'ok');
    navigate(`#/mazo/${deckId}`);
  };

  const saveAndAnother = async () => {
    if (!validate()) return;
    await repo.createCard(deckId, collect());
    toast('Tarjeta guardada · crea otra', 'ok');
    front.value = ''; back.value = ''; tags.value = '';
    front.focus();
  };

  const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') saveAndBack(); };
  front.addEventListener('keydown', onKey);
  back.addEventListener('keydown', onKey);

  const field = (label, control) => h('div', { class: 'field' }, [h('label', {}, label), control]);

  return [
    h('nav', { class: 'breadcrumb' }, [
      h('a', { href: '#/mazos' }, 'Mis mazos'), ' · ',
      h('a', { href: `#/mazo/${deckId}` }, deck.subject || deck.name), ' · ',
      mode === 'edit-card' ? 'Editar tarjeta' : 'Nueva tarjeta',
    ]),
    h('h1', { class: 'page-title' }, mode === 'edit-card' ? 'Editar tarjeta' : 'Crear tarjeta'),
    field('Pregunta', front),
    field('Respuesta', back),
    field('Etiquetas', tags),
    err,
    h('div', { class: 'actions-row spread' }, [
      h('div', { class: 'muted' }, [
        'Mazo: ', h('strong', {}, deck.subject || deck.name),
        deck.grade ? `  ·  ${gradeText(deck.grade)}` : '',
        h('span', { class: 'hint', style: 'display:block' }, 'Guardar con Ctrl+Enter'),
      ]),
      h('div', { style: 'display:flex;gap:10px' }, [
        mode === 'new-card'
          ? h('button', { class: 'btn', onClick: saveAndAnother }, 'Guardar y crear otra')
          : null,
        h('button', { class: 'btn btn-primary btn-lg', onClick: saveAndBack }, 'Guardar'),
      ]),
    ]),
  ];
}
