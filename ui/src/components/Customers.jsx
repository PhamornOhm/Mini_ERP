import { useState } from 'react';
const API_URL = "http://localhost:8001";

export default function Customers({ customers, orders, onUpdate, userRole }) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const canEdit = userRole === 'Admin' || userRole === 'Sales';

  const stats = (id) => {
    const co = orders.filter(o => o.customer_id === id);
    return { count: co.length, total: co.reduce((s, o) => s + (o.status !== 'CANCELLED' ? o.total_amount : 0), 0) };
  };

  const addCustomer = async (e) => {
    e.preventDefault(); setError('');
    try {
      const res = await fetch(`${API_URL}/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ name }) });
      if (res.ok) { setShowAdd(false); setName(''); onUpdate?.(); } else { const d = await res.json(); setError(d.detail || 'เกิดข้อผิดพลาด'); }
    } catch { setError('เชื่อมต่อล้มเหลว'); }
  };

  const edit = async (id, old) => {
    if (!canEdit) { alert('ไม่มีสิทธิ์'); return; }
    const n = prompt('ชื่อใหม่:', old); if (!n || n === old) return;
    try { const res = await fetch(`${API_URL}/customers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ name: n }) }); if (res.ok) onUpdate?.(); else { const d = await res.json(); alert(d.detail); } } catch { alert('เชื่อมต่อล้มเหลว'); }
  };

  const del = async (id) => {
    if (userRole !== 'Admin') { alert('เฉพาะ Admin'); return; }
    if (!confirm('ลบลูกค้านี้?')) return;
    try { const res = await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }); if (res.ok) onUpdate?.(); else { const d = await res.json(); alert(d.detail); } } catch { alert('เชื่อมต่อล้มเหลว'); }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>ลูกค้า</h1>
        {canEdit && <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'ปิด' : '+ เพิ่มลูกค้า'}</button>}
      </div>

      {showAdd && (
        <div className="panel glass" style={{ marginBottom: '1rem', borderLeft: '3px solid var(--primary)' }}>
          {error && <div style={{ color: '#fff', background: 'var(--danger)', padding: '0.375rem 0.625rem', borderRadius: '4px', marginBottom: '0.75rem', fontSize: '0.8125rem' }}>{error}</div>}
          <form onSubmit={addCustomer} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}><label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>ชื่อลูกค้า</label><input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required placeholder="กรอกชื่อ..." /></div>
            <button type="submit" className="btn btn-primary">บันทึก</button>
          </form>
        </div>
      )}

      <div className="panel glass">
        <div className="table-container">
          <table>
            <thead><tr><th>รหัส</th><th>ชื่อ</th><th>ออเดอร์</th><th>ยอดซื้อสะสม</th><th>จัดการ</th></tr></thead>
            <tbody>
              {customers.length > 0 ? customers.map(c => {
                const s = stats(c.id);
                return (
                  <tr key={c.id}>
                    <td>CUST-{String(c.id).padStart(4, '0')}</td>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td>{s.count}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>฿{s.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        {canEdit && <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => edit(c.id, c.name)}>✏️</button>}
                        {userRole === 'Admin' && <button className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => del(c.id)}>🗑️</button>}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-m)' }}>ไม่มีลูกค้า</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
