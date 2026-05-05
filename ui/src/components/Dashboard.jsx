import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard({ orders, products }) {
  const activeOrders = orders.filter(o => o.status !== 'CANCELLED');
  const totalSales = activeOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalOrders = activeOrders.length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5);
  const outOfStock = products.filter(p => p.stock === 0);

  const salesByMonth = {};
  activeOrders.forEach(o => {
    const d = new Date(o.date);
    const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    salesByMonth[key] = (salesByMonth[key] || 0) + o.total_amount;
  });
  const monthlyData = Object.keys(salesByMonth).map(m => ({ month: m, sales: salesByMonth[m] }));

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">ภาพรวม</h1>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--primary)' }}>
            ฿{totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="stat-label">ยอดขายรวม</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{totalOrders}</div>
          <div className="stat-label">ออเดอร์สำเร็จ</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{lowStock.length}</div>
          <div className="stat-label">สินค้าใกล้หมด</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{outOfStock.length}</div>
          <div className="stat-label">สินค้าหมด</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
        <div className="panel glass">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text)' }}>ยอดขายรายเดือน</h3>
          {monthlyData.length > 0 ? (
            <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [`฿${v.toLocaleString()}`, 'ยอดขาย']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="sales" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-m)' }}>ยังไม่มีข้อมูลยอดขาย</div>
          )}
        </div>

        <div className="panel glass">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text)' }}>สินค้าที่ต้องเติม</h3>
          {outOfStock.length > 0 || lowStock.length > 0 ? (
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {outOfStock.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.8125rem' }}>{p.name}</span>
                  <span className="badge badge-cancelled">หมด</span>
                </div>
              ))}
              {lowStock.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.8125rem' }}>{p.name}</span>
                  <span className="badge badge-pending">{p.stock} ชิ้น</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-m)', fontSize: '0.8125rem' }}>สต๊อกเพียงพอ ✓</div>
          )}
        </div>
      </div>
    </div>
  );
}
