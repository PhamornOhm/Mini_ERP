// เพิ่มส่วนนี้ใน CreateOrder.jsx ตรงที่แสดงผลลัพธ์หลังสั่งซื้อสำเร็จ
// แทนที่ส่วน success message เดิม

// ── ตัวอย่าง state ที่ต้องเพิ่ม ──────────────────────────────────────────────
// const [orderResult, setOrderResult] = useState(null);

// ── ตัวอย่าง response ที่ได้จาก API ใหม่ ─────────────────────────────────────
// {
//   order_id: 1,
//   invoice_id: 1,
//   subtotal: 2570.54,      ← ราคาก่อน VAT
//   vat_rate: 0.07,
//   vat_amount: 179.94,     ← ภาษี 7%
//   total_amount: 2750.48,  ← ราคารวม VAT
//   order_status: "CONFIRMED"
// }

// ── Component แสดงผล VAT ──────────────────────────────────────────────────────
function VATBreakdown({ result }) {
  if (!result) return null;

  return (
    <div style={{
      background: "#f0fdf4", border: "1px solid #86efac",
      borderRadius: 12, padding: "1.5rem", marginTop: "1.5rem",
    }}>
      <h3 style={{ color: "#15803d", fontWeight: 600, marginBottom: "1rem" }}>
        ✅ สั่งซื้อสำเร็จ!
      </h3>

      {/* Order & Invoice ID */}
      <div style={{ display: "flex", gap: 16, marginBottom: "1rem" }}>
        <div style={{
          background: "#fff", borderRadius: 8, padding: "8px 16px",
          border: "1px solid #bbf7d0",
        }}>
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>รหัสออเดอร์</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#15803d", margin: 0 }}>
            #{result.order_id}
          </p>
        </div>
        <div style={{
          background: "#fff", borderRadius: 8, padding: "8px 16px",
          border: "1px solid #bbf7d0",
        }}>
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>รหัส Invoice</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#15803d", margin: 0 }}>
            #{result.invoice_id}
          </p>
        </div>
        <div style={{
          background: "#fff", borderRadius: 8, padding: "8px 16px",
          border: "1px solid #bbf7d0",
        }}>
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>สถานะ</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#15803d", margin: 0 }}>
            {result.order_status}
          </p>
        </div>
      </div>

      {/* VAT Breakdown */}
      <div style={{
        background: "#fff", borderRadius: 8, padding: "1rem",
        border: "1px solid #bbf7d0",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: "6px 0", color: "#6b7280", fontSize: 14 }}>
                ราคาสินค้า (ก่อน VAT)
              </td>
              <td style={{ padding: "6px 0", textAlign: "right", fontSize: 14 }}>
                ฿{result.subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", color: "#6b7280", fontSize: 14 }}>
                VAT {(result.vat_rate * 100).toFixed(0)}%
              </td>
              <td style={{ padding: "6px 0", textAlign: "right", fontSize: 14, color: "#d97706" }}>
                +฿{result.vat_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr style={{ borderTop: "2px solid #e5e7eb" }}>
              <td style={{ padding: "10px 0 0", fontWeight: 700, fontSize: 16 }}>
                ยอดรวมทั้งสิ้น
              </td>
              <td style={{
                padding: "10px 0 0", textAlign: "right",
                fontWeight: 700, fontSize: 20, color: "#15803d",
              }}>
                ฿{result.total_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { VATBreakdown };
