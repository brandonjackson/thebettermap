import { getCollection, setCollection } from './storage.js';

const KEY = 'visions';

export function getAllVisions() {
  return getCollection(KEY);
}

export function getVisionsByTown(townSlug) {
  return getCollection(KEY).filter((v) => v.townSlug === townSlug);
}

export function getVisionById(id) {
  return getCollection(KEY).find((v) => v.id === id) || null;
}

export function createVision({ townSlug, title, prompt, lat, lng }) {
  const items = getCollection(KEY);
  const item = {
    id: crypto.randomUUID(),
    type: 'vision',
    townSlug,
    title,
    prompt,
    generatedImages: [],
    selectedImageIndex: null,
    lat,
    lng,
    backerIds: [],
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  setCollection(KEY, items);
  return item;
}

export function updateVision(id, updates) {
  const items = getCollection(KEY);
  const idx = items.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates };
  setCollection(KEY, items);
  return items[idx];
}

export function getVisionsInBounds(townSlug, bounds) {
  return getVisionsByTown(townSlug).filter(
    (v) => v.lng >= bounds.west && v.lng <= bounds.east && v.lat >= bounds.south && v.lat <= bounds.north
  );
}
