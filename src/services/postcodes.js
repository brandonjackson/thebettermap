import { MAPTILER_KEY } from '../config';

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function reverseGeocode(lng, lat) {
  try {
    const res = await fetch(
      `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_KEY}&types=municipality,neighbourhood,locality,place`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.features || data.features.length === 0) return null;
    return data.features[0].text || null;
  } catch {
    return null;
  }
}

export async function lookupPostcode(postcode) {
  const cleaned = postcode.replace(/\s+/g, '').toUpperCase();
  const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleaned)}`);
  if (!res.ok) {
    throw new Error('Postcode not found');
  }
  const data = await res.json();
  if (data.status !== 200 || !data.result) {
    throw new Error('Postcode not found');
  }
  const r = data.result;
  const name = r.parish || r.admin_ward || r.admin_district || 'Unknown';
  return {
    name,
    slug: slugify(name),
    lat: r.latitude,
    lng: r.longitude,
    postcode: r.postcode,
  };
}
