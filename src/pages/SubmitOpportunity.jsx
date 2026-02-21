import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useState, useCallback } from 'react';
import SplitLayout from '../components/SplitLayout';
import MapView from '../components/MapView';
import { createOpportunity } from '../services/opportunities';
import { OPPORTUNITY_CATEGORIES, DEFAULT_CENTER } from '../config';

const TOWN_DEFAULTS = {
  'stoke-newington': { name: 'Stoke Newington', lat: 51.5633, lng: -0.0796 },
};

export default function SubmitOpportunity() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const town = location.state?.town || TOWN_DEFAULTS[slug] || { name: slug, lat: DEFAULT_CENTER[1], lng: DEFAULT_CENTER[0] };

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(OPPORTUNITY_CATEGORIES[0]);
  const [pin, setPin] = useState({ lat: town.lat, lng: town.lng });

  const handleBullseyeMove = useCallback((pos) => {
    setPin(pos);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const item = createOpportunity({
      townSlug: slug,
      title: title.trim(),
      description: description.trim(),
      category,
      lat: pin.lat,
      lng: pin.lng,
    });

    navigate(`/town/${slug}/improve/${item.id}`);
  }

  const leftPanel = (
    <div style={{ maxWidth: 480 }}>
      <Link to={`/town/${slug}/improve`} state={{ town }} className="back-link">&larr; Back to issues</Link>
      <h1 style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '1.8rem', fontWeight: 600, margin: '0 0 8px' }}>
        Report an issue
      </h1>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: 24 }}>
        Position the pin on the map, then describe the issue.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label className="form-label">
          Title
          <input
            type="text"
            className="form-input"
            placeholder="Brief title for the issue"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label className="form-label">
          Category
          <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {OPPORTUNITY_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="form-label">
          Description
          <textarea
            className="form-input form-textarea"
            placeholder="Describe what you see and why it matters..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
          />
        </label>

        <button type="submit" className="form-submit" disabled={!title.trim() || !description.trim()}>
          Submit issue
        </button>
      </form>
    </div>
  );

  const rightPanel = (
    <MapView
      center={[town.lng, town.lat]}
      zoom={15}
      showBullseye
      onBullseyeMove={handleBullseyeMove}
    />
  );

  return <SplitLayout left={leftPanel} right={rightPanel} />;
}
