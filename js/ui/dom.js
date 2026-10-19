// ============================================================
// dom.js — Utilidades mínimas para construir la interfaz sin framework.
// ============================================================

/**
 * Crea un elemento. Ejemplo:
 *   h('button', { class: 'btn', onClick: fn }, 'Guardar')
 *   h('div', { class: 'card' }, [h('h2', {}, 'Título'), texto])
 */
export function h(tag, props = {}, children = []) {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'html') el.innerHTML = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key in el && key !== 'list') {
      try { el[key] = value; } catch { el.setAttribute(key, value); }
    } else {
      el.setAttribute(key, value);
    }
  }

  appendChildren(el, children);
  return el;
}

export function appendChildren(el, children) {
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child == null || child === false) continue;
    if (Array.isArray(child)) { appendChildren(el, child); continue; }
    if (child instanceof Node) el.appendChild(child);
    else el.appendChild(document.createTextNode(String(child)));
  }
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function mount(el, node) {
  clear(el);
  appendChildren(el, node);
  return el;
}

/** Escapa texto para interpolación segura en HTML (evita XSS). */
export function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
