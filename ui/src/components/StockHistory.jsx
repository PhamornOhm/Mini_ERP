import { useState, useEffect } from "react";

const API = "http://localhost:8001";

const TYPE_LABEL = {
  IN:     { text: "เติมสต็อก",  color: "#16a34a", bg: "#dcfce7" },
  OUT:    { text: "ตัดสต็อก",   color: "#dc2626", bg: "#fee2e2" },
  ADJUST: { text: "ปรับสต็อก",  color: "#d97706", bg: "#fef3c7" },
  RETURN: { text: "คืนสต็อก",   color: "#2563eb", bg: "#dbeafe" },
};

export default function StockHistory() {
  const [movements, setMovements] = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [productId, setProductId] = useState("");   // filter by product
  const [page, setPage]           = useState(0);
  const limit = 20;

  const token = localStorage.getItem("token");

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const url = productId
        ? `${API}/stocks/movements/${productId}?limit=${limit}&offset=${page * limit}`
        : `${API}/stocks/movements?limit=${limit}&offset=${page * limit}`;

      const res  = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMovements(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMovements(); }, [page, productId]);

  const formatDate = (iso) =>
    new Date(iso).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: "1.5rem" }}>
        ประวัติการเคลื่อนไหวสต็อก
      </h2>

      {/* Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: "1.5rem" }}>
        <input
          type="number"
          placeholder="กรองตาม Product ID..."
          value={productId}
          onChange={(e) => { setProductId(e.target.value); setPage(0); }}
          style={{
            padding: "8px 12px", borderRadius: 8,
            border: "1px solid #d1d5db", width: 220, fontSize: 14,
          }}
        />
        <button
          onClick={() => { setProductId(""); setPage(0); }}
          style={{
            padding: "8px 16px", borderRadius: 8,
            border: "1px solid #d1d5db", background: "#f9fafb",
            cursor: "pointer", fontSize: 14,
          }}
        >
          ล้างตัวกรอง
        </button>
        <button
          onClick={fetchMovements}
          style={{
            padding: "8px 16px", borderRadius: 8,
            background: "#3b82f6", color: "#fff",
            border: "none", cursor: "pointer", fontSize: 14,
          }}
        >
          รีเฟรช
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: "#fff", borderRadius: 12,
        border: "1px solid #e5e7eb", overflow: "hidden",
      }}>
        {loading ? (
          <p style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
            กำลังโหลด...
          </p>
        ) : movements.length === 0 ? (
          <p style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
            ไม่มีประวัติสต็อก
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["#", "สินค้า", "ประเภท", "จำนวน", "ก่อน", "หลัง", "ออเดอร์", "หมายเหตุ", "วันที่"].map((h) => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left",
                    fontWeight: 600, color: "#374151",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.map((m, i) => {
                const badge = TYPE_LABEL[m.movement_type] || { text: m.movement_type, color: "#374151", bg: "#f3f4f6" };
                return (
                  <tr key={m.id} style={{
                    borderBottom: "1px solid #f3f4f6",
                    background: i % 2 === 0 ? "#fff" : "#fafafa",
                  }}>
                    <td style={{ padding: "12px 16px", color: "#6b7280" }}>#{m.id}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 500 }}>{m.product_name}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 20, fontSize: 12,
                        fontWeight: 600, color: badge.color, background: badge.bg,
                      }}>
                        {badge.text}
                      </span>
                    </td>
                    <td style={{
                      padding: "12px 16px", fontWeight: 700,
                      color: m.qty > 0 ? "#16a34a" : "#dc2626",
                    }}>
                      {m.qty > 0 ? `+${m.qty}` : m.qty}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280" }}>{m.qty_before}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>{m.qty_after}</td>
                    <td style={{ padding: "12px 16px", color: "#6b7280" }}>
                      {m.order_id ? `#${m.order_id}` : "-"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: 13 }}>
                      {m.note || "-"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: 13 }}>
                      {formatDate(m.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginTop: "1rem",
      }}>
        <p style={{ fontSize: 13, color: "#6b7280" }}>
          ทั้งหมด {total} รายการ
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: "6px 16px", borderRadius: 8,
              border: "1px solid #d1d5db",
              background: page === 0 ? "#f3f4f6" : "#fff",
              cursor: page === 0 ? "default" : "pointer", fontSize: 13,
            }}
          >
            ← ก่อนหน้า
          </button>
          <span style={{ padding: "6px 12px", fontSize: 13, color: "#374151" }}>
            หน้า {page + 1} / {Math.ceil(total / limit) || 1}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={(page + 1) * limit >= total}
            style={{
              padding: "6px 16px", borderRadius: 8,
              border: "1px solid #d1d5db",
              background: (page + 1) * limit >= total ? "#f3f4f6" : "#fff",
              cursor: (page + 1) * limit >= total ? "default" : "pointer", fontSize: 13,
            }}
          >
            ถัดไป →
          </button>
        </div>
      </div>
    </div>
  );
}
