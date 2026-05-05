import { useState } from 'react';

const API_URL = "http://localhost:8000";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.access_token);
        onLogin();
      } else {
        setError(data.detail || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <div style={{ width: '100%', maxWidth: '360px', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏭</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>ERP_TEST SYSTEM</h1>
          <p style={{ color: 'var(--text-m, #94a3b8)', fontSize: '0.8125rem' }}>เข้าสู่ระบบเพื่อดำเนินการ</p>
        </div>

        <div className="panel glass" style={{ padding: '1.5rem' }}>
          {error && <div style={{ color: '#fff', background: '#ef4444', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.8125rem', textAlign: 'center' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>ชื่อผู้ใช้</label>
              <input type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} required placeholder="username" />
            </div>
            <div className="form-group">
              <label>รหัสผ่าน</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
              เข้าสู่ระบบ
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
