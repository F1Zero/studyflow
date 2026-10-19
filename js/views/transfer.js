// ============================================================
// transfer.js — Importar y exportar mazos (JSON) y tarjetas (CSV).
// Con vista previa, validación y opción de cancelar.
// ============================================================

import { h, mount } from '../ui/dom.js';
import { navigate, render } from '../router.js';
import { toast } from '../ui/components.js';
import * as repo from '../store/repo.js';
import {
  parseCSV, csvRowsToCards, cardsToCSV,
  deckToJSON, jsonToDeck, download, safeFilename,
} from '../domain/csv.js';

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export async function transferView() {
  const decks = await repo.listDecks();
  const root = h('div', {});
  const preview = h('div', {});

  // ---------- Exportar ----------
  const exportSelect = h('select', { class: 'input' },
    decks.length
      ? decks.map((d) => h('option', { value: d.id }, labelOf(d)))
      : [h('option', { value: '' }, 'No tienes mazos')]
  );

  const doExport = async (fmt) => {
    const id = exportSelect.value;
    if (!id) { toast('No hay mazo para exportar', 'err'); return; }
    const deck = await repo.getDeck(id);
    const cards = await repo.listCards(id);
    if (fmt === 'json') {
      download(`${safeFilename(deck.name)}.studyflow.json`,
        JSON.stringify(deckToJSON(deck, cards), null, 2), 'application/json');
    } else {
      download(`${safeFilename(deck.name)}.csv`, cardsToCSV(cards), 'text/csv;charset=utf-8');
    }
    toast('Archivo exportado', 'ok');
  };

  // ---------- Importar JSON (mazo completo) ----------
  const jsonInput = h('input', { type: 'file', accept: '.json,application/json', class: 'input' });
  jsonInput.addEventListener('change', () => handleJSON(jsonInput.files[0], preview));

  // ---------- Importar CSV (tarjetas) ----------
  const csvInput = h('input', { type: 'file', accept: '.csv,text/csv', class: 'input' });
  csvInput.addEventListener('change', () => handleCSV(csvInput.files[0], decks, preview));

  mount(root, [
    h('nav', { class: 'breadcrumb' }, [h('a', { href: '#/' }, 'Inicio'), ' · Importar / Exportar']),
    h('h1', { class: 'page-title' }, 'Importar y exportar'),

    h('div', { class: 'subject-head' }, [h('h2', {}, 'Exportar un mazo')]),
    h('p', { class: 'muted' }, 'Descarga un mazo para respaldarlo o compartirlo con tu grupo.'),
    h('div', { class: 'actions-row' }, [
      exportSelect,
      h('button', { class: 'btn', onClick: () => doExport('json'), disabled: !decks.length }, 'Exportar mazo (.json)'),
      h('button', { class: 'btn', onClick: () => doExport('csv'), disabled: !decks.length }, 'Exportar tarjetas (.csv)'),
    ]),

    h('div', { class: 'subject-head' }, [h('h2', {}, 'Importar un mazo (.json)')]),
    h('p', { class: 'muted' }, 'Abre un mazo exportado desde StudyFlow. Se creará como un mazo nuevo.'),
    jsonInput,

    h('div', { class: 'subject-head' }, [h('h2', {}, 'Importar tarjetas (.csv)')]),
    h('p', { class: 'muted' }, 'Columnas: pregunta, respuesta, etiquetas (opcional). La primera fila puede ser el encabezado.'),
    csvInput,

    h('div', { style: 'margin-top:18px' }, preview),
  ]);

  return root;
}

function labelOf(d) {
  return d.grade ? `${d.subject || d.name} · ${d.grade}°` : (d.subject || d.name);
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error('No se seleccionó ningún archivo.')); return; }
    if (file.size > MAX_BYTES) { reject(new Error('El archivo supera el límite de 2 MB.')); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsText(file);
  });
}

// ---------- JSON ----------

async function handleJSON(file, preview) {
  try {
    const text = await readFile(file);
    let obj;
    try { obj = JSON.parse(text); }
    catch { throw new Error('El archivo no es un JSON válido.'); }
    const { deck, cards } = jsonToDeck(obj);

    mount(preview, h('div', { class: 'notice' }, [
      h('strong', {}, 'Vista previa del mazo'), h('br'),
      `Nombre: ${deck.name}`, h('br'),
      deck.subject ? [`Materia: ${deck.subject}`, h('br')] : null,
      deck.grade ? [`Grado: ${deck.grade}°`, h('br')] : null,
      `Tarjetas válidas: ${cards.length}`,
      h('div', { class: 'modal-actions', style: 'justify-content:flex-start;margin-top:14px' }, [
        h('button', { class: 'btn btn-primary', disabled: cards.length === 0,
          onClick: async () => {
            const created = await repo.createDeck({ ...deck, origin: 'user' });
            for (const c of cards) await repo.createCard(created.id, c);
            toast(`Mazo importado (${cards.length} tarjetas)`, 'ok');
            navigate(`#/mazo/${created.id}`);
          } }, `Importar ${cards.length} tarjetas`),
        h('button', { class: 'btn', onClick: () => mount(preview, '') }, 'Cancelar'),
      ]),
    ]));
  } catch (err) {
    mount(preview, h('div', { class: 'notice' }, h('span', { class: 'error-text' }, String(err.message || err))));
  }
}

// ---------- CSV ----------

async function handleCSV(file, decks, preview) {
  try {
    const text = await readFile(file);
    const rows = parseCSV(text);
    const { cards, errors } = csvRowsToCards(rows);

    // destino: nuevo mazo o existente
    const newName = h('input', { class: 'input', placeholder: 'Nombre del nuevo mazo', value: 'Mazo importado' });
    const existingSel = h('select', { class: 'input' },
      [h('option', { value: '' }, '— Crear mazo nuevo —'),
       ...decks.map((d) => h('option', { value: d.id }, labelOf(d)))]);

    const sample = cards.slice(0, 5);

    const doImport = async () => {
      let deckId = existingSel.value;
      if (!deckId) {
        const created = await repo.createDeck({ name: newName.value.trim() || 'Mazo importado', origin: 'user' });
        deckId = created.id;
      }
      for (const c of cards) await repo.createCard(deckId, c);
      toast(`Importadas ${cards.length} tarjetas`, 'ok');
      navigate(`#/mazo/${deckId}`);
    };

    mount(preview, h('div', { class: 'notice' }, [
      h('strong', {}, 'Vista previa de la importación'), h('br'),
      `Tarjetas válidas: ${cards.length}`,
      errors.length ? h('div', { class: 'error-text', style: 'margin-top:6px' },
        `${errors.length} ${errors.length === 1 ? 'problema' : 'problemas'}: ` + errors.slice(0, 5).join(' ')) : null,

      sample.length ? h('div', { style: 'margin-top:10px' }, [
        h('div', { class: 'muted', style: 'margin-bottom:4px' }, 'Ejemplos:'),
        ...sample.map((c) => h('div', { class: 'card-item', style: 'margin-bottom:6px' }, [
          h('div', { class: 'main' }, [h('div', { class: 'front' }, c.front), h('div', { class: 'back' }, c.back)]),
        ])),
      ]) : null,

      h('div', { style: 'margin-top:12px' }, [
        h('div', { class: 'field' }, [h('label', {}, 'Destino'), existingSel]),
        h('div', { class: 'field', id: 'newnamewrap' }, [h('label', {}, 'Nombre (si es mazo nuevo)'), newName]),
      ]),

      h('div', { class: 'modal-actions', style: 'justify-content:flex-start' }, [
        h('button', { class: 'btn btn-primary', disabled: cards.length === 0, onClick: doImport },
          `Importar ${cards.length} tarjetas`),
        h('button', { class: 'btn', onClick: () => mount(preview, '') }, 'Cancelar'),
      ]),
    ]));

    existingSel.addEventListener('change', () => {
      document.getElementById('newnamewrap').style.display = existingSel.value ? 'none' : 'block';
    });
  } catch (err) {
    mount(preview, h('div', { class: 'notice' }, h('span', { class: 'error-text' }, String(err.message || err))));
  }
}
