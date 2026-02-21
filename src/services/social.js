import { getCollection, setCollection } from './storage.js';
import { updateOpportunity, getOpportunityById } from './opportunities.js';
import { updateVision, getVisionById } from './visions.js';
import { updateCelebration, getCelebrationById } from './celebrations.js';
import { getCurrentUser } from './auth.js';

const COMMENTS_KEY = 'comments';

function getItemAndUpdater(itemType, itemId) {
  switch (itemType) {
    case 'opportunity':
      return { item: getOpportunityById(itemId), update: updateOpportunity };
    case 'vision':
      return { item: getVisionById(itemId), update: updateVision };
    case 'celebration':
      return { item: getCelebrationById(itemId), update: updateCelebration };
    default:
      return { item: null, update: null };
  }
}

export function toggleBack(itemType, itemId) {
  const user = getCurrentUser();
  if (!user) return null;

  const { item, update } = getItemAndUpdater(itemType, itemId);
  if (!item || !update) return null;

  const backerIds = item.backerIds || [];
  const idx = backerIds.indexOf(user.id);
  if (idx === -1) {
    backerIds.push(user.id);
  } else {
    backerIds.splice(idx, 1);
  }
  return update(itemId, { backerIds });
}

export function hasUserBacked(itemType, itemId) {
  const user = getCurrentUser();
  if (!user) return false;

  const { item } = getItemAndUpdater(itemType, itemId);
  if (!item) return false;
  return (item.backerIds || []).includes(user.id);
}

export function getBackerCount(item) {
  return (item.backerIds || []).length;
}

export function getComments(itemId) {
  return getCollection(COMMENTS_KEY).filter((c) => c.itemId === itemId);
}

export function addComment(itemId, itemType, text) {
  const user = getCurrentUser();
  const comments = getCollection(COMMENTS_KEY);
  const comment = {
    id: crypto.randomUUID(),
    itemId,
    itemType,
    userId: user?.id || null,
    author: user?.displayName || 'Anonymous',
    text,
    createdAt: new Date().toISOString(),
  };
  comments.push(comment);
  setCollection(COMMENTS_KEY, comments);
  return comment;
}

export function getShareUrl(itemType, townSlug, itemId) {
  const journeyPath = itemType === 'opportunity' ? 'improve' : itemType === 'vision' ? 'imagine' : 'celebrate';
  return `${window.location.origin}/town/${townSlug}/${journeyPath}/${itemId}`;
}
