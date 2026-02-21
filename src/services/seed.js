import { getCollection, setCollection, isSeeded, markSeeded } from './storage.js';

const TOWN_SLUG = 'stoke-newington';

const SEED_CELEBRATIONS = [
  {
    id: 'seed-clissold-park',
    type: 'celebration',
    townSlug: TOWN_SLUG,
    title: 'Clissold Park',
    description:
      'A beautiful Victorian park with deer enclosures, a butterfly dome, aviaries and a grand mansion house. The park stretches along the New River with mature London planes and wide open lawns — a true breathing space in the heart of Stoke Newington.',
    tags: { material: [], era: ['Victorian'], style: ['Classical'], feeling: ['Peaceful', 'Grand'] },
    lat: 51.5613,
    lng: -0.0875,
    photoUrl: null,
    backerIds: ['seed-user-1', 'seed-user-2', 'seed-user-3', 'seed-user-4', 'seed-user-5'],
    createdAt: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 'seed-abney-park',
    type: 'celebration',
    townSlug: TOWN_SLUG,
    title: 'Abney Park Cemetery',
    description:
      'One of the "Magnificent Seven" Victorian cemeteries, now a woodland nature reserve. Gothic memorials stand among wild woodland, creating an atmosphere that is both solemn and enchanting. A sanctuary for wildlife and contemplation in the middle of the city.',
    tags: { material: ['Stone'], era: ['Victorian'], style: ['Gothic'], feeling: ['Historic', 'Peaceful'] },
    lat: 51.5638,
    lng: -0.0779,
    photoUrl: null,
    backerIds: ['seed-user-1', 'seed-user-3', 'seed-user-5', 'seed-user-6'],
    createdAt: '2025-01-16T10:00:00.000Z',
  },
  {
    id: 'seed-church-street',
    type: 'celebration',
    townSlug: TOWN_SLUG,
    title: 'Stoke Newington Church Street',
    description:
      'A charming high street lined with independent shops, cafes and restaurants. Georgian and Victorian shopfronts give the street a village character rare in London. The mix of bookshops, delis, and neighbourhood pubs makes it a genuine community gathering place.',
    tags: { material: ['Brick'], era: ['Georgian', 'Victorian'], style: ['Vernacular'], feeling: ['Vibrant', 'Intimate'] },
    lat: 51.5627,
    lng: -0.0788,
    photoUrl: null,
    backerIds: ['seed-user-2', 'seed-user-4', 'seed-user-6', 'seed-user-7', 'seed-user-8'],
    createdAt: '2025-01-17T10:00:00.000Z',
  },
  {
    id: 'seed-new-river-walk',
    type: 'celebration',
    townSlug: TOWN_SLUG,
    title: 'New River Walk',
    description:
      'A peaceful tree-lined path following the course of the historic New River, built in 1613 to bring fresh water to London. Weeping willows, wildflowers, and quiet benches make this one of the most serene walks in Hackney.',
    tags: { material: [], era: ['Victorian'], style: ['Vernacular'], feeling: ['Peaceful', 'Historic'] },
    lat: 51.5588,
    lng: -0.0823,
    photoUrl: null,
    backerIds: ['seed-user-1', 'seed-user-7', 'seed-user-8'],
    createdAt: '2025-01-18T10:00:00.000Z',
  },
  {
    id: 'seed-st-marys-old-church',
    type: 'celebration',
    townSlug: TOWN_SLUG,
    title: "St Mary's Old Church",
    description:
      'A medieval church dating back to the 13th century, one of the oldest surviving buildings in Hackney. The quiet churchyard with its ancient yew trees feels like a portal to another era, standing peacefully beside the bustle of Church Street.',
    tags: { material: ['Stone'], era: ['Georgian'], style: ['Classical'], feeling: ['Historic', 'Majestic'] },
    lat: 51.563,
    lng: -0.0775,
    photoUrl: null,
    backerIds: ['seed-user-2', 'seed-user-5', 'seed-user-6', 'seed-user-7'],
    createdAt: '2025-01-19T10:00:00.000Z',
  },
  {
    id: 'seed-clissold-house',
    type: 'celebration',
    townSlug: TOWN_SLUG,
    title: 'Clissold House',
    description:
      'A Grade II listed Palladian mansion at the heart of Clissold Park. Beautifully restored as a community cafe and events space, it combines classical elegance with warm, everyday use — architecture serving the public as it should.',
    tags: { material: ['Stone', 'Brick'], era: ['Georgian'], style: ['Classical'], feeling: ['Grand', 'Intimate'] },
    lat: 51.5612,
    lng: -0.087,
    photoUrl: null,
    backerIds: ['seed-user-3', 'seed-user-4', 'seed-user-8'],
    createdAt: '2025-01-20T10:00:00.000Z',
  },
  {
    id: 'seed-castle-climbing',
    type: 'celebration',
    townSlug: TOWN_SLUG,
    title: 'The Castle Climbing Centre',
    description:
      'A spectacular Victorian Gothic pumping station transformed into an indoor climbing centre. The turreted red-brick exterior is one of the most striking buildings in the area — a bold example of adaptive reuse that gives new life to industrial heritage.',
    tags: { material: ['Brick'], era: ['Victorian'], style: ['Gothic'], feeling: ['Grand', 'Playful'] },
    lat: 51.5575,
    lng: -0.0868,
    photoUrl: null,
    backerIds: ['seed-user-1', 'seed-user-2', 'seed-user-4', 'seed-user-6', 'seed-user-7', 'seed-user-8'],
    createdAt: '2025-01-21T10:00:00.000Z',
  },
  {
    id: 'seed-stoke-newington-library',
    type: 'celebration',
    townSlug: TOWN_SLUG,
    title: 'Stoke Newington Library',
    description:
      'A handsome Edwardian free library on Church Street, with an ornate terracotta facade and tall arched windows. Still serving the community as a public library over a century after it opened — civic architecture at its finest.',
    tags: { material: ['Brick', 'Stone'], era: ['Edwardian'], style: ['Classical'], feeling: ['Grand', 'Historic'] },
    lat: 51.5617,
    lng: -0.0796,
    photoUrl: null,
    backerIds: ['seed-user-3', 'seed-user-5'],
    createdAt: '2025-01-22T10:00:00.000Z',
  },
  {
    id: 'seed-st-pauls-shacklewell',
    type: 'celebration',
    townSlug: TOWN_SLUG,
    title: "St Paul's Church, Shacklewell Row",
    description:
      'An elegant early Victorian church with a fine spire visible from across the neighbourhood. The clean proportions and surrounding green space make it a graceful landmark at the southern edge of Stoke Newington.',
    tags: { material: ['Stone'], era: ['Victorian'], style: ['Classical'], feeling: ['Majestic', 'Peaceful'] },
    lat: 51.5582,
    lng: -0.0744,
    photoUrl: null,
    backerIds: ['seed-user-1', 'seed-user-6'],
    createdAt: '2025-01-23T10:00:00.000Z',
  },
  {
    id: 'seed-butterfield-green',
    type: 'celebration',
    townSlug: TOWN_SLUG,
    title: 'Butterfield Green',
    description:
      'A small but cherished green space at the junction of several roads, bordered by mature trees. With its playground, benches and community feel, it captures the village character that makes Stoke Newington special.',
    tags: { material: [], era: [], style: ['Vernacular'], feeling: ['Intimate', 'Vibrant'] },
    lat: 51.5645,
    lng: -0.0807,
    photoUrl: null,
    backerIds: ['seed-user-2', 'seed-user-7', 'seed-user-8'],
    createdAt: '2025-01-24T10:00:00.000Z',
  },
];

const SEED_OPPORTUNITIES = [
  {
    id: 'seed-opp-green-lanes',
    type: 'opportunity',
    townSlug: TOWN_SLUG,
    title: 'Green Lanes pedestrian crossing improvements',
    description:
      'The crossing at Green Lanes near Clissold Park is dangerous for pedestrians, especially families with children visiting the park. A raised crossing or traffic calming measures would make a real difference.',
    category: 'Infrastructure gap',
    lat: 51.5605,
    lng: -0.0886,
    photoUrl: null,
    backerIds: ['seed-user-1', 'seed-user-3', 'seed-user-5'],
    createdAt: '2025-02-01T10:00:00.000Z',
  },
  {
    id: 'seed-opp-albion-road',
    type: 'opportunity',
    townSlug: TOWN_SLUG,
    title: 'Albion Road pavement resurfacing',
    description:
      'The pavements along Albion Road are cracked and uneven, making them difficult for wheelchair users and pushchairs. Several tree roots have lifted the paving slabs.',
    category: 'Poor maintenance',
    lat: 51.5622,
    lng: -0.0835,
    photoUrl: null,
    backerIds: ['seed-user-2', 'seed-user-4'],
    createdAt: '2025-02-05T10:00:00.000Z',
  },
];

export function seedDatabase() {
  if (isSeeded()) return;

  const celebrations = getCollection('celebrations');
  setCollection('celebrations', [...celebrations, ...SEED_CELEBRATIONS]);

  const opportunities = getCollection('opportunities');
  setCollection('opportunities', [...opportunities, ...SEED_OPPORTUNITIES]);

  markSeeded();
}
