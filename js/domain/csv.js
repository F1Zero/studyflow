// ============================================================
// csv.js — Utilidades de importación/exportación (CSV y mazos JSON)
// y descarga de archivos en el navegador. Sin dependencias.
// ============================================================

/** Genera CSV a partir de tarjetas. Columnas: pregunta, respuesta, etiquetas. */
export function cardsToCSV(cards) {
  const esc = (v) => {
    const s = String(v == null ? '' : v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = ['pregunta,respuesta,etiquetas'];
  for (const c of cards) {
    lines.push([esc(c.front), esc(c.back), esc((c.tags || []).join('; '))].join(','));
  }
  return lines.join('\r\n');
}

/**
 * Analiza un texto CSV respetando comillas y saltos de línea.
 * Devuelve un arreglo de arreglos (filas de celdas).
 */
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  // Normaliza saltos de línea y quita BOM.
  text = text.replace(/^﻿/, '');

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (ch === '\r') { /* ignora; el \n cierra la fila */ }
      else field += ch;
    }
  }
  // último campo/fila
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length && !(r.length === 1 && r[0].trim() === ''));
}

const SEP_TAGS = /[;,]/;

/**
 * Convierte filas CSV en tarjetas candidatas, detectando encabezado.
 * Devuelve { cards, errors } para una vista previa validada.
 */
export function csvRowsToCards(rows) {
  const errors = [];
  const cards = [];
  if (!rows.length) return { cards, errors: ['El archivo está vacío.'] };

  let start = 0;
  const first = rows[0].map((c) => c.trim().toLowerCase());
  const looksHeader = first[0] && /pregunta|front|anverso/.test(first[0]);
  if (looksHeader) start = 1;

  for (let i = start; i < rows.length; i++) {
    const r = rows[i];
    const front = (r[0] || '').trim();
    const back = (r[1] || '').trim();
    const tags = (r[2] || '').split(SEP_TAGS).map((t) => t.trim()).filter(Boolean);
    const lineNo = i + 1;
    if (!front && !back) continue; // fila vacía: la saltamos sin error
    if (!front) { errors.push(`Fila ${lineNo}: falta la pregunta.`); continue; }
    if (!back) { errors.push(`Fila ${lineNo}: falta la respuesta.`); continue; }
    if (front.length > 2000 || back.length > 2000) {
      errors.push(`Fila ${lineNo}: texto demasiado largo (máx. 2000 caracteres).`); continue;
    }
    cards.push({ front, back, tags });
  }
  if (!cards.length && !errors.length) errors.push('No se encontraron tarjetas válidas.');
  return { cards, errors };
}

/** Exporta un mazo completo (metadatos + tarjetas) a un objeto JSON. */
export function deckToJSON(deck, cards) {
  return {
    app: 'StudyFlow',
    type: 'deck',
    version: 1,
    exportedAt: new Date().toISOString(),
    deck: {
      name: deck.name,
      subject: deck.subject,
      grade: deck.grade,
      description: deck.description,
      shareCode: deck.shareCode,
    },
    cards: (cards || []).map((c) => ({ front: c.front, back: c.back, tags: c.tags || [] })),
  };
}

/** Valida y normaliza un JSON de mazo importado. Lanza error si es inválido. */
export function jsonToDeck(obj) {
  if (!obj || obj.type !== 'deck' || !obj.deck) {
    throw new Error('El archivo no es un mazo de StudyFlow válido.');
  }
  const d = obj.deck;
  const cards = Array.isArray(obj.cards) ? obj.cards : [];
  const clean = cards
    .map((c) => ({
      front: String(c.front || '').trim(),
      back: String(c.back || '').trim(),
      tags: Array.isArray(c.tags) ? c.tags.map((t) => String(t).trim()).filter(Boolean) : [],
    }))
    .filter((c) => c.front && c.back);
  return {
    deck: {
      name: String(d.name || 'Mazo importado').trim(),
      subject: String(d.subject || '').trim(),
      grade: d.grade != null ? Number(d.grade) || null : null,
      description: String(d.description || '').trim(),
    },
    cards: clean,
  };
}

/** Dispara la descarga de un archivo generado en el navegador. */
export function download(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Nombre de archivo seguro a partir de un texto. */
export function safeFilename(name) {
  return String(name || 'mazo')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '_') || 'mazo';
}
