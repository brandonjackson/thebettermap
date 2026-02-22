import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllUsers, updateUserRole, deleteUser } from '../services/auth';
import { getAllOpportunities, deleteOpportunity, updateOpportunity, getOpportunityById } from '../services/opportunities';
import { getAllVisions, deleteVision, updateVision, getVisionById } from '../services/visions';
import { getAllCelebrations, deleteCelebration, updateCelebration, getCelebrationById } from '../services/celebrations';
import { getAllComments, deleteComment } from '../services/social';
import { getSettings, updateSettings } from '../services/settings';
import { useAuth } from '../contexts/AuthContext';
import './Admin.css';

function getItemViewPath(itemType, itemId) {
  const getById = itemType === 'opportunity' ? getOpportunityById
    : itemType === 'vision' ? getVisionById
    : getCelebrationById;
  const item = getById(itemId);
  if (!item) return null;
  const journeyPath = itemType === 'opportunity' ? 'improve' : itemType === 'vision' ? 'imagine' : 'celebrate';
  return `/town/${item.townSlug}/${journeyPath}/${itemId}`;
}

const TABS = ['Users', 'Opportunities', 'Visions', 'Local Beauty', 'Comments', 'Settings'];

export default function Admin() {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState('Users');
  const [refreshKey, setRefreshKey] = useState(0);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="admin" key={refreshKey}>
      <nav className="admin-nav">
        <div className="admin-nav-header">
          <h1 className="admin-title">Admin Console</h1>
          <p className="admin-subtitle">Manage users, content, and comments.</p>
        </div>
        {TABS.map((t) => (
          <button
            key={t}
            className={`admin-nav-item ${tab === t ? 'admin-nav-item--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="admin-main">
        <div className="admin-content">
          {tab === 'Users' && <UsersTable currentUserId={currentUser.id} onRefresh={refresh} />}
          {tab === 'Opportunities' && <ItemsTable type="opportunity" onRefresh={refresh} />}
          {tab === 'Visions' && <ItemsTable type="vision" onRefresh={refresh} />}
          {tab === 'Local Beauty' && <ItemsTable type="celebration" onRefresh={refresh} />}
          {tab === 'Comments' && <CommentsTable onRefresh={refresh} />}
          {tab === 'Settings' && <SettingsPanel />}
        </div>
      </div>
    </div>
  );
}

function UsersTable({ currentUserId, onRefresh }) {
  const users = getAllUsers();

  function handleRoleChange(userId, newRole) {
    updateUserRole(userId, newRole);
    onRefresh();
  }

  function handleDelete(userId) {
    if (userId === currentUserId) return;
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    deleteUser(userId);
    onRefresh();
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="admin-cell--name">{u.displayName}</td>
              <td>{u.email}</td>
              <td>
                <select
                  className="admin-select"
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  disabled={u.id === currentUserId}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td className="admin-cell--date">{new Date(u.createdAt).toLocaleString()}</td>
              <td>
                {u.id !== currentUserId && (
                  <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(u.id)}>Delete</button>
                )}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={5} className="admin-empty">No users yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ItemsTable({ type, onRefresh }) {
  const [editing, setEditing] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const getAll = type === 'opportunity' ? getAllOpportunities
    : type === 'vision' ? getAllVisions
    : getAllCelebrations;

  const doDelete = type === 'opportunity' ? deleteOpportunity
    : type === 'vision' ? deleteVision
    : deleteCelebration;

  const doUpdate = type === 'opportunity' ? updateOpportunity
    : type === 'vision' ? updateVision
    : updateCelebration;

  const items = getAll().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  function handleDelete(id) {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    doDelete(id);
    onRefresh();
  }

  function startEdit(item) {
    setEditing(item.id);
    setEditTitle(item.title);
    setEditDesc(item.description || item.prompt || '');
  }

  function saveEdit(id) {
    const field = type === 'vision' ? 'prompt' : 'description';
    doUpdate(id, { title: editTitle, [field]: editDesc });
    setEditing(null);
    onRefresh();
  }

  function cancelEdit() {
    setEditing(null);
  }

  const journeyPath = type === 'opportunity' ? 'improve' : type === 'vision' ? 'imagine' : 'celebrate';
  const descLabel = type === 'vision' ? 'Prompt' : 'Description';

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>{descLabel}</th>
            <th>Town</th>
            <th>Backers</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              {editing === item.id ? (
                <>
                  <td>
                    <input
                      className="admin-inline-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </td>
                  <td>
                    <textarea
                      className="admin-inline-input admin-inline-textarea"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={3}
                    />
                  </td>
                  <td>{item.townSlug}</td>
                  <td>{(item.backerIds || []).length}</td>
                  <td className="admin-cell--date">{new Date(item.createdAt).toLocaleString()}</td>
                  <td className="admin-cell--actions">
                    <button className="admin-btn admin-btn--save" onClick={() => saveEdit(item.id)}>Save</button>
                    <button className="admin-btn" onClick={cancelEdit}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td className="admin-cell--name">{item.title}</td>
                  <td className="admin-cell--desc">{(item.description || item.prompt || '').slice(0, 80)}{(item.description || item.prompt || '').length > 80 ? '...' : ''}</td>
                  <td>{item.townSlug}</td>
                  <td>{(item.backerIds || []).length}</td>
                  <td className="admin-cell--date">{new Date(item.createdAt).toLocaleString()}</td>
                  <td className="admin-cell--actions">
                    <Link className="admin-btn" to={`/town/${item.townSlug}/${journeyPath}/${item.id}`}>View</Link>
                    <button className="admin-btn" onClick={() => startEdit(item)}>Edit</button>
                    <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(item.id)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={6} className="admin-empty">No {type === 'opportunity' ? 'opportunities' : type + 's'} yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function CommentsTable({ onRefresh }) {
  const comments = getAllComments().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  function handleDelete(id) {
    if (!window.confirm('Delete this comment?')) return;
    deleteComment(id);
    onRefresh();
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Author</th>
            <th>Comment</th>
            <th>Item type</th>
            <th>Date</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {comments.map((c) => (
            <tr key={c.id}>
              <td className="admin-cell--name">{c.author}</td>
              <td className="admin-cell--desc">{c.text}</td>
              <td>{c.itemType}</td>
              <td className="admin-cell--date">{new Date(c.createdAt).toLocaleString()}</td>
              <td>
                {getItemViewPath(c.itemType, c.itemId) && (
                  <Link className="admin-btn" to={getItemViewPath(c.itemType, c.itemId)}>View</Link>
                )}
              </td>
              <td>
                <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(c.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {comments.length === 0 && (
            <tr><td colSpan={6} className="admin-empty">No comments yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const IMAGE_PROVIDERS = [
  { value: 'openai', label: 'OpenAI (GPT Image)', description: 'Uses gpt-image-1 via the OpenAI API. Requires OPENAI_API_KEY in .env.' },
  { value: 'gemini', label: 'Google Gemini (Nano Banana)', description: 'Uses Gemini 2.5 Flash Image via the Google AI API. Requires GEMINI_API_KEY in .env.' },
];

function SettingsPanel() {
  const settings = getSettings();
  const [provider, setProvider] = useState(settings.imageProvider);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    updateSettings({ imageProvider: provider });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const current = IMAGE_PROVIDERS.find((p) => p.value === provider);

  return (
    <div className="admin-settings">
      <div className="admin-settings-section">
        <h3 className="admin-settings-heading">Image Generation Model</h3>
        <p className="admin-settings-desc">
          Choose which AI provider to use for generating vision images.
        </p>

        <div className="admin-settings-options">
          {IMAGE_PROVIDERS.map((p) => (
            <label key={p.value} className={`admin-settings-option ${provider === p.value ? 'admin-settings-option--selected' : ''}`}>
              <input
                type="radio"
                name="imageProvider"
                value={p.value}
                checked={provider === p.value}
                onChange={() => setProvider(p.value)}
              />
              <div>
                <span className="admin-settings-option-label">{p.label}</span>
                <span className="admin-settings-option-desc">{p.description}</span>
              </div>
            </label>
          ))}
        </div>

        {current && (
          <p className="admin-settings-note">
            Make sure <code>{current.value === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY'}</code> is set in your <code>.env</code> file.
          </p>
        )}

        <div className="admin-settings-actions">
          <button className="admin-btn admin-btn--save" onClick={handleSave}>
            Save
          </button>
          {saved && <span className="admin-settings-saved">Saved</span>}
        </div>
      </div>
    </div>
  );
}
