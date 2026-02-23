const GEOGRAPH_PHOTO_RE = /^https?:\/\/(www\.)?geograph\.org\.uk\/photo\/\d+$/;

export function isValidGeographPhotoUrl(url) {
  return GEOGRAPH_PHOTO_RE.test(url.trim());
}

/**
 * Scrape a Geograph photo page via the server-side proxy.
 * Returns { imageDataUrl, photographer, sourceUrl, credits }.
 */
export async function importFromGeograph(url) {
  const res = await fetch('/api/scrape-geograph', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: url.trim() }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to import from Geograph');
  }

  return data;
}
