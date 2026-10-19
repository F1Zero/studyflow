// ============================================================
// db.js — Envoltorio mínimo de IndexedDB (sin dependencias).
// Toda la persistencia es local en el navegador → funciona sin conexión.
// ============================================================

const DB_NAME = 'studyflow';
const DB_VERSION = 1;

let _dbPromise = null;

/** Abre (o crea) la base de datos y define el esquema. */
export function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = req.result;

      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('decks')) {
        const s = db.createObjectStore('decks', { keyPath: 'id' });
        s.createIndex('origin', 'origin', { unique: false });
      }
      if (!db.objectStoreNames.contains('cards')) {
        const s = db.createObjectStore('cards', { keyPath: 'id' });
        s.createIndex('deckId', 'deckId', { unique: false });
      }
      if (!db.objectStoreNames.contains('states')) {
        const s = db.createObjectStore('states', { keyPath: 'cardId' });
        s.createIndex('due', 'due', { unique: false });
        s.createIndex('deckId', 'deckId', { unique: false });
      }
      if (!db.objectStoreNames.contains('logs')) {
        const s = db.createObjectStore('logs', { keyPath: 'id' });
        s.createIndex('cardId', 'cardId', { unique: false });
        s.createIndex('reviewedAt', 'reviewedAt', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB bloqueada por otra pestaña'));
  });
  return _dbPromise;
}

function wrap(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txComplete(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transacción abortada'));
  });
}

export async function get(store, key) {
  const db = await openDB();
  return wrap(db.transaction(store, 'readonly').objectStore(store).get(key));
}

export async function getAll(store) {
  const db = await openDB();
  return wrap(db.transaction(store, 'readonly').objectStore(store).getAll());
}

export async function getAllByIndex(store, index, query) {
  const db = await openDB();
  return wrap(db.transaction(store, 'readonly').objectStore(store).index(index).getAll(query));
}

export async function count(store) {
  const db = await openDB();
  return wrap(db.transaction(store, 'readonly').objectStore(store).count());
}

export async function put(store, value) {
  const db = await openDB();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).put(value);
  await txComplete(tx);
  return value;
}

/** Escribe varios registros (posiblemente en varios stores) en una sola transacción. */
export async function putMany(entries) {
  // entries: [{ store, value }, ...]
  const db = await openDB();
  const stores = [...new Set(entries.map((e) => e.store))];
  const tx = db.transaction(stores, 'readwrite');
  for (const { store, value } of entries) tx.objectStore(store).put(value);
  await txComplete(tx);
}

export async function del(store, key) {
  const db = await openDB();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).delete(key);
  await txComplete(tx);
}

/** Borra varias claves de un mismo store en una transacción. */
export async function delMany(store, keys) {
  const db = await openDB();
  const tx = db.transaction(store, 'readwrite');
  for (const k of keys) tx.objectStore(store).delete(k);
  await txComplete(tx);
}

export async function clearAll() {
  const db = await openDB();
  const stores = ['meta', 'decks', 'cards', 'states', 'logs'];
  const tx = db.transaction(stores, 'readwrite');
  for (const s of stores) tx.objectStore(s).clear();
  await txComplete(tx);
}
