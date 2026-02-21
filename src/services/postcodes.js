function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
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
