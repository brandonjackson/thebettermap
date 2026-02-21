import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { useState, useCallback, useMemo } from 'react';
import SplitLayout from '../components/SplitLayout';
import MapView from '../components/MapView';
import ItemCard from '../components/ItemCard';
import { getCelebrationsInBounds } from '../services/celebrations';
import { DEFAULT_CENTER } from '../config';
import './Celebrate.css';

const TOWN_DEFAULTS = {
  'stoke-newington': { name: 'Stoke Newington', lat: 51.5633, lng: -0.0796 },
};

export default function Celebrate() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const town = location.state?.town || TOWN_DEFAULTS[slug] || { name: slug, lat: DEFAULT_CENTER[1], lng: DEFAULT_CENTER[0] };

  const [bounds, setBounds] = useState(null);

  const handleMoveEnd = useCallback((b) => {
    setBounds(b);
  }, []);

  const items = useMemo(() => {
    if (!bounds) return [];
    return getCelebrationsInBounds(slug, bounds).sort(
      (a, b) => (b.backerIds?.length || 0) - (a.backerIds?.length || 0)
    );
  }, [bounds, slug]);

  function handleMarkerClick(item) {
    navigate(`/town/${slug}/celebrate/${item.id}`);
  }

  const leftPanel = (
    <div className="celebrate-panel">
      <Link to={`/town/${slug}`} state={{ town }} className="back-link">&larr; Back to {town.name}</Link>
      <h1 className="celebrate-title">Celebrate what&rsquo;s beautiful</h1>
      <p className="celebrate-subtitle">
        Map the buildings, streets and places that make {town.name} special.
      </p>

      <Link to={`/town/${slug}/celebrate/submit`} state={{ town }} className="celebrate-submit-btn">
        + Add a celebration
      </Link>

      <div className="celebrate-items">
        {items.length === 0 && bounds && (
          <p className="celebrate-empty">No celebrations in this area yet. Share what you love!</p>
        )}
        {items.map((item) => (
          <ItemCard key={item.id} item={item} townSlug={slug} />
        ))}
      </div>
    </div>
  );

  const rightPanel = (
    <MapView
      center={[town.lng, town.lat]}
      zoom={14}
      markers={items}
      onMoveEnd={handleMoveEnd}
      onMarkerClick={handleMarkerClick}
    />
  );

  return <SplitLayout left={leftPanel} right={rightPanel} />;
}
