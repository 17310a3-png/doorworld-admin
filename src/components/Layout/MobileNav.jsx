import { useLocation, useNavigate } from 'react-router-dom';

const MOBILE_ITEMS = [
  { path: '/', label: '總覽', icon: 'dashboard' },
  { path: '/members', label: '會員', icon: 'group' },
  { path: '/quotes', label: '估價', icon: 'receipt_long' },
  { path: '/cases', label: '案件', icon: 'assignment' },
  { path: '/finance', label: '財務', icon: 'payments' },
  { path: '/products', label: '產品', icon: 'door_front' },
];

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="mobile-nav">
      {MOBILE_ITEMS.map(item => {
        const active = location.pathname === item.path;
        return (
          <div key={item.path}
            className={`mobile-nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(item.path)}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
}
