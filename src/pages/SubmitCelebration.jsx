import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useState, useCallback } from 'react';
import SplitLayout from '../components/SplitLayout';
import MapView from '../components/MapView';
import { createCelebration } from '../services/celebrations';
import { saveImage } from '../services/imageStore';
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
  const [photoImage, setPhotoImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleBullseyeMove = useCallback((pos) => {
    setPin(pos);
  }, []);

  function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoImage(reader.result);
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhotoImage(null);
  }

  function toggleTag(category, value) {
    setTags((prev) => {
      const current = prev[category];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [category]: next };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || saving) return;

    setSaving(true);
    try {
      const photoRef = photoImage ? await saveImage(photoImage) : null;

      const item = createCelebration({
        townSlug: slug,
        title: title.trim(),
        description: description.trim(),
        tags,
        lat: pin.lat,
        lng: pin.lng,
        photoUrl: photoRef,
      });

      navigate(`/town/${slug}/celebrate/${item.id}`);
    } catch {
      setSaving(false);
    }
  }

  const leftPanel = (
    <div style={{ maxWidth: 480 }}>
      <Link to={`/town/${slug}`} state={{ town }} className="back-link">&larr; Back to {town.name}</Link>
      <h1 style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '1.8rem', fontWeight: 600, margin: '0 0 8px' }}>
        Add local beauty
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

        {/* Photo upload */}
        <div style={{ borderTop: '1px solid #e5e5e0', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#333' }}>Photo</span>
            <span style={{ fontWeight: 400, color: '#999', fontSize: '0.8rem' }}>(optional)</span>
          </div>

          {!photoImage ? (
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 20px',
              background: '#fff',
              border: '1px dashed #ccc',
              fontSize: '0.85rem',
              color: '#5B7FC4',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s ease',
            }}>
              <span>+ Upload photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                hidden
              />
            </label>
          ) : (
            <div>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <img
                  src={photoImage}
                  alt="Upload preview"
                  style={{ width: '100%', maxHeight: 240, objectFit: 'cover', display: 'block', border: '1px solid #e5e5e0' }}
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 24, height: 24,
                    background: 'rgba(0,0,0,0.6)', color: '#fff',
                    border: 'none', borderRadius: '50%',
                    fontSize: '0.85rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                  }}
                >
                  &times;
                </button>
              </div>
            </div>
          )}

          <p style={{ fontSize: '0.75rem', color: '#888', marginTop: 8, lineHeight: 1.4 }}>
            Need help finding an image? Check out this location on{' '}
            <a
              href={`https://www.geograph.org.uk/mapper/combined.php#15/${pin.lat.toFixed(4)}/${pin.lng.toFixed(4)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#5B7FC4' }}
            >
              Geograph
            </a>.
          </p>
        </div>

        <button type="submit" className="form-submit" disabled={!title.trim() || !description.trim() || saving}>
          {saving ? 'Saving\u2026' : 'Save'}
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
