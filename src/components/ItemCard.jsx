import { Link } from 'react-router-dom';
import { getBackerCount } from '../services/social';
import './ItemCard.css';

const TYPE_LABELS = {
  opportunity: 'Improvement',
  vision: 'Vision',
  celebration: 'Local Beauty',
};

const TYPE_COLORS = {
  opportunity: '#C45B4A',
  vision: '#5B7FC4',
  celebration: '#2D6A4F',
};

function getThumbnail(item) {
  if (item.photoUrl) return item.photoUrl;
  if (item.generatedImages?.length > 0) {
    const idx = item.selectedImageIndex != null ? item.selectedImageIndex : 0;
    return item.generatedImages[idx];
  }
  return null;
}

export default function ItemCard({ item, townSlug, basePath }) {
  const backers = getBackerCount(item);
  const journeyPath = item.type === 'opportunity' ? 'improve' : item.type === 'vision' ? 'imagine' : 'celebrate';
  const linkTo = basePath || `/town/${townSlug}/${journeyPath}/${item.id}`;
  const thumbnail = getThumbnail(item);
  const desc = item.description || item.prompt || '';

  return (
    <Link to={linkTo} className="item-card">
      <div className="item-card-photo">
        {thumbnail ? (
          <img src={thumbnail} alt={item.title} />
        ) : (
          <div className="item-card-photo-placeholder" style={{ borderColor: TYPE_COLORS[item.type] }}>
            <span style={{ color: TYPE_COLORS[item.type] }}>{TYPE_LABELS[item.type]}</span>
          </div>
        )}
      </div>
      <div className="item-card-body">
        <span className="item-card-type" style={{ color: TYPE_COLORS[item.type] }}>
          {TYPE_LABELS[item.type]}
        </span>
        <h3 className="item-card-title">{item.title}</h3>
        <p className="item-card-desc">{desc.slice(0, 100)}{desc.length > 100 ? '...' : ''}</p>
        <div className="item-card-meta">
          {backers > 0 && <span className="item-card-backers">{backers} {backers === 1 ? 'backer' : 'backers'}</span>}
          {item.category && <span className="item-card-category">{item.category}</span>}
        </div>
      </div>
    </Link>
  );
}
