import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useState, useCallback, useMemo } from 'react';
import SplitLayout from '../components/SplitLayout';
import MapView from '../components/MapView';
import ItemCard from '../components/ItemCard';
import MaskCanvas from '../components/MaskCanvas';
import { useAuth } from '../contexts/AuthContext';
import { createVision, getVisionsInBounds } from '../services/visions';
import { saveImage } from '../services/imageStore';
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
  const { isLoggedIn } = useAuth();

  const [step, setStep] = useState('browse'); // browse | place | describe
  const [pin, setPin] = useState({ lat: town.lat, lng: town.lng });
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [siteImage, setSiteImage] = useState(null);
  const [maskImage, setMaskImage] = useState(null);
  const [inspirationImages, setInspirationImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [bounds, setBounds] = useState(null);

  const maxInspirationImages = siteImage ? 3 : 4;

  const handleMoveEnd = useCallback((b) => {
    setBounds(b);
    if (step === 'place' || step === 'describe') {
      setPin({ lat: b.center[1], lng: b.center[0] });
    }
  }, [step]);

  const existingVisions = useMemo(() => {
    if (!bounds) return [];
    return getVisionsInBounds(slug, bounds, { publishedOnly: true }).sort(
      (a, b) => (b.backerIds?.length || 0) - (a.backerIds?.length || 0)
    );
  }, [bounds, slug]);

  function handleSiteImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSiteImage(reader.result);
      setMaskImage(null);
    };
    reader.readAsDataURL(file);
  }

  function removeSiteImage() {
    setSiteImage(null);
    setMaskImage(null);
  }

  function handleInspirationImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (inspirationImages.length >= maxInspirationImages) return;
    const reader = new FileReader();
    reader.onload = () => {
      setInspirationImages((prev) => [...prev, reader.result]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function removeInspirationImage(index) {
    setInspirationImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !prompt.trim() || saving) return;

    setSaving(true);
    try {
      // Save images to IndexedDB to avoid localStorage size limits
      const siteImageRef = siteImage ? await saveImage(siteImage) : null;
      const maskImageRef = maskImage ? await saveImage(maskImage) : null;
      const inspirationRefs = await Promise.all(
        inspirationImages.map((img) => saveImage(img))
      );

      const item = createVision({
        townSlug: slug,
        title: title.trim(),
        prompt: prompt.trim(),
        lat: pin.lat,
        lng: pin.lng,
        siteImage: siteImageRef,
        maskImage: maskImageRef,
        inspirationImages: inspirationRefs,
      });

      navigate(`/town/${slug}/imagine/${item.id}`, { state: { town } });
    } catch {
      setSaving(false);
    }
  }

  function handleMarkerClick(item) {
    navigate(`/town/${slug}/imagine/${item.id}`);
  }

  let leftContent;

  if (step === 'browse') {
    leftContent = (
      <div className="imagine-panel">
        <Link to={`/town/${slug}`} state={{ town }} className="back-link">&larr; Back to the map</Link>
        <h1 className="imagine-title">Imagine something new</h1>
        <p className="imagine-subtitle">
          What could {town.name} become? Browse existing visions or create your own.
        </p>

        {isLoggedIn ? (
          <button className="imagine-start-btn" onClick={() => setStep('place')}>
            + Create a new vision
          </button>
        ) : (
          <Link to="/login" state={{ returnTo: location.pathname }} className="imagine-start-btn" style={{ textDecoration: 'none' }}>
            Sign in to create a vision
          </Link>
        )}

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
              placeholder="Describe what you'd love to see here. Be as vivid as you like &mdash; this will generate an image of your vision."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              required
            />
          </label>

          {/* Site Image Section */}
          <div className="imagine-section">
            <div className="imagine-section-header">
              <span className="imagine-section-title">Site photo</span>
              <span className="imagine-optional">(optional)</span>
            </div>
            <p className="imagine-section-hint">
              Upload a photo of the current location. The AI will draw on top of what&rsquo;s already in the scene.
            </p>

            {!siteImage ? (
              <label className="imagine-upload-btn">
                <span>+ Upload site photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSiteImage}
                  hidden
                />
              </label>
            ) : (
              <div className="imagine-site-image">
                <button type="button" className="imagine-site-remove" onClick={removeSiteImage}>
                  Remove photo
                </button>
                <p className="imagine-mask-hint">
                  Paint over the areas you want the AI to transform. Unpainted areas will be preserved.
                </p>
                <MaskCanvas image={siteImage} onMaskChange={setMaskImage} />
              </div>
            )}
          </div>

          {/* Inspiration Images Section */}
          <div className="imagine-section">
            <div className="imagine-section-header">
              <span className="imagine-section-title">Inspiration images</span>
              <span className="imagine-optional">(optional)</span>
            </div>
            <p className="imagine-section-hint">
              Add reference images to guide the style or content of your vision.
              {' '}Up to {maxInspirationImages} image{maxInspirationImages !== 1 ? 's' : ''}.
            </p>

            <div className="imagine-inspiration-grid">
              {inspirationImages.map((img, i) => (
                <div key={i} className="imagine-inspiration-item">
                  <img src={img} alt={`Inspiration ${i + 1}`} />
                  <button
                    type="button"
                    className="imagine-inspiration-remove"
                    onClick={() => removeInspirationImage(i)}
                  >
                    &times;
                  </button>
                </div>
              ))}
              {inspirationImages.length < maxInspirationImages && (
                <label className="imagine-inspiration-add">
                  <span>+</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleInspirationImage}
                    hidden
                  />
                </label>
              )}
            </div>
          </div>

          <button type="submit" className="form-submit" disabled={!title.trim() || !prompt.trim() || saving}>
            {saving ? 'Saving\u2026' : 'Save vision'}
          </button>
        </form>
      </div>
    );
  }

  const rightPanel = (
    <MapView
      center={[town.lng, town.lat]}
      zoom={18}
      markers={step === 'browse' ? existingVisions : []}
      onMoveEnd={handleMoveEnd}
      onMarkerClick={handleMarkerClick}
      showBullseye={step === 'place' || step === 'describe'}
      onBullseyeMove={(pos) => setPin(pos)}
    />
  );

  return <SplitLayout left={leftContent} right={rightPanel} />;
}
