// ============================================================
// profile.js — Perfil, estadísticas y gestión de datos.
// ============================================================

import { h } from '../ui/dom.js';
import { navigate, render } from '../router.js';
import { toast, confirmDialog } from '../ui/components.js';
import * as repo from '../store/repo.js';
import { ensureSeed } from '../data/seed.js';
import * as db from '../store/db.js';

export async function profileView() {
  const now = new Date();
  const [profile, ov, streak, reviewed] = await Promise.all([
    repo.getProfile(),
    repo.overview(now),
    repo.getStreak(),
    repo.reviewedToday(now),
  ]);

  const name = h('input', { class: 'input', value: profile.displayName || '', placeholder: 'Tu nombre' });
  const role = h('select', { class: 'input' }, [
    h('option', { value: 'docente', selected: profile.role === 'docente' }, 'Docente'),
    h('option', { value: 'alumno', selected: profile.role === 'alumno' }, 'Alumno/a'),
  ]);

  const saveProfile = async () => {
    await repo.setProfile({ displayName: name.value.trim(), role: role.value });
    toast('Perfil guardado', 'ok');
  };

  const field = (label, control) => h('div', { class: 'field' }, [h('label', {}, label), control]);

  const stat = (label, value) => h('div', { class: 'stat' }, [
    h('div', { class: 'label' }, label),
    h('div', { class: 'value' }, value),
  ]);

  return [
    h('nav', { class: 'breadcrumb' }, [h('a', { href: '#/' }, 'Inicio'), ' · Perfil']),
    h('h1', { class: 'page-title' }, 'Perfil'),

    h('div', { class: 'stat-grid' }, [
      stat('Mazos', String(ov.deckCount)),
      stat('Tarjetas', String(ov.cardCount)),
      stat('Racha', `${streak.count} ${streak.count === 1 ? 'día' : 'días'}`),
    ]),
    h('p', { class: 'muted' },
      `Hoy: ${reviewed.reviews} ${reviewed.reviews === 1 ? 'repaso' : 'repasos'} · ${ov.dueCount} pendientes.`),

    h('div', { style: 'max-width:420px;margin-top:18px' }, [
      field('Nombre', name),
      field('Rol', role),
      h('button', { class: 'btn btn-primary', onClick: saveProfile }, 'Guardar perfil'),
    ]),

    h('div', { class: 'subject-head' }, [h('h2', {}, 'Datos y privacidad')]),
    h('div', { class: 'notice' },
      'Toda tu información (mazos, tarjetas y progreso) se guarda únicamente en este dispositivo y navegador. ' +
      'Nada se envía a servidores. Por eso la app funciona sin conexión.'),

    h('div', { class: 'actions-row' }, [
      h('a', { class: 'btn', href: '#/transferir' }, 'Importar / Exportar'),
      h('button', { class: 'btn', onClick: restoreSeed }, 'Restaurar mazos de secundaria'),
      h('button', { class: 'btn btn-danger', onClick: wipe }, 'Borrar todos mis datos'),
    ]),
  ];
}

async function restoreSeed() {
  // Vuelve a cargar los mazos incluidos si ya no están (no duplica si existen).
  const added = await ensureSeed();
  if (added) { toast('Mazos de secundaria restaurados', 'ok'); render(); }
  else toast('Los mazos de secundaria ya están cargados', '');
}

async function wipe() {
  const ok = await confirmDialog({
    title: '¿Borrar todos tus datos?',
    message: 'Se eliminarán todos los mazos, tarjetas y tu progreso de este dispositivo. No se puede deshacer.',
    confirmLabel: 'Borrar todo',
    danger: true,
  });
  if (!ok) return;
  await repo.wipeEverything();
  await ensureSeed(); // deja la app con los mazos incluidos de nuevo
  toast('Datos borrados', 'ok');
  navigate('#/');
}
