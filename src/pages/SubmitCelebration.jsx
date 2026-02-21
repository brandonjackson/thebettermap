import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useState, useCallback } from 'react';
import SplitLayout from '../components/SplitLayout';
import MapView from '../components/MapView';
import { createCelebration } from '../services/celebrations';
import { CELEBRATION_TAGS, DEFAULT_CENTER } from '../config';

const TOWN_DEFAULTS = {
  'stoke-newington': { name: 'Stoke Newington', lat: 51.5633, lng: -0.0796 },
};

export default function SubmitCelebration() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const town = location.state?.town || TOWN_DEFAULTS[slug] || { name: slug, lat: DEFAULT_CENTER[1], lng: DEFAULT_CENTER[0] };

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState({ material: [], era: [], style: [], feeling: [] });
  const [pin, setPin] = useState({ lat: town.lat, lng: town.lng });

  const handleBullseyeMove = useCallback((pos) => {
    setPin(pos);
  }, []);

  function toggleTag(category, value) {
    setTags((prev) => {
      const current = prev[category];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [category]: next };
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const item = createCelebration({
      townSlug: slug,
      title: title.trim(),
      description: description.trim(),
      tags,
      lat: pin.lat,
      lng: pin.lng,
    });

    navigate(`/town/${slug}/celebrate/${item.id}`);
  }

  const leftPanel = (
    <div style={{ maxWidth: 480 }}>
      <Link to={`/town/${slug}/celebrate`} state={{ town }} className="back-link">&larr; Back to celebrations</Link>
      <h1 style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '1.8rem', fontWeight: 600, margin: '0 0 8px' }}>
        Celebrate something beautiful
      </h1>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: 24 }}>
        Position the pin on the map, then tell us what makes this place special.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label className="form-label">
          Name
          <input
            type="text"
            className="form-input"
            placeholder="What is this place?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label className="form-label">
          What makes it special?
          <textarea
            className="form-input form-textarea"
            placeholder="Describe what you love about this place..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
        </label>

        {Object.entries(CELEBRATION_TAGS).map(([category, options]) => (
          <div key={category} className="form-tag-group">
            <span className="form-tag-label">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
            <div className="form-tags">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`form-tag ${tags[category].includes(opt) ? 'form-tag--selected' : ''}`}
                  onClick={() => toggleTag(category, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button type="submit" className="form-submit" disabled={!title.trim() || !description.trim()}>
          Save celebration
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
