import { useState } from 'react';
const API_URL = "http://localhost:8001";

export default function OrderHistory({ orders, customers, onOrderUpdated }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  const getName = (id) => { const c = customers.find(c => c.id === id); return c ? c.name : `#${id}`; };

  const changeStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/orders/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status }) });
      if (res.ok) { if (onOrderUpdated) onOrderUpdated(); } else { const d = await res.json(); alert(d.detail); }
    } catch { alert('เชื่อมต่อล้มเหลว'); }
  };

  const fetchLogs = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/audit/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { setLogs(await res.json()); setShowLogs(true); }
    } catch { alert('ดึงข้อมูลล้มเหลว'); }
  };

  const badge = (s) => {
    const map = { PENDING: ['badge-pending', 'รอดำเนินการ'], CONFIRMED: ['badge-confirmed', 'ยืนยัน'], SHIPPED: ['badge-shipped', 'จัดส่ง'], DELIVERED: ['badge-delivered', 'สำเร็จ'], CANCELLED: ['badge-cancelled', 'ยกเลิก'] };
    const [cls, label] = map[s] || ['', s];
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  const filtered = filterStatus === 'ALL' ? orders : orders.filter(o => o.status === filterStatus);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>ประวัติออเดอร์</h1>
        <select className="form-control" style={{ width: '160px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="ALL">ทุกสถานะ</option>
          <option value="PENDING">รอดำเนินการ</option>
          <option value="CONFIRMED">ยืนยัน</option>
          <option value="SHIPPED">จัดส่ง</option>
          <option value="DELIVERED">สำเร็จ</option>
          <option value="CANCELLED">ยกเลิก</option>
        </select>
      </div>

      <div className="panel glass">
        <div className="table-container">
          <table>
            <thead>
              <tr><th>รหัส</th><th>วันที่</th><th>ลูกค้า</th><th>ยอดรวม</th><th>สถานะ</th><th>จัดการ</th></tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600 }}>ORD-{String(o.id).padStart(4, '0')}</td>
                  <td>{new Date(o.date).toLocaleDateString('th-TH')}</td>
                  <td>{getName(o.customer_id)}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>฿{o.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>{badge(o.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                      <select className="form-control" style={{ width: '120px', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} value={o.status} onChange={e => changeStatus(o.id, e.target.value)} disabled={o.status === 'CANCELLED'}>
                        <option value="PENDING">รอดำเนินการ</option>
                        <option value="CONFIRMED">ยืนยัน</option>
                        <option value="SHIPPED">จัดส่ง</option>
                        <option value="DELIVERED">สำเร็จ</option>
                      </select>
                      {o.status !== 'CANCELLED' && (
                        <button className="btn btn-outline" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', color: 'var(--danger)', borderColor: '#fecaca' }} onClick={() => { if (confirm('ยกเลิกออเดอร์นี้?')) changeStatus(o.id, 'CANCELLED'); }}>ยกเลิก</button>
                      )}
                      <button className="btn btn-outline" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} onClick={() => fetchLogs(o.id)}>📜</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-m)' }}>ไม่มีออเดอร์</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showLogs && (
        <div className="modal-overlay" onClick={() => setShowLogs(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>ประวัติการแก้ไข</h2>
              <button className="modal-close" onClick={() => setShowLogs(false)}>×</button>
            </div>
            <div className="modal-body">
              {logs.length > 0 ? (
                <div className="timeline">
                  {logs.map(log => (
                    <div key={log.id} className="timeline-item">
                      <div className="timeline-date">{new Date(log.date).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                      <div className="timeline-content"><strong>{log.username}</strong> — <span className="badge badge-pending" style={{ marginLeft: '0.25rem' }}>{log.action}</span></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-m)', fontSize: '0.8125rem' }}>ไม่มีประวัติ</div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowLogs(false)}>ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
