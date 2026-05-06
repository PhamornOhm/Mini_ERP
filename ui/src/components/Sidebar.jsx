import { useState } from 'react';

export default function Sidebar({ currentTab, setTab, onLogout, userRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const canSeeDashboard = userRole === 'Admin' || userRole === 'Sales' || userRole === 'Accounting';
  const canSeeCreateOrder = userRole === 'Admin' || userRole === 'Sales';

  const toggleSidebar = () => setIsOpen(!isOpen);
  const handleTabClick = (id) => {
    setTab(id);
    setIsOpen(false);
  };

  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'ภาพรวม', visible: canSeeDashboard },
    { id: 'create-order', icon: '🛒', label: 'สร้างออเดอร์', visible: canSeeCreateOrder },
    { id: 'products', icon: '📦', label: 'สินค้า', visible: true },
    { id: 'stock-history', icon: '📝', label: 'ประวัติสต็อก', visible: true },
    { id: 'orders', icon: '📋', label: 'ประวัติออเดอร์', visible: true },
    { id: 'customers', icon: '👥', label: 'ลูกค้า', visible: true },
  ];

  return (
    <>
      {/* Hamburger Button for Mobile */}
      <button className="mobile-toggle" onClick={toggleSidebar}>
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Overlay when sidebar is open on mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🏭</span> Mini ERP
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#e49292ff', marginTop: '0.25rem' }}>
            {userRole && <span style={{ background: 'rgba(88, 245, 96, 0.94)', color: '#0730f8ff', padding: '0.15rem 0.5rem', borderRadius: '100px', fontWeight: 600 }}>{userRole}</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.filter(item => item.visible).map(item => (
            <div
              key={item.id}
              className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => handleTabClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: '0.75rem' }}>
          <button
            className="btn"
            style={{ width: '100%', justifyContent: 'center', background: 'rgba(239,68,68,.1)', color: '#fca5a5', fontSize: '0.8125rem' }}
            onClick={onLogout}
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  );
}
