import { useParams, useLocation, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import SplitLayout from '../components/SplitLayout';
import MapView from '../components/MapView';
import SocialBar from '../components/SocialBar';
import { getVisionById, updateVision } from '../services/visions';
import { generateImage } from '../services/imageGeneration';
import { DEFAULT_CENTER } from '../config';
import './VisionDetail.css';

const TOWN_DEFAULTS = {
  'stoke-newington': { name: 'Stoke Newington', lat: 51.5633, lng: -0.0796 },
};

export default function VisionDetail() {
  const { slug, id } = useParams();
  const location = useLocation();
  const town = location.state?.town || TOWN_DEFAULTS[slug] || { name: slug, lat: DEFAULT_CENTER[1], lng: DEFAULT_CENTER[0] };

  const [item, setItem] = useState(() => getVisionById(id));
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [revisedPrompt, setRevisedPrompt] = useState('');
  const hasTriedGeneration = useRef(false);

  // Auto-generate image on first load if none exist
  useEffect(() => {
    if (!item || item.generatedImages.length > 0 || hasTriedGeneration.current) return;
    hasTriedGeneration.current = true;
    handleGenerate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerate() {
    if (!item) return;
    setGenerating(true);
    setError('');

    try {
      const result = await generateImage(item.prompt);
      const updated = updateVision(item.id, {
        generatedImages: [...item.generatedImages, ...result.images],
      });
      setItem(updated);
      if (result.revisedPrompt) {
        setRevisedPrompt(result.revisedPrompt);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  function handleSelectImage(index) {
    const updated = updateVision(item.id, { selectedImageIndex: index });
    setItem(updated);
  }

  if (!item) {
    return (
      <div style={{ padding: 32 }}>
        <p>Vision not found.</p>
        <Link to={`/town/${slug}/imagine`}>Back to visions</Link>
      </div>
    );
  }

  const hasImages = item.generatedImages.length > 0;
  const selectedIdx = item.selectedImageIndex;

  const leftPanel = (
    <div style={{ maxWidth: 480 }}>
      <Link to={`/town/${slug}/imagine`} state={{ town }} className="back-link">&larr; Back to visions</Link>

      <span className="detail-type detail-type--vision">Vision</span>
      <h1 className="detail-title">{item.title}</h1>

      <div className="detail-vision-prompt">
        <h3>The vision</h3>
        <p>{item.prompt}</p>
      </div>

      {generating && (
        <div className="vision-generating">
          <div className="vision-spinner" />
          <p>Generating your vision&hellip;</p>
        </div>
      )}

      {error && (
        <div className="vision-error">
          <p>{error}</p>
          <button className="vision-retry-btn" onClick={handleGenerate}>Try again</button>
        </div>
      )}

      {hasImages && (
        <div className="vision-images">
          {item.generatedImages.map((url, i) => (
            <div key={i} className="vision-image-wrap">
              <img
                src={url}
                alt={`Vision option ${i + 1}`}
                className={`vision-image ${selectedIdx === i ? 'vision-image--selected' : ''}`}
                onClick={() => handleSelectImage(i)}
              />
              {item.generatedImages.length > 1 && (
                <button
                  className={`vision-select-btn ${selectedIdx === i ? 'vision-select-btn--active' : ''}`}
                  onClick={() => handleSelectImage(i)}
                >
                  {selectedIdx === i ? 'Selected' : 'Select this'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {revisedPrompt && (
        <p className="vision-revised">
          <strong>DALL-E interpreted as:</strong> {revisedPrompt}
        </p>
      )}

      {!generating && (
        <button className="vision-regen-btn" onClick={handleGenerate}>
          {hasImages ? 'Generate another option' : 'Generate image'}
        </button>
      )}

      <SocialBar item={item} townSlug={slug} onUpdate={setItem} />
    </div>
  );

  const rightPanel = (
    <MapView
      center={[item.lng, item.lat]}
      zoom={16}
      markers={[item]}
    />
  );

  return <SplitLayout left={leftPanel} right={rightPanel} />;
}
