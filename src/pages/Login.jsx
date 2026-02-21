import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const returnTo = location.state?.returnTo || '/';

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      login({ email, password });
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">Welcome back to Progress Map.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <p className="auth-error">{error}</p>}

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
            />
          </label>

          <button type="submit" className="form-submit">Sign in</button>
        </form>

        <p className="auth-switch">
          Don&rsquo;t have an account? <Link to="/register" state={{ returnTo }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
