import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProgressBarLogo from './ProgressBarLogo';
import './Header.css';

export default function Header() {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="header">
      <Link to="/" className="header-brand">
        <ProgressBarLogo height={32} />
      </Link>

      <button
        className="header-hamburger"
        onClick={() => setMenuOpen(prev => !prev)}
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
      >
        <span className={`hamburger-icon ${menuOpen ? 'hamburger-icon--open' : ''}`} />
      </button>

      <nav className={`header-nav ${menuOpen ? 'header-nav--open' : ''}`}>
        <Link to="/about" className="header-link">About</Link>
        {isLoggedIn ? (
          <>
            <span className="header-user">
              {user.displayName}
              {isAdmin && <span className="header-badge">Admin</span>}
            </span>
            {isAdmin && <Link to="/admin" className="header-link">Console</Link>}
            <button className="header-link" onClick={logout}>Sign out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="header-link">Sign in</Link>
            <Link to="/register" className="header-link header-link--primary">Join</Link>
          </>
        )}
      </nav>
    </header>
  );
}
