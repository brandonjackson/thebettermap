import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import SplitLayout from '../components/SplitLayout';
import MapView from '../components/MapView';
import ItemCard from '../components/ItemCard';
import { useAuth } from '../contexts/AuthContext';
import { getCelebrationsInBounds, createCelebration } from '../services/celebrations';
import { getOpportunitiesInBounds, createOpportunity } from '../services/opportunities';
import { getVisionsInBounds, createVision } from '../services/visions';
import { reverseGeocode } from '../services/postcodes';
import { OPPORTUNITY_CATEGORIES, CELEBRATION_TAGS, DEFAULT_CENTER } from '../config';
import './Town.css';

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
  const [referenceImage, setReferenceImage] = useState(null);

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
    setReferenceImage(null);
    setCelTitle('');
    setCelDescription('');
    setCelTags({ material: [], era: [], style: [], feeling: [] });
  }

  function confirmLocation() {
    setStep('form');
  }

  function handleReferenceImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setReferenceImage(reader.result);
    reader.readAsDataURL(file);
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

  function handleSubmitVision(e) {
    e.preventDefault();
    if (!visionTitle.trim() || !visionPrompt.trim()) return;
    const item = createVision({
      townSlug: slug,
      title: visionTitle.trim(),
      prompt: visionPrompt.trim(),
      lat: pin.lat,
      lng: pin.lng,
      referenceImage,
    });
    cancelJourney();
    navigate(`/town/${slug}/imagine/${item.id}`, { state: { town } });
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
            <svg className="town-journey-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><line x1="4" y1="12" x2="20" y2="12" /><polyline points="14 6 20 12 14 18" /></svg>
            <div>
              <h2>Find something to fix</h2>
              <p>Spot issues and opportunities for improvement</p>
            </div>
          </button>
          <button onClick={() => startJourney('imagine')} className="town-journey town-journey--imagine">
            <svg className="town-journey-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><line x1="4" y1="12" x2="20" y2="12" /><polyline points="14 6 20 12 14 18" /></svg>
            <div>
              <h2>Imagine something new</h2>
              <p>Envision what this place could become</p>
            </div>
          </button>
          <button onClick={() => startJourney('celebrate')} className="town-journey town-journey--celebrate">
            <svg className="town-journey-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><line x1="4" y1="12" x2="20" y2="12" /><polyline points="14 6 20 12 14 18" /></svg>
            <div>
              <h2>Record local beauty</h2>
              <p>Map the places that make this area special</p>
            </div>
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
              rows={6}
              required
            />
          </label>

          <div className="form-label">
            Reference image <span className="town-optional">(optional)</span>
            <p className="town-ref-hint">Attach a photo for inspiration &mdash; it won&rsquo;t be used in generation, but helps others understand your idea.</p>
            <input
              type="file"
              accept="image/*"
              className="form-input"
              onChange={handleReferenceImage}
            />
            {referenceImage && (
              <div className="town-ref-preview">
                <img src={referenceImage} alt="Reference preview" />
                <button type="button" className="town-ref-remove" onClick={() => setReferenceImage(null)}>Remove</button>
              </div>
            )}
          </div>

          <button type="submit" className="form-submit" disabled={!visionTitle.trim() || !visionPrompt.trim()}>
            Save vision
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
