import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProgressBarLogo from './ProgressBarLogo';
import './Header.css';

export default function Header() {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();

  return (
    <header className="header">
      <Link to="/" className="header-brand">
        <ProgressBarLogo size={24} />
        <span className="header-title">Progress Map</span>
      </Link>

      <nav className="header-nav">
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
