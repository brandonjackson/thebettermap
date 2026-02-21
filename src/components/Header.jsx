import { Link } from 'react-router-dom';
import ProgressBarLogo from './ProgressBarLogo';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <Link to="/" className="header-brand">
        <ProgressBarLogo size={24} />
        <span className="header-title">Progress Map</span>
      </Link>
    </header>
  );
}
