import { useState } from 'react';
import { VATBreakdown } from './VATBreakdown';
const API_URL = "http://localhost:8001";

export default function CreateOrder({ customers, products, onOrderCreated }) {
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ productId: '', qty: 1 }]);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');

  const handleAddItem = () => setItems([...items, { productId: '', qty: 1 }]);
  const handleItemChange = (i, field, val) => { const n = [...items]; n[i][field] = val; setItems(n); };
  const handleRemoveItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const closeInvoice = () => { setInvoice(null); setCustomerId(''); setItems([{ productId: '', qty: 1 }]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!customerId || items.length === 0 || items.some(i => !i.productId)) return;
    const payload = { customer_id: parseInt(customerId), items: items.map(i => ({ product_id: parseInt(i.productId), qty: i.qty })) };
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        const invItems = items.map(item => { const p = products.find(p => p.id === Number(item.productId)); return { name: p.name, qty: item.qty, subtotal: p.price * item.qty }; });
        setInvoice({ orderId: data.order_id, customer: customers.find(c => c.id === Number(customerId)).name, items: invItems, total: data.total_amount, raw_data: data });
        onOrderCreated();
      } else { setError(data.detail || 'เกิดข้อผิดพลาด'); }
    } catch { setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'); }
  };

  // ── ถ้ามี invoice → แสดงใบเสร็จเต็มหน้า ──
  if (invoice) {
    return (
      <div className="animate-fade-in">
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>ใบสั่งซื้อ #{String(invoice.orderId).padStart(5, '0')}</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={() => window.print()}>🖨️ พิมพ์ PDF</button>
            <button className="btn btn-primary" onClick={closeInvoice}>+ สร้างออเดอร์ใหม่</button>
          </div>
        </div>

        <div id="printable-invoice" className="panel glass" style={{ maxWidth: '700px' }}>
          <div className="invoice-header-row">
            <div>
              <div className="invoice-company">ERP_TEST SYSTEM</div>
              <div className="invoice-company-info">
                บริษัท มินิ อีอาร์พี จำกัด<br />
                123 ถนนเทส กรุงเทพฯ 10000<br />
                โทร: 02-123-4567
              </div>
            </div>
            <div className="invoice-meta">
              <div className="invoice-label">Invoice</div>
              <div className="invoice-number">#{String(invoice.orderId).padStart(5, '0')}</div>
              <div className="invoice-date">{new Date().toLocaleDateString('th-TH')}</div>
            </div>
          </div>

          <div className="invoice-bill-to">
            <div className="invoice-bill-label">Bill To</div>
            <div className="invoice-bill-name">{invoice.customer}</div>
          </div>

          <table className="invoice-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>รายการ</th>
                <th style={{ textAlign: 'center' }}>จำนวน</th>
                <th style={{ textAlign: 'right' }}>รวม</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td>
                  <td style={{ textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>฿{item.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-total-row">
            <div className="invoice-total-box">
              <span className="invoice-total-label">ยอดรวมสุทธิ</span>
              <span className="invoice-total-value">฿{invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="no-print">
          <VATBreakdown result={invoice.raw_data} />
        </div>
      </div>
    );
  }

  // ── ฟอร์มสร้างออเดอร์ ──
  return (
    <div className="animate-fade-in">
      <h1 className="page-title">สร้างออเดอร์</h1>
      <div className="panel glass" style={{ maxWidth: '640px' }}>
        {error && <div style={{ color: '#fff', background: 'var(--danger)', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.8125rem' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ลูกค้า</label>
            <select className="form-control" value={customerId} onChange={e => setCustomerId(e.target.value)} required>
              <option value="">-- เลือกลูกค้า --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-s)' }}>รายการสินค้า</label>
              <button type="button" className="btn btn-outline" onClick={handleAddItem} style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>+ เพิ่ม</button>
            </div>
            {items.map((item, index) => (
              <div key={index} className="form-row">
                <select className="form-control" value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)} required style={{ flex: 2 }}>
                  <option value="">-- สินค้า --</option>
                  {products.map(p => <option key={p.id} value={p.id} disabled={p.stock < 1}>{p.name} ({p.stock}) — ฿{p.price}</option>)}
                </select>
                <input type="number" className="form-control" value={item.qty} min="1" onChange={e => handleItemChange(index, 'qty', parseInt(e.target.value))} style={{ flex: 0, width: '72px' }} />
                {items.length > 1 && <button type="button" className="btn btn-danger" onClick={() => handleRemoveItem(index)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>✕</button>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
            <button type="submit" className="btn btn-primary">ยืนยันการสั่งซื้อ</button>
          </div>
        </form>
      </div>
    </div>
  );
}
