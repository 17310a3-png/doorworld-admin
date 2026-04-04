import { useAuth } from '../../contexts/AuthContext';

export default function Topbar({ title, onMenuClick }) {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="topbar">
      <button className="hamburger-btn" onClick={onMenuClick} title="選單">
        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>menu</span>
      </button>
      <div className="topbar-title">{title}</div>
      <div className="topbar-sep" />
      <div className="topbar-sub">Admin</div>
      <div className="topbar-right">
        <span className="topbar-info" style={{ fontWeight: 600, color: 'var(--gold)' }}>{user?.display_name || ''}</span>
        <span className="topbar-sep hide-mobile" />
        <span className="topbar-info">{today}</span>
      </div>
    </div>
  );
}
