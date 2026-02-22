import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lookupPostcode } from '../services/postcodes';
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
      <div className="home-opener">
        <h1 className="home-opener-title">Dream it. Share it. Sorted.</h1>
        <p className="home-opener-body">
          We have endless ways to object to things. Almost no way to say what we actually want.
          Progress Map is here to solve Britain's collective imagination problem — a shared canvas
          for picturing better, street by street, and rallying people around that vision.
        </p>
      </div>

      <div className="home-hero">
        <div className="home-hero-overlay" />
        <div className="home-hero-content">
          <h2 className="home-tagline">
            A shared map for a better Britain.
          </h2>

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
      </div>

      <div className="home-ways">
        <h2 className="home-ways-title">Three ways to help</h2>
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
            <h3>Record local beauty</h3>
            <p>Map the buildings, streets, and places that make your area special.</p>
          </div>
        </div>
      </div>

      <div className="home-commons">
        <h2 className="home-commons-title">Part of the digital commons</h2>
        <p className="home-commons-body">
          Progress Map isn't a startup. It's public infrastructure for collective ambition.
          Inspired by the civic visionaries who imagined garden cities, public parks, and the
          NHS — people who saw what Britain could be and made others see it too.
        </p>
      </div>

      <footer className="home-footer">
        <p>Progress Map — a shared map for a better Britain</p>
      </footer>
    </div>
  );
}
