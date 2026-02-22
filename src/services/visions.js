import { getCollection, setCollection } from './storage.js';
import { getCurrentUser } from './auth.js';

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

export function createVision({ townSlug, title, prompt, lat, lng, referenceImage, siteImage, maskImage, inspirationImages }) {
  const items = getCollection(KEY);
  const item = {
    id: crypto.randomUUID(),
    type: 'vision',
    townSlug,
    title,
    prompt,
    referenceImage: referenceImage || null,
    siteImage: siteImage || null,
    maskImage: maskImage || null,
    inspirationImages: inspirationImages || [],
    generatedImages: [],
    selectedImageIndex: null,
    published: false,
    lat,
    lng,
    backerIds: [],
    createdBy: getCurrentUser()?.id || null,
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

export function deleteVision(id) {
  const items = getCollection(KEY).filter((v) => v.id !== id);
  setCollection(KEY, items);
}

export function getVisionsInBounds(townSlug, bounds, { publishedOnly = false } = {}) {
  return getVisionsByTown(townSlug).filter(
    (v) => v.lng >= bounds.west && v.lng <= bounds.east && v.lat >= bounds.south && v.lat <= bounds.north
      && (!publishedOnly || v.published !== false)
  );
}
