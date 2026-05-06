import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import CreateOrder from './components/CreateOrder'
import Products from './components/Products'
import OrderHistory from './components/OrderHistory'
import Customers from './components/Customers'
import Login from './components/Login'
import StockHistory from './components/StockHistory'

const API_URL = "http://localhost:8001";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState('');
  const [currentTab, setCurrentTab] = useState('dashboard');
  
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [toasts, setToasts] = useState([]);
  const [warnedProducts, setWarnedProducts] = useState(new Set());

  const addToast = (message, type = 'warning') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      const [custRes, prodRes, ordRes, meRes] = await Promise.all([
        fetch(`${API_URL}/customers`, { headers }),
        fetch(`${API_URL}/products`, { headers }),
        fetch(`${API_URL}/orders`, { headers }),
        fetch(`${API_URL}/me`, { headers })
      ]);
      
      if (custRes.status === 401 || prodRes.status === 401 || ordRes.status === 401) {
        handleLogout();
        return;
      }
      
      if (meRes.ok) {
        const me = await meRes.json();
        setUserRole(me.role);
      }

      if (custRes.ok) setCustomers(await custRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
      
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
        
        // Low stock notification logic
        const newWarned = new Set(warnedProducts);
        prodData.forEach(p => {
          if (p.stock <= 5 && !newWarned.has(p.id)) {
            addToast(`สินค้า "${p.name}" เหลือสต๊อกเพียง ${p.stock} ชิ้น!`, p.stock === 0 ? 'danger' : 'warning');
            newWarned.add(p.id);
          } else if (p.stock > 5 && newWarned.has(p.id)) {
            newWarned.delete(p.id);
          }
        });
        setWarnedProducts(newWarned);
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUserRole('');
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderContent = () => {
    switch(currentTab) {
      case 'dashboard': return <Dashboard orders={orders} products={products} />;
      case 'create-order': return <CreateOrder customers={customers} products={products} onOrderCreated={fetchData} />;
      case 'products': return <Products products={products} onUpdate={fetchData} />;
      case 'orders': return <OrderHistory orders={orders} customers={customers} onOrderUpdated={fetchData} />;
      case 'customers': return <Customers customers={customers} orders={orders} userRole={userRole} onUpdate={fetchData} />;
      case 'stock-history': return <StockHistory />;
      default: return <Dashboard orders={orders} products={products} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar currentTab={currentTab} setTab={setCurrentTab} onLogout={handleLogout} userRole={userRole} />
      <main className="main-content">
        {renderContent()}
      </main>
      
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span style={{ fontSize: '1.25rem' }}>{t.type === 'danger' ? '⛔' : '⚠️'}</span>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
