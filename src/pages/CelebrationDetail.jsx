import { useParams, useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import SplitLayout from '../components/SplitLayout';
import MapView from '../components/MapView';
import SocialBar from '../components/SocialBar';
import StoredImage from '../components/StoredImage';
import { getCelebrationById } from '../services/celebrations';
import { DEFAULT_CENTER } from '../config';

const TOWN_DEFAULTS = {
  'stoke-newington': { name: 'Stoke Newington', lat: 51.5633, lng: -0.0796 },
};

export default function CelebrationDetail() {
  const { slug, id } = useParams();
  const location = useLocation();
  const town = location.state?.town || TOWN_DEFAULTS[slug] || { name: slug, lat: DEFAULT_CENTER[1], lng: DEFAULT_CENTER[0] };

  const [item, setItem] = useState(() => getCelebrationById(id));

  if (!item) {
    return (
      <div style={{ padding: 32 }}>
        <p>Not found.</p>
        <Link to={`/town/${slug}`}>Back to {town.name}</Link>
      </div>
    );
  }

  const allTags = [
    ...item.tags.material,
    ...item.tags.era,
    ...item.tags.style,
    ...item.tags.feeling,
  ];

  const leftPanel = (
    <div style={{ maxWidth: 480 }}>
      <Link to={`/town/${slug}`} state={{ town }} className="back-link">&larr; Back to {town.name}</Link>

      <span className="detail-type detail-type--celebration">Local Beauty</span>
      <h1 className="detail-title">{item.title}</h1>

      {allTags.length > 0 && (
        <div className="detail-tags">
          {allTags.map((tag) => (
            <span key={tag} className="detail-tag">{tag}</span>
          ))}
        </div>
      )}

      {item.photoUrl && (
        <div className="detail-photo">
          <StoredImage src={item.photoUrl} alt={item.title} />
        </div>
      )}

      <p className="detail-description">{item.description}</p>

      <SocialBar item={item} townSlug={slug} onUpdate={setItem} />
    </div>
  );

  const rightPanel = (
    <MapView
      center={[item.lng, item.lat]}
      zoom={16}
      markers={[item]}
    />
  );

  return <SplitLayout left={leftPanel} right={rightPanel} />;
}
