import { useParams, useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import SplitLayout from '../components/SplitLayout';
import MapView from '../components/MapView';
import SocialBar from '../components/SocialBar';
import { getOpportunityById } from '../services/opportunities';
import { DEFAULT_CENTER } from '../config';

const TOWN_DEFAULTS = {
  'stoke-newington': { name: 'Stoke Newington', lat: 51.5633, lng: -0.0796 },
};

export default function OpportunityDetail() {
  const { slug, id } = useParams();
  const location = useLocation();
  const town = location.state?.town || TOWN_DEFAULTS[slug] || { name: slug, lat: DEFAULT_CENTER[1], lng: DEFAULT_CENTER[0] };

  const [item, setItem] = useState(() => getOpportunityById(id));

  if (!item) {
    return (
      <div style={{ padding: 32 }}>
        <p>Issue not found.</p>
        <Link to={`/town/${slug}`}>Back to the map</Link>
      </div>
    );
  }

  const leftPanel = (
    <div style={{ maxWidth: 480 }}>
      <Link to={`/town/${slug}`} state={{ town, mapCenter: { lat: item.lat, lng: item.lng } }} className="back-link">&larr; Back to the map</Link>

      <span className="detail-type detail-type--opportunity">Improvement</span>
      <h1 className="detail-title">{item.title}</h1>

      {item.category && <span className="detail-category">{item.category}</span>}

      {item.photoUrl && (
        <div className="detail-photo">
          <img src={item.photoUrl} alt={item.title} />
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
