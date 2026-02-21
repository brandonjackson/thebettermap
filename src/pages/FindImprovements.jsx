import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { useState, useCallback, useMemo } from 'react';
import SplitLayout from '../components/SplitLayout';
import MapView from '../components/MapView';
import ItemCard from '../components/ItemCard';
import { getOpportunitiesInBounds } from '../services/opportunities';
import { DEFAULT_CENTER } from '../config';
import './FindImprovements.css';

const TOWN_DEFAULTS = {
  'stoke-newington': { name: 'Stoke Newington', lat: 51.5633, lng: -0.0796 },
};

export default function FindImprovements() {
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
    return getOpportunitiesInBounds(slug, bounds).sort(
      (a, b) => (b.backerIds?.length || 0) - (a.backerIds?.length || 0)
    );
  }, [bounds, slug]);

  function handleMarkerClick(item) {
    navigate(`/town/${slug}/improve/${item.id}`);
  }

  const leftPanel = (
    <div className="find-panel">
      <Link to={`/town/${slug}`} state={{ town }} className="back-link">&larr; Back to {town.name}</Link>
      <h1 className="find-title">Find something to fix</h1>
      <p className="find-subtitle">
        Browse improvement opportunities in {town.name}, or submit your own.
      </p>

      <Link to={`/town/${slug}/improve/submit`} state={{ town }} className="find-submit-btn">
        + Report an issue
      </Link>

      <div className="find-items">
        {items.length === 0 && bounds && (
          <p className="find-empty">No issues reported in this area yet. Be the first!</p>
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
