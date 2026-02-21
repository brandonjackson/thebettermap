import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toggleBack, hasUserBacked, getBackerCount, getComments, addComment, getShareUrl } from '../services/social';
import './SocialBar.css';

export default function SocialBar({ item, townSlug, onUpdate }) {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  const [backed, setBacked] = useState(() => hasUserBacked(item.type, item.id));
  const [backerCount, setBackerCount] = useState(() => getBackerCount(item));
  const [comments, setComments] = useState(() => getComments(item.id));
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [copied, setCopied] = useState(false);

  function handleBack() {
    if (!isLoggedIn) return;
    const updated = toggleBack(item.type, item.id);
    if (updated) {
      setBacked(!backed);
      setBackerCount(getBackerCount(updated));
      onUpdate?.(updated);
    }
  }

  function handleShare() {
    const url = getShareUrl(item.type, townSlug, item.id);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleAddComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    const comment = addComment(item.id, item.type, commentText.trim());
    setComments([...comments, comment]);
    setCommentText('');
  }

  return (
    <div className="social-bar">
      <div className="social-actions">
        {isLoggedIn ? (
          <button className={`social-btn social-btn--back ${backed ? 'social-btn--backed' : ''}`} onClick={handleBack}>
            <span className="social-btn-icon">{backed ? '\u2714' : '\u25B2'}</span>
            <span>{backerCount > 0 ? backerCount : ''} {backed ? 'Backed' : 'Back this'}</span>
          </button>
        ) : (
          <Link to="/login" state={{ returnTo: location.pathname }} className="social-btn social-btn--back" style={{ textDecoration: 'none' }}>
            <span className="social-btn-icon">{'\u25B2'}</span>
            <span>{backerCount > 0 ? backerCount : ''} Sign in to back</span>
          </Link>
        )}
        <button className="social-btn" onClick={handleShare}>
          {copied ? 'Link copied' : 'Share'}
        </button>
        <button className="social-btn" onClick={() => setShowComments(!showComments)}>
          {comments.length > 0 ? `${comments.length} comments` : 'Comment'}
        </button>
      </div>

      {showComments && (
        <div className="social-comments">
          {comments.map((c) => (
            <div key={c.id} className="social-comment">
              <span className="social-comment-author">{c.author}</span>
              <p className="social-comment-text">{c.text}</p>
              <span className="social-comment-date">{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {isLoggedIn ? (
            <form className="social-comment-form" onSubmit={handleAddComment}>
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="social-comment-input"
              />
              <button type="submit" className="social-comment-submit" disabled={!commentText.trim()}>
                Post
              </button>
            </form>
          ) : (
            <p className="social-comment-login">
              <Link to="/login" state={{ returnTo: location.pathname }}>Sign in</Link> to comment
            </p>
          )}
        </div>
      )}
    </div>
  );
}
