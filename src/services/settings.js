import { getItem, setItem } from './storage';

const SETTINGS_KEY = 'settings';

const DEFAULTS = {
  imageProvider: 'openai', // 'openai' or 'gemini'
};

export function getSettings() {
  return { ...DEFAULTS, ...getItem(SETTINGS_KEY) };
}

export function updateSettings(updates) {
  const current = getSettings();
  setItem(SETTINGS_KEY, { ...current, ...updates });
}

export function getImageProvider() {
  return getSettings().imageProvider;
}

export function setImageProvider(provider) {
  updateSettings({ imageProvider: provider });
}
