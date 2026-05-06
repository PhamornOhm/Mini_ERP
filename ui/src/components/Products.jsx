import { useState } from 'react';
const API_URL = "http://localhost:8001";

export default function Products({ products, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', initial_stock: '' });
  const [error, setError] = useState('');
  
  // New Modal States
  const [stockModal, setStockModal] = useState({ show: false, productId: null, productName: '', value: '' });
  const [priceModal, setPriceModal] = useState({ show: false, productId: null, productName: '', value: '' });

  const token = () => localStorage.getItem('token');

  const addProduct = async (e) => {
    e.preventDefault(); setError('');
    try {
      const res = await fetch(`${API_URL}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` }, body: JSON.stringify({ name: form.name, price: parseFloat(form.price), initial_stock: parseInt(form.initial_stock) || 0 }) });
      if (res.ok) { setShowAdd(false); setForm({ name: '', price: '', initial_stock: '' }); onUpdate?.(); } else { const d = await res.json(); setError(d.detail || 'เกิดข้อผิดพลาด'); }
    } catch { setError('เชื่อมต่อล้มเหลว'); }
  };

  const handleEditPrice = async (e) => {
    e.preventDefault();
    const n = parseFloat(priceModal.value);
    if (isNaN(n) || n <= 0) return;
    try {
      const res = await fetch(`${API_URL}/products/${priceModal.productId}/price`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` }, body: JSON.stringify({ price: n }) });
      if (res.ok) { setPriceModal({ ...priceModal, show: false }); onUpdate?.(); }
    } catch { console.error("Failed to edit price"); }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    const n = parseInt(stockModal.value);
    if (isNaN(n) || n <= 0) return;
    try {
      const res = await fetch(`${API_URL}/products/${stockModal.productId}/stock`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` }, body: JSON.stringify({ quantity_added: n }) });
      if (res.ok) { setStockModal({ ...stockModal, show: false }); onUpdate?.(); }
    } catch { console.error("Failed to add stock"); }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>สินค้าและสต๊อก</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'ปิด' : '+ เพิ่มสินค้า'}</button>
      </div>

      {showAdd && (
        <div className="panel glass" style={{ marginBottom: '1rem', borderLeft: '3px solid var(--primary)' }}>
          {error && <div style={{ color: '#fff', background: 'var(--danger)', padding: '0.375rem 0.625rem', borderRadius: '4px', marginBottom: '0.75rem', fontSize: '0.8125rem' }}>{error}</div>}
          <form onSubmit={addProduct} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
            <div><label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>ชื่อสินค้า</label><input type="text" className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>ราคา</label><input type="number" step="0.01" min="1" className="form-control" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
            <div><label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>สต๊อก</label><input type="number" min="0" className="form-control" required value={form.initial_stock} onChange={e => setForm({ ...form, initial_stock: e.target.value })} /></div>
            <button type="submit" className="btn btn-primary">บันทึก</button>
          </form>
        </div>
      )}

      <div className="panel glass">
        <div className="table-container">
          <table>
            <thead><tr><th>รหัส</th><th>ชื่อ</th><th>ราคา</th><th>สต๊อก</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
            <tbody>
              {products.length > 0 ? products.map(p => {
                const low = p.stock > 0 && p.stock <= 5, out = p.stock === 0;
                return (
                  <tr key={p.id}>
                    <td>PROD-{String(p.id).padStart(4, '0')}</td>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>฿{p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ fontWeight: 600, color: out ? 'var(--danger)' : low ? 'var(--warning)' : 'inherit' }}>{p.stock}</td>
                    <td>{out ? <span className="badge badge-cancelled">หมด</span> : low ? <span className="badge badge-pending">ใกล้หมด</span> : <span className="badge badge-confirmed">พร้อมขาย</span>}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setPriceModal({ show: true, productId: p.id, productName: p.name, value: p.price })}>✏️ ราคา</button>
                        <button className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setStockModal({ show: true, productId: p.id, productName: p.name, value: '' })}>📦 เติม</button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-m)' }}>ไม่มีสินค้า</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Price Modal */}
      {priceModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>✏️ แก้ไขราคา: {priceModal.productName}</h2>
              <button className="modal-close" onClick={() => setPriceModal({ ...priceModal, show: false })}>✕</button>
            </div>
            <form onSubmit={handleEditPrice}>
              <div className="modal-body">
                <div className="form-group">
                  <label>ราคาใหม่ (บาท)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control" 
                    autoFocus 
                    required 
                    value={priceModal.value} 
                    onChange={e => setPriceModal({ ...priceModal, value: e.target.value })} 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setPriceModal({ ...priceModal, show: false })}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">บันทึกการแก้ไข</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Stock Modal */}
      {stockModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>📦 เติมสต็อก: {stockModal.productName}</h2>
              <button className="modal-close" onClick={() => setStockModal({ ...stockModal, show: false })}>✕</button>
            </div>
            <form onSubmit={handleAddStock}>
              <div className="modal-body">
                <div className="form-group">
                  <label>จำนวนที่ต้องการเพิ่ม (ชิ้น)</label>
                  <input 
                    type="number" 
                    min="1" 
                    className="form-control" 
                    autoFocus 
                    required 
                    placeholder="ใส่จำนวนสินค้า..." 
                    value={stockModal.value} 
                    onChange={e => setStockModal({ ...stockModal, value: e.target.value })} 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setStockModal({ ...stockModal, show: false })}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">ยืนยันการเติม</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

