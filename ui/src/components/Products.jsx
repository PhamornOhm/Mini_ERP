import { useState } from 'react';
const API_URL = "http://localhost:8000";

export default function Products({ products, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', initial_stock: '' });
  const [error, setError] = useState('');
  const token = () => localStorage.getItem('token');

  const addProduct = async (e) => {
    e.preventDefault(); setError('');
    try {
      const res = await fetch(`${API_URL}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` }, body: JSON.stringify({ name: form.name, price: parseFloat(form.price), initial_stock: parseInt(form.initial_stock) || 0 }) });
      if (res.ok) { setShowAdd(false); setForm({ name: '', price: '', initial_stock: '' }); onUpdate?.(); } else { const d = await res.json(); setError(d.detail || 'เกิดข้อผิดพลาด'); }
    } catch { setError('เชื่อมต่อล้มเหลว'); }
  };

  const editPrice = async (id, old) => {
    const v = prompt("ราคาใหม่:", old); if (!v) return;
    const n = parseFloat(v); if (isNaN(n) || n <= 0) { alert("ราคาไม่ถูกต้อง"); return; }
    try { const res = await fetch(`${API_URL}/products/${id}/price`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` }, body: JSON.stringify({ price: n }) }); if (res.ok) onUpdate?.(); else alert("ไม่สามารถแก้ไขได้"); } catch { alert("เชื่อมต่อล้มเหลว"); }
  };

  const addStock = async (id) => {
    const v = prompt("จำนวนที่เพิ่ม:"); if (!v) return;
    const n = parseInt(v); if (isNaN(n) || n <= 0) { alert("จำนวนไม่ถูกต้อง"); return; }
    try { const res = await fetch(`${API_URL}/products/${id}/stock`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` }, body: JSON.stringify({ quantity_added: n }) }); if (res.ok) onUpdate?.(); else alert("ไม่สามารถเพิ่มได้"); } catch { alert("เชื่อมต่อล้มเหลว"); }
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
                        <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => editPrice(p.id, p.price)}>✏️ ราคา</button>
                        <button className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => addStock(p.id)}>📦 เติม</button>
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
    </div>
  );
}
