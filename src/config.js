export const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || 'get_your_free_key_at_maptiler.com';

export const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

export const DEFAULT_CENTER = [-0.0796, 51.5633]; // Stoke Newington
export const DEFAULT_ZOOM = 14;

export const OPPORTUNITY_CATEGORIES = [
  'Neglected public realm',
  'Underused land',
  'Infrastructure gap',
  'Poor maintenance',
  'Accessibility issue',
  'Environmental concern',
  'Safety concern',
  'Other',
];

export const CELEBRATION_TAGS = {
  material: ['Brick', 'Stone', 'Timber', 'Glass', 'Metal', 'Concrete', 'Tile'],
  era: ['Georgian', 'Victorian', 'Edwardian', 'Art Deco', 'Modernist', 'Contemporary'],
  style: ['Classical', 'Gothic', 'Arts & Crafts', 'Brutalist', 'Vernacular', 'Art Nouveau'],
  feeling: ['Grand', 'Intimate', 'Peaceful', 'Vibrant', 'Historic', 'Playful', 'Majestic'],
};

export const BACKING_THRESHOLDS = {
  featured: 5,
  highlighted: 10,
  landmark: 25,
};
