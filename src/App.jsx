import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/UI/Toast';
import { ConfirmProvider } from './components/UI/Confirm';
import Sidebar from './components/Layout/Sidebar';
import Topbar from './components/Layout/Topbar';
import MobileNav from './components/Layout/MobileNav';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Products from './pages/Products';
import Service from './pages/Service';
import Quotes from './pages/Quotes';
import NewQuote from './pages/NewQuote';
import Cases from './pages/Cases';
import Measurement from './pages/Measurement';
import Drafting from './pages/Drafting';
import FormalQuote from './pages/FormalQuote';
import Ordering from './pages/Ordering';
import SalesOrder from './pages/SalesOrder';
import InternalOrder from './pages/InternalOrder';
import ChinaFactory from './pages/ChinaFactory';
import TwFactory from './pages/TwFactory';
import Installation from './pages/Installation';
import PaymentTracking from './pages/PaymentTracking';
import Finance from './pages/Finance';
import Accessories from './pages/Accessories';
import Staff from './pages/Staff';
import BossView from './pages/BossView';
import './styles/globals.css';

const TITLES = {
  '/': '儀表板',
  '/bossview': '老闆視角',
  '/members': '會員管理',
  '/products': '產品管理',
  '/service': '施工費用',
  '/quotes': '估價單',
  '/quotes/new': '新增估價單',
  '/measurement': '丈量安排',
  '/drafting': '製圖進度',
  '/formalquote': '報價單總表',
  '/cases': '案件總覽',
  '/ordering': '下單追蹤',
  '/salesorder': '業務下單',
  '/internalorder': '內勤下單',
  '/chinafactory': '大陸工廠',
  '/twfactory': '台灣工廠',
  '/installation': '安裝排程',
  '/payment': '收款追蹤',
  '/finance': '財務管理',
  '/accessories': '五金配件',
  '/staff': '員工帳號',
};

function AppContent() {
  const location = useLocation();
  const title = TITLES[location.pathname] || 'Admin';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div id="app" style={{ display: 'block' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="layout">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <div className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bossview" element={<BossView />} />
            <Route path="/members" element={<Members />} />
            <Route path="/products" element={<Products />} />
            <Route path="/service" element={<Service />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/quotes/new" element={<NewQuote />} />
            <Route path="/measurement" element={<Measurement />} />
            <Route path="/drafting" element={<Drafting />} />
            <Route path="/formalquote" element={<FormalQuote />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/ordering" element={<Ordering />} />
            <Route path="/salesorder" element={<SalesOrder />} />
            <Route path="/internalorder" element={<InternalOrder />} />
            <Route path="/chinafactory" element={<ChinaFactory />} />
            <Route path="/twfactory" element={<TwFactory />} />
            <Route path="/installation" element={<Installation />} />
            <Route path="/payment" element={<PaymentTracking />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/accessories" element={<Accessories />} />
            <Route path="/staff" element={<Staff />} />
          </Routes>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}

function AppShell() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="loading"><div className="spinner" /><br />載入中...</div></div>;
  if (!user) return <Login />;
  return <AppContent />;
}

const spaRedirect = sessionStorage.getItem('spa_redirect');
if (spaRedirect) { sessionStorage.removeItem('spa_redirect'); window.history.replaceState(null, '', import.meta.env.BASE_URL.slice(0, -1) + spaRedirect); }

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <AppShell />
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
