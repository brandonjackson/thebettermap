import { useParams, useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import SplitLayout from '../components/SplitLayout';
import MapView from '../components/MapView';
import SocialBar from '../components/SocialBar';
import { getVisionById } from '../services/visions';
import { DEFAULT_CENTER } from '../config';

const TOWN_DEFAULTS = {
  'stoke-newington': { name: 'Stoke Newington', lat: 51.5633, lng: -0.0796 },
};

export default function VisionDetail() {
  const { slug, id } = useParams();
  const location = useLocation();
  const town = location.state?.town || TOWN_DEFAULTS[slug] || { name: slug, lat: DEFAULT_CENTER[1], lng: DEFAULT_CENTER[0] };

  const [item, setItem] = useState(() => getVisionById(id));

  if (!item) {
    return (
      <div style={{ padding: 32 }}>
        <p>Vision not found.</p>
        <Link to={`/town/${slug}/imagine`}>Back to visions</Link>
      </div>
    );
  }

  const leftPanel = (
    <div style={{ maxWidth: 480 }}>
      <Link to={`/town/${slug}/imagine`} state={{ town }} className="back-link">&larr; Back to visions</Link>

      <span className="detail-type detail-type--vision">Vision</span>
      <h1 className="detail-title">{item.title}</h1>

      <div className="detail-vision-prompt">
        <h3>The vision</h3>
        <p>{item.prompt}</p>
      </div>

      {item.generatedImages.length > 0 ? (
        <div className="detail-images">
          {item.generatedImages.map((url, i) => (
            <img key={i} src={url} alt={`Vision option ${i + 1}`} className="detail-gen-image" />
          ))}
        </div>
      ) : (
        <div className="detail-placeholder-image">
          <p>Image generation coming soon. For now, use your imagination.</p>
        </div>
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
