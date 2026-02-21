import { getCollection, setCollection } from './storage.js';

const KEY = 'opportunities';

export function getAllOpportunities() {
  return getCollection(KEY);
}

export function getOpportunitiesByTown(townSlug) {
  return getCollection(KEY).filter((o) => o.townSlug === townSlug);
}

export function getOpportunityById(id) {
  return getCollection(KEY).find((o) => o.id === id) || null;
}

export function createOpportunity({ townSlug, title, description, category, lat, lng, photoUrl }) {
  const items = getCollection(KEY);
  const item = {
    id: crypto.randomUUID(),
    type: 'opportunity',
    townSlug,
    title,
    description,
    category,
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

export function updateOpportunity(id, updates) {
  const items = getCollection(KEY);
  const idx = items.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates };
  setCollection(KEY, items);
  return items[idx];
}

export function deleteOpportunity(id) {
  const items = getCollection(KEY).filter((o) => o.id !== id);
  setCollection(KEY, items);
}

export function getOpportunitiesInBounds(townSlug, bounds) {
  return getOpportunitiesByTown(townSlug).filter(
    (o) => o.lng >= bounds.west && o.lng <= bounds.east && o.lat >= bounds.south && o.lat <= bounds.north
  );
}
