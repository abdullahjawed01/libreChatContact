import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import ContactsPage from './pages/ContactsPage';
import CampaignInsightsPage from './pages/CampaignInsightsPage';
import './index.css';
import { Database, TrendingUp } from 'lucide-react';

function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="sidebar" style={{ padding: '0 12px', position: 'fixed', height: '100vh', zIndex: 40 }}>
      {/* Logo */}
      <div style={{ padding: '24px 4px 20px', borderBottom: '1px solid #1e293b', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, background: '#1e2a45',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Database size={18} color="#818cf8" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2 }}>LibreContacts</div>
            <div style={{ fontSize: 11, color: '#475569' }}>AI Workspace</div>
          </div>
        </div>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Link to="/" className={`sidebar-item ${pathname === '/' ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
          <Database size={16} /> Contacts
        </Link>
        <Link to="/campaign-insights" className={`sidebar-item ${pathname === '/campaign-insights' ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
          <TrendingUp size={16} /> Campaign Insights
        </Link>
      </nav>
    </aside>
  );
}

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f' }}>
        <Sidebar />
        {/* push main content past fixed sidebar */}
        <div style={{ marginLeft: 240, flex: 1 }}>
          <Routes>
            <Route path="/" element={<ContactsPage />} />
            <Route path="/campaign-insights" element={<CampaignInsightsPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
