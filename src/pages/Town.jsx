import { useParams, useLocation, Link } from 'react-router-dom';
import { useState, useCallback, useMemo } from 'react';
import SplitLayout from '../components/SplitLayout';
import MapView from '../components/MapView';
import ItemCard from '../components/ItemCard';
import { getCelebrationsInBounds } from '../services/celebrations';
import { getOpportunitiesInBounds } from '../services/opportunities';
import { getVisionsInBounds } from '../services/visions';
import { DEFAULT_CENTER } from '../config';
import './Town.css';

const TOWN_DEFAULTS = {
  'stoke-newington': { name: 'Stoke Newington', lat: 51.5633, lng: -0.0796 },
};

export default function Town() {
  const { slug } = useParams();
  const location = useLocation();
  const town = location.state?.town || TOWN_DEFAULTS[slug] || { name: slug, lat: DEFAULT_CENTER[1], lng: DEFAULT_CENTER[0] };

  const [bounds, setBounds] = useState(null);
  const [activeTab, setActiveTab] = useState(null);

  const handleMoveEnd = useCallback((b) => {
    setBounds(b);
  }, []);

  const items = useMemo(() => {
    if (!bounds) return [];
    const opps = getOpportunitiesInBounds(slug, bounds);
    const visions = getVisionsInBounds(slug, bounds);
    const celebrations = getCelebrationsInBounds(slug, bounds);
    return [...opps, ...visions, ...celebrations].sort(
      (a, b) => (b.backerIds?.length || 0) - (a.backerIds?.length || 0)
    );
  }, [bounds, slug]);

  const markers = items;

  const filteredItems = activeTab ? items.filter((i) => i.type === activeTab) : items;

  const leftPanel = (
    <div className="town-panel">
      <h1 className="town-name">{town.name}</h1>
      <p className="town-subtitle">What do you want to do here?</p>

      <div className="town-journeys">
        <Link to={`/town/${slug}/improve`} state={{ town }} className="town-journey town-journey--improve">
          <div className="town-journey-icon" />
          <div>
            <h2>Find something to fix</h2>
            <p>Spot issues and opportunities for improvement</p>
          </div>
        </Link>
        <Link to={`/town/${slug}/imagine`} state={{ town }} className="town-journey town-journey--imagine">
          <div className="town-journey-icon" />
          <div>
            <h2>Imagine something new</h2>
            <p>Envision what this place could become</p>
          </div>
        </Link>
        <Link to={`/town/${slug}/celebrate`} state={{ town }} className="town-journey town-journey--celebrate">
          <div className="town-journey-icon" />
          <div>
            <h2>Local beauty</h2>
            <p>Map the places that make this area special</p>
          </div>
        </Link>
      </div>

      {items.length > 0 && (
        <>
          <div className="town-filter-bar">
            <button className={`town-filter ${!activeTab ? 'town-filter--active' : ''}`} onClick={() => setActiveTab(null)}>All</button>
            <button className={`town-filter ${activeTab === 'opportunity' ? 'town-filter--active' : ''}`} onClick={() => setActiveTab('opportunity')}>Issues</button>
            <button className={`town-filter ${activeTab === 'vision' ? 'town-filter--active' : ''}`} onClick={() => setActiveTab('vision')}>Visions</button>
            <button className={`town-filter ${activeTab === 'celebration' ? 'town-filter--active' : ''}`} onClick={() => setActiveTab('celebration')}>Local Beauty</button>
          </div>
          <div className="town-items">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} townSlug={slug} />
            ))}
          </div>
        </>
      )}
    </div>
  );

  const rightPanel = (
    <MapView
      center={[town.lng, town.lat]}
      zoom={14}
      markers={markers}
      onMoveEnd={handleMoveEnd}
    />
  );

  return <SplitLayout left={leftPanel} right={rightPanel} />;
}
