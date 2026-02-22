import { useState, useEffect } from 'react';
import { loadImage } from '../services/imageStore';

/**
 * Drop-in <img> replacement that resolves `idb:` references from IndexedDB.
 * Regular URLs are passed through unchanged.
 */
export default function StoredImage({ src, ...props }) {
  const [resolved, setResolved] = useState(() =>
    src && !src.startsWith('idb:') ? src : null
  );

  useEffect(() => {
    if (!src) {
      setResolved(null);
      return;
    }
    if (!src.startsWith('idb:')) {
      setResolved(src);
      return;
    }
    let cancelled = false;
    loadImage(src).then((url) => {
      if (!cancelled) setResolved(url);
    });
    return () => { cancelled = true; };
  }, [src]);

  if (!resolved) return null;
  return <img src={resolved} {...props} />;
}
