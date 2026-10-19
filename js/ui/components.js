// ============================================================
// components.js — Componentes de interfaz reutilizables.
// ============================================================

import { h, mount, clear } from './dom.js';

/** Muestra un aviso breve (toast). type: 'ok' | 'err' | ''. */
export function toast(message, type = '') {
  const root = document.getElementById('toast-root');
  const node = h('div', { class: `toast ${type}`, role: 'status' }, message);
  root.appendChild(node);
  setTimeout(() => {
    node.style.transition = 'opacity .3s';
    node.style.opacity = '0';
    setTimeout(() => node.remove(), 320);
  }, type === 'err' ? 3800 : 2400);
}

/**
 * Diálogo de confirmación. Devuelve Promise<boolean>.
 * Usado antes de acciones destructivas (eliminar, reiniciar).
 */
export function confirmDialog({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false }) {
  return new Promise((resolve) => {
    const dlg = document.getElementById('modal-root');
    const close = (val) => { dlg.close(); resolve(val); };

    const body = h('div', { class: 'modal-body' }, [
      h('h3', {}, title),
      message ? h('p', {}, message) : null,
      h('div', { class: 'modal-actions' }, [
        h('button', { class: 'btn', onClick: () => close(false) }, cancelLabel),
        h('button', {
          class: danger ? 'btn btn-danger' : 'btn btn-primary',
          onClick: () => close(true),
        }, confirmLabel),
      ]),
    ]);

    mount(dlg, body);
    dlg.onclose = () => resolve(false);
    dlg.showModal();
  });
}

/** Diálogo con un campo de texto. Devuelve Promise<string|null>. */
export function promptDialog({ title, message, placeholder = '', value = '', confirmLabel = 'Aceptar' }) {
  return new Promise((resolve) => {
    const dlg = document.getElementById('modal-root');
    const input = h('input', { class: 'input', placeholder, value, autofocus: true });
    const close = (val) => { dlg.close(); resolve(val); };

    const body = h('div', { class: 'modal-body' }, [
      h('h3', {}, title),
      message ? h('p', {}, message) : null,
      input,
      h('div', { class: 'modal-actions', style: 'margin-top:16px' }, [
        h('button', { class: 'btn', onClick: () => close(null) }, 'Cancelar'),
        h('button', { class: 'btn btn-primary', onClick: () => close(input.value) }, confirmLabel),
      ]),
    ]);

    mount(dlg, body);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') close(input.value); });
    dlg.showModal();
    setTimeout(() => input.focus(), 50);
  });
}

/** Barra superior con marca y enlace a perfil. */
export function topbar() {
  return h('header', { class: 'topbar' }, [
    h('a', { class: 'brand', href: '#/' }, [
      h('img', { class: 'logo', src: 'icons/icon.svg', alt: '' }),
      'StudyFlow',
    ]),
    h('nav', { class: 'topbar-right' }, [
      h('a', { class: 'topbar-link', href: '#/perfil' }, 'Perfil'),
    ]),
  ]);
}

/** Dibuja el armazón (topbar + contenido) dentro de #app. */
export function renderShell(contentNode) {
  const app = document.getElementById('app');
  clear(app);
  app.appendChild(topbar());
  app.appendChild(h('main', { class: 'content' }, contentNode));
  window.scrollTo(0, 0);
}

export function gradeText(grade) {
  if (!grade) return '';
  return `${grade}°`;
}

export function emptyState({ title, message, action }) {
  return h('div', { class: 'empty' }, [
    h('h3', {}, title),
    h('p', {}, message),
    action || null,
  ]);
}

/** Etiqueta de estado de una tarjeta FSRS para mostrar al usuario. */
export function stateLabel(state) {
  const map = { 0: 'Nueva', 1: 'Aprendiendo', 2: 'En repaso', 3: 'Reaprendiendo' };
  const s = typeof state === 'number' ? state : (state && state.state);
  return map[s] ?? '';
}
