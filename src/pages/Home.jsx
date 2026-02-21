import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lookupPostcode } from '../services/postcodes';
import ProgressBarLogo from '../components/ProgressBarLogo';
import './Home.css';

export default function Home() {
  const [postcode, setPostcode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!postcode.trim()) return;

    setError('');
    setLoading(true);

    try {
      const result = await lookupPostcode(postcode);
      navigate(`/town/${result.slug}`, { state: { town: result } });
    } catch {
      setError("We couldn\u2019t find that postcode. Please check and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleDemo() {
    navigate('/town/stoke-newington', {
      state: {
        town: {
          name: 'Stoke Newington',
          slug: 'stoke-newington',
          lat: 51.5633,
          lng: -0.0796,
        },
      },
    });
  }

  return (
    <div className="home">
      <div className="home-hero">
        <ProgressBarLogo size={40} />
        <h1 className="home-title">Progress Map</h1>
        <p className="home-subtitle">
          Collectively imagine improvements to Britain.
          <br />
          Find what needs fixing, dream up what could be, and celebrate what&rsquo;s already beautiful.
        </p>

        <form className="home-form" onSubmit={handleSubmit}>
          <div className="home-input-group">
            <input
              type="text"
              className="home-input"
              placeholder="Enter your postcode"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              aria-label="Postcode"
            />
            <button type="submit" className="home-btn" disabled={loading}>
              {loading ? 'Looking up...' : 'Explore your area'}
            </button>
          </div>
          {error && <p className="home-error">{error}</p>}
        </form>

        <button className="home-demo-link" onClick={handleDemo}>
          Or explore Stoke Newington, London
        </button>
      </div>

      <div className="home-features">
        <div className="home-feature">
          <div className="home-feature-icon home-feature-icon--improve" />
          <h3>Find something to fix</h3>
          <p>Spot neglected spaces, broken infrastructure, and missed opportunities in your neighbourhood.</p>
        </div>
        <div className="home-feature">
          <div className="home-feature-icon home-feature-icon--imagine" />
          <h3>Imagine something new</h3>
          <p>Drop a pin, describe your vision, and see what your neighbourhood could become.</p>
        </div>
        <div className="home-feature">
          <div className="home-feature-icon home-feature-icon--celebrate" />
          <h3>Celebrate what&rsquo;s beautiful</h3>
          <p>Map the buildings, streets, and places that make your area special.</p>
        </div>
      </div>
    </div>
  );
}
