import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const returnTo = location.state?.returnTo || '/';

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      register({ email, displayName: displayName.trim(), password });
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Create an account</h1>
        <p className="auth-subtitle">Join Progress Map and help shape your neighbourhood.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <p className="auth-error">{error}</p>}

          <label className="form-label">
            Display name
            <input
              type="text"
              className="form-input"
              placeholder="How you want to appear"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </label>

          <label className="form-label">
            Email
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="form-label">
            Password
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          <button type="submit" className="form-submit">Create account</button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login" state={{ returnTo }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
