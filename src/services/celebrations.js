import { getCollection, setCollection } from './storage.js';

const KEY = 'celebrations';

export function getAllCelebrations() {
  return getCollection(KEY);
}

export function getCelebrationsByTown(townSlug) {
  return getCollection(KEY).filter((c) => c.townSlug === townSlug);
}

export function getCelebrationById(id) {
  return getCollection(KEY).find((c) => c.id === id) || null;
}

export function createCelebration({ townSlug, title, description, tags, lat, lng, photoUrl }) {
  const items = getCollection(KEY);
  const item = {
    id: crypto.randomUUID(),
    type: 'celebration',
    townSlug,
    title,
    description,
    tags: tags || { material: [], era: [], style: [], feeling: [] },
    lat,
    lng,
    photoUrl: photoUrl || null,
    backerIds: [],
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  setCollection(KEY, items);
  return item;
}

export function updateCelebration(id, updates) {
  const items = getCollection(KEY);
  const idx = items.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates };
  setCollection(KEY, items);
  return items[idx];
}

export function deleteCelebration(id) {
  const items = getCollection(KEY).filter((c) => c.id !== id);
  setCollection(KEY, items);
}

export function getCelebrationsInBounds(townSlug, bounds) {
  return getCelebrationsByTown(townSlug).filter(
    (c) => c.lng >= bounds.west && c.lng <= bounds.east && c.lat >= bounds.south && c.lat <= bounds.north
  );
}
