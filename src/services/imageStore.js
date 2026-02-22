const DB_NAME = 'progressmap_images';
const STORE_NAME = 'images';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Store a base64 data URL in IndexedDB. Regular URLs are returned as-is.
 * Returns a reference string: `idb:<uuid>` for stored images, or the original URL.
 */
export async function saveImage(dataUrl) {
  if (!dataUrl.startsWith('data:')) return dataUrl;

  const id = crypto.randomUUID();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(dataUrl, id);
    tx.oncomplete = () => resolve(`idb:${id}`);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Resolve an image reference. `idb:<id>` refs are loaded from IndexedDB;
 * regular URLs are returned as-is.
 */
export async function loadImage(ref) {
  if (!ref || !ref.startsWith('idb:')) return ref;

  const id = ref.slice(4);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}
