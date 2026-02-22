import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import SplitLayout from '../components/SplitLayout';
import MapView from '../components/MapView';
import ItemCard from '../components/ItemCard';
import MaskCanvas from '../components/MaskCanvas';
import { useAuth } from '../contexts/AuthContext';
import { getCelebrationsInBounds, createCelebration } from '../services/celebrations';
import { getOpportunitiesInBounds, createOpportunity } from '../services/opportunities';
import { getVisionsInBounds, createVision } from '../services/visions';
import { saveImage } from '../services/imageStore';
import { reverseGeocode } from '../services/postcodes';
import { OPPORTUNITY_CATEGORIES, CELEBRATION_TAGS, DEFAULT_CENTER } from '../config';
import './Town.css';

function ArrowIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 51 30" fill="none">
      <path d="M37.3171 0L34.8293 2.5L46.0244 13.75H0V16.5849H46.0244L34.8293 27.5L37.3171 30L51 16.25V13.75L37.3171 0Z" fill="currentColor" />
    </svg>
  );
}

const TOWN_DEFAULTS = {
  'stoke-newington': { name: 'Stoke Newington', lat: 51.5633, lng: -0.0796 },
};

export default function Town() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const town = location.state?.town || TOWN_DEFAULTS[slug] || { name: slug, lat: DEFAULT_CENTER[1], lng: DEFAULT_CENTER[0] };

  const [bounds, setBounds] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [locationName, setLocationName] = useState(town.name);
  const debounceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Journey state: null = hub view, 'improve' | 'imagine' | 'celebrate'
  const [journey, setJourney] = useState(null);
  // Step within a journey: 'place' | 'form'
  const [step, setStep] = useState(null);
  const [pin, setPin] = useState({ lat: town.lat, lng: town.lng });

  // Form state for "Report an issue"
  const [oppTitle, setOppTitle] = useState('');
  const [oppDescription, setOppDescription] = useState('');
  const [oppCategory, setOppCategory] = useState(OPPORTUNITY_CATEGORIES[0]);

  // Form state for "Imagine something new"
  const [visionTitle, setVisionTitle] = useState('');
  const [visionPrompt, setVisionPrompt] = useState('');
  const [siteImage, setSiteImage] = useState(null);
  const [maskImage, setMaskImage] = useState(null);
  const [inspirationImages, setInspirationImages] = useState([]);
  const [visionSaving, setVisionSaving] = useState(false);

  // Form state for "Record local beauty"
  const [celTitle, setCelTitle] = useState('');
  const [celDescription, setCelDescription] = useState('');
  const [celTags, setCelTags] = useState({ material: [], era: [], style: [], feeling: [] });

  const handleMoveEnd = useCallback((b) => {
    setBounds(b);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const name = await reverseGeocode(b.center[0], b.center[1]);
      if (name) setLocationName(name);
    }, 300);
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

  function startJourney(type) {
    if (!isLoggedIn) {
      navigate('/login', { state: { returnTo: location.pathname } });
      return;
    }
    setJourney(type);
    setStep('place');
    setPin({ lat: town.lat, lng: town.lng });
  }

  function cancelJourney() {
    setJourney(null);
    setStep(null);
    // Reset all form state
    setOppTitle('');
    setOppDescription('');
    setOppCategory(OPPORTUNITY_CATEGORIES[0]);
    setVisionTitle('');
    setVisionPrompt('');
    setSiteImage(null);
    setMaskImage(null);
    setInspirationImages([]);
    setVisionSaving(false);
    setCelTitle('');
    setCelDescription('');
    setCelTags({ material: [], era: [], style: [], feeling: [] });
  }

  function confirmLocation() {
    setStep('form');
  }

  const maxInspirationImages = siteImage ? 3 : 4;

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

  function toggleCelTag(category, value) {
    setCelTags((prev) => {
      const current = prev[category];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [category]: next };
    });
  }

  function handleSubmitOpportunity(e) {
    e.preventDefault();
    if (!oppTitle.trim() || !oppDescription.trim()) return;
    const item = createOpportunity({
      townSlug: slug,
      title: oppTitle.trim(),
      description: oppDescription.trim(),
      category: oppCategory,
      lat: pin.lat,
      lng: pin.lng,
    });
    cancelJourney();
    navigate(`/town/${slug}/improve/${item.id}`);
  }

  async function handleSubmitVision(e) {
    e.preventDefault();
    if (!visionTitle.trim() || !visionPrompt.trim() || visionSaving) return;

    setVisionSaving(true);
    try {
      const siteImageRef = siteImage ? await saveImage(siteImage) : null;
      const maskImageRef = maskImage ? await saveImage(maskImage) : null;
      const inspirationRefs = await Promise.all(
        inspirationImages.map((img) => saveImage(img))
      );

      const item = createVision({
        townSlug: slug,
        title: visionTitle.trim(),
        prompt: visionPrompt.trim(),
        lat: pin.lat,
        lng: pin.lng,
        siteImage: siteImageRef,
        maskImage: maskImageRef,
        inspirationImages: inspirationRefs,
      });
      cancelJourney();
      navigate(`/town/${slug}/imagine/${item.id}`, { state: { town } });
    } catch {
      setVisionSaving(false);
    }
  }

  function handleSubmitCelebration(e) {
    e.preventDefault();
    if (!celTitle.trim() || !celDescription.trim()) return;
    const item = createCelebration({
      townSlug: slug,
      title: celTitle.trim(),
      description: celDescription.trim(),
      tags: celTags,
      lat: pin.lat,
      lng: pin.lng,
    });
    cancelJourney();
    navigate(`/town/${slug}/celebrate/${item.id}`);
  }

  const journeyLabels = {
    improve: { title: 'Report an issue', subtitle: 'Move the map to position the bullseye over the location of the issue.' },
    imagine: { title: 'Imagine something new', subtitle: 'Move the map to position the bullseye over the location for your vision.' },
    celebrate: { title: 'Record local beauty', subtitle: 'Move the map to position the bullseye over the place you want to celebrate.' },
  };

  let leftPanel;

  if (!journey) {
    // Hub view
    leftPanel = (
      <div className="town-panel">
        <h1 className="town-name">{locationName}</h1>
        <p className="town-subtitle">What do you want to do here?</p>

        <div className="town-journeys">
          <button onClick={() => startJourney('improve')} className="town-journey town-journey--improve">
            <div>
              <h2>Find something to fix</h2>
              <p>Spot issues and opportunities for improvement</p>
            </div>
            <ArrowIcon className="town-journey-arrow" />
          </button>
          <button onClick={() => startJourney('imagine')} className="town-journey town-journey--imagine">
            <div>
              <h2>Imagine something new</h2>
              <p>Envision what this place could become</p>
            </div>
            <ArrowIcon className="town-journey-arrow" />
          </button>
          <button onClick={() => startJourney('celebrate')} className="town-journey town-journey--celebrate">
            <div>
              <h2>Record local beauty</h2>
              <p>Map the places that make this area special</p>
            </div>
            <ArrowIcon className="town-journey-arrow" />
          </button>
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
  } else if (step === 'place') {
    // Select a site step
    const label = journeyLabels[journey];
    leftPanel = (
      <div className="town-panel">
        <button className="back-link" onClick={cancelJourney} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          &larr; Back
        </button>
        <h1 className="town-step-title">{label.title}</h1>
        <p className="town-step-subtitle">Select a site</p>
        <p className="town-step-instructions">{label.subtitle}</p>
        <button className="town-confirm-btn" onClick={confirmLocation}>
          Confirm this location
        </button>
      </div>
    );
  } else if (step === 'form' && journey === 'improve') {
    leftPanel = (
      <div className="town-panel">
        <button className="back-link" onClick={() => setStep('place')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          &larr; Move pin
        </button>
        <h1 className="town-step-title">Report an issue</h1>
        <p className="town-step-instructions">Describe the issue at this location.</p>

        <form onSubmit={handleSubmitOpportunity} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label className="form-label">
            Title
            <input
              type="text"
              className="form-input"
              placeholder="Brief title for the issue"
              value={oppTitle}
              onChange={(e) => setOppTitle(e.target.value)}
              required
            />
          </label>

          <label className="form-label">
            Category
            <select className="form-input" value={oppCategory} onChange={(e) => setOppCategory(e.target.value)}>
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
              value={oppDescription}
              onChange={(e) => setOppDescription(e.target.value)}
              rows={5}
              required
            />
          </label>

          <button type="submit" className="form-submit" disabled={!oppTitle.trim() || !oppDescription.trim()}>
            Submit issue
          </button>
        </form>
      </div>
    );
  } else if (step === 'form' && journey === 'imagine') {
    leftPanel = (
      <div className="town-panel">
        <button className="back-link" onClick={() => setStep('place')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          &larr; Move pin
        </button>
        <h1 className="town-step-title">Describe your vision</h1>
        <p className="town-step-instructions">What do you want to see here?</p>

        <form onSubmit={handleSubmitVision} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label className="form-label">
            Name your vision
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Community garden on the vacant lot"
              value={visionTitle}
              onChange={(e) => setVisionTitle(e.target.value)}
              required
            />
          </label>

          <label className="form-label">
            Describe what you imagine
            <textarea
              className="form-input form-textarea"
              placeholder="Describe what you'd love to see here. Be as vivid as you like &mdash; this will generate an image of your vision."
              value={visionPrompt}
              onChange={(e) => setVisionPrompt(e.target.value)}
              rows={4}
              required
            />
          </label>

          {/* Site Image Section */}
          <div className="town-image-section">
            <div className="town-image-section-header">
              <span className="town-image-section-title">Site photo</span>
              <span className="town-optional">(optional)</span>
            </div>
            <p className="town-image-section-hint">
              Upload a photo of the current location. The AI will draw on top of what&rsquo;s already in the scene.
            </p>

            {!siteImage ? (
              <label className="town-upload-btn">
                <span>+ Upload site photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSiteImage}
                  hidden
                />
              </label>
            ) : (
              <div className="town-site-image">
                <button type="button" className="town-site-remove" onClick={removeSiteImage}>
                  Remove photo
                </button>
                <p className="town-mask-hint">
                  Paint over the areas you want the AI to transform. Unpainted areas will be preserved.
                </p>
                <MaskCanvas image={siteImage} onMaskChange={setMaskImage} />
              </div>
            )}
          </div>

          {/* Inspiration Images Section */}
          <div className="town-image-section">
            <div className="town-image-section-header">
              <span className="town-image-section-title">Inspiration images</span>
              <span className="town-optional">(optional)</span>
            </div>
            <p className="town-image-section-hint">
              Add reference images to guide the style or content of your vision.
              {' '}Up to {maxInspirationImages} image{maxInspirationImages !== 1 ? 's' : ''}.
            </p>

            <div className="town-inspiration-grid">
              {inspirationImages.map((img, i) => (
                <div key={i} className="town-inspiration-item">
                  <img src={img} alt={`Inspiration ${i + 1}`} />
                  <button
                    type="button"
                    className="town-inspiration-remove"
                    onClick={() => removeInspirationImage(i)}
                  >
                    &times;
                  </button>
                </div>
              ))}
              {inspirationImages.length < maxInspirationImages && (
                <label className="town-inspiration-add">
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

          <button type="submit" className="form-submit" disabled={!visionTitle.trim() || !visionPrompt.trim() || visionSaving}>
            {visionSaving ? 'Saving\u2026' : 'Save vision'}
          </button>
        </form>
      </div>
    );
  } else if (step === 'form' && journey === 'celebrate') {
    leftPanel = (
      <div className="town-panel">
        <button className="back-link" onClick={() => setStep('place')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          &larr; Move pin
        </button>
        <h1 className="town-step-title">Add local beauty</h1>
        <p className="town-step-instructions">Tell us what makes this place special.</p>

        <form onSubmit={handleSubmitCelebration} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label className="form-label">
            Name
            <input
              type="text"
              className="form-input"
              placeholder="What is this place?"
              value={celTitle}
              onChange={(e) => setCelTitle(e.target.value)}
              required
            />
          </label>

          <label className="form-label">
            What makes it special?
            <textarea
              className="form-input form-textarea"
              placeholder="Describe what you love about this place..."
              value={celDescription}
              onChange={(e) => setCelDescription(e.target.value)}
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
                    className={`form-tag ${celTags[category].includes(opt) ? 'form-tag--selected' : ''}`}
                    onClick={() => toggleCelTag(category, opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button type="submit" className="form-submit" disabled={!celTitle.trim() || !celDescription.trim()}>
            Save
          </button>
        </form>
      </div>
    );
  }

  const showBullseye = journey !== null;

  const rightPanel = (
    <MapView
      center={[town.lng, town.lat]}
      zoom={14}
      markers={journey ? [] : markers}
      onMoveEnd={handleMoveEnd}
      showBullseye={showBullseye}
      onBullseyeMove={(pos) => setPin(pos)}
    />
  );

  return <SplitLayout left={leftPanel} right={rightPanel} />;
}
