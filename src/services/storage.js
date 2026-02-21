const STORAGE_PREFIX = 'progressmap_';

export function getCollection(key) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCollection(key, data) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
}

export function getItem(key) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setItem(key, value) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

export function getUserId() {
  let id = localStorage.getItem(STORAGE_PREFIX + 'userId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_PREFIX + 'userId', id);
  }
  return id;
}

export function isSeeded() {
  return localStorage.getItem(STORAGE_PREFIX + 'seeded') === 'true';
}

export function markSeeded() {
  localStorage.setItem(STORAGE_PREFIX + 'seeded', 'true');
}
