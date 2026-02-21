import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useState, useCallback, useMemo } from 'react';
import SplitLayout from '../components/SplitLayout';
import MapView from '../components/MapView';
import ItemCard from '../components/ItemCard';
import { createVision, getVisionsInBounds } from '../services/visions';
import { DEFAULT_CENTER } from '../config';
import './ImagineNew.css';

const TOWN_DEFAULTS = {
  'stoke-newington': { name: 'Stoke Newington', lat: 51.5633, lng: -0.0796 },
};

export default function ImagineNew() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const town = location.state?.town || TOWN_DEFAULTS[slug] || { name: slug, lat: DEFAULT_CENTER[1], lng: DEFAULT_CENTER[0] };

  const [step, setStep] = useState('browse'); // browse | place | describe
  const [pin, setPin] = useState({ lat: town.lat, lng: town.lng });
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [bounds, setBounds] = useState(null);

  const handleMoveEnd = useCallback((b) => {
    setBounds(b);
    if (step === 'place' || step === 'describe') {
      setPin({ lat: b.center[1], lng: b.center[0] });
    }
  }, [step]);

  const existingVisions = useMemo(() => {
    if (!bounds) return [];
    return getVisionsInBounds(slug, bounds).sort(
      (a, b) => (b.backerIds?.length || 0) - (a.backerIds?.length || 0)
    );
  }, [bounds, slug]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !prompt.trim()) return;

    const item = createVision({
      townSlug: slug,
      title: title.trim(),
      prompt: prompt.trim(),
      lat: pin.lat,
      lng: pin.lng,
    });

    navigate(`/town/${slug}/imagine/${item.id}`);
  }

  function handleMarkerClick(item) {
    navigate(`/town/${slug}/imagine/${item.id}`);
  }

  let leftContent;

  if (step === 'browse') {
    leftContent = (
      <div className="imagine-panel">
        <Link to={`/town/${slug}`} state={{ town }} className="back-link">&larr; Back to {town.name}</Link>
        <h1 className="imagine-title">Imagine something new</h1>
        <p className="imagine-subtitle">
          What could {town.name} become? Browse existing visions or create your own.
        </p>

        <button className="imagine-start-btn" onClick={() => setStep('place')}>
          + Create a new vision
        </button>

        <div className="imagine-items">
          {existingVisions.length === 0 && bounds && (
            <p className="imagine-empty">No visions in this area yet. Be the first to imagine something!</p>
          )}
          {existingVisions.map((v) => (
            <ItemCard key={v.id} item={v} townSlug={slug} />
          ))}
        </div>
      </div>
    );
  } else if (step === 'place') {
    leftContent = (
      <div className="imagine-panel">
        <button className="back-link" onClick={() => setStep('browse')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          &larr; Back
        </button>
        <h1 className="imagine-title">Select a site</h1>
        <p className="imagine-subtitle">
          Move the map to position the bullseye over the location for your vision.
        </p>
        <button className="imagine-start-btn" onClick={() => setStep('describe')}>
          Confirm this location
        </button>
      </div>
    );
  } else {
    leftContent = (
      <div className="imagine-panel">
        <button className="back-link" onClick={() => setStep('place')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          &larr; Move pin
        </button>
        <h1 className="imagine-title">Describe your vision</h1>
        <p className="imagine-subtitle">What do you want to see here?</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label className="form-label">
            Name your vision
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Community garden on the vacant lot"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          <label className="form-label">
            Describe what you imagine
            <textarea
              className="form-input form-textarea"
              placeholder="Describe what you'd love to see here. Be as vivid as you like — in future this will feed an image generator..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              required
            />
          </label>

          <button type="submit" className="form-submit" disabled={!title.trim() || !prompt.trim()}>
            Save vision
          </button>
        </form>
      </div>
    );
  }

  const rightPanel = (
    <MapView
      center={[town.lng, town.lat]}
      zoom={14}
      markers={step === 'browse' ? existingVisions : []}
      onMoveEnd={handleMoveEnd}
      onMarkerClick={handleMarkerClick}
      showBullseye={step === 'place' || step === 'describe'}
      onBullseyeMove={(pos) => setPin(pos)}
    />
  );

  return <SplitLayout left={leftContent} right={rightPanel} />;
}
