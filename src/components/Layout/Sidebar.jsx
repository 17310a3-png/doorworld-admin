import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { section: '總覽' },
  { path: '/', label: '儀表板', icon: 'dashboard' },
  { divider: true },
  { section: '資料管理' },
  { path: '/members', label: '會員管理', icon: 'group', perm: 'members' },
  { path: '/products', label: '產品管理', icon: 'door_front', perm: 'products' },
  { path: '/service', label: '施工費用', icon: 'build', perm: 'service' },
  { divider: true },
  { section: '營運管理' },
  { path: '/quotes', label: '估價單', icon: 'receipt_long' },
  { path: '/cases', label: '案件管理', icon: 'assignment', perm: 'cases' },
  { path: '/finance', label: '財務管理', icon: 'payments', perm: 'finance' },
  { path: '/staff', label: '員工帳號', icon: 'shield_person', adminOnly: true },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout, hasPerm } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  function handleNav(path) {
    navigate(path);
    onClose();
  }

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <div className={`sidebar ${open ? 'open' : ''}`} id="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">
            <img src="/logo.png" alt="門的世界" />
          </div>
          <div className="sidebar-brand-sub">Admin Console</div>
        </div>
        <div className="sidebar-nav">
          {NAV_ITEMS.map((item, i) => {
            if (item.divider) return <div key={i} className="sidebar-section-divider" />;
            if (item.section) return <div key={i} className="sidebar-section">{item.section}</div>;
            if (item.adminOnly && !user?.isAdmin) return null;
            if (item.perm && !hasPerm(item.perm, 'view')) return null;
            const active = location.pathname === item.path;
            return (
              <div key={item.path}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => handleNav(item.path)}>
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </div>
            );
          })}
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-avatar">
            <span className="material-symbols-outlined">manage_accounts</span>
          </div>
          <div>
            <div className="sidebar-user-name">{user?.display_name || '管理員'}</div>
            <div className="sidebar-user-role">{user?.isAdmin ? 'Administrator' : 'Staff'}</div>
          </div>
          <div className="sidebar-logout" onClick={logout} title="登出">
            <span className="material-symbols-outlined">logout</span>
          </div>
        </div>
      </div>
    </>
  );
}
