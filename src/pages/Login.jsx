import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || '帳號或密碼錯誤，請再試一次。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="login-screen" style={{ display: 'flex' }}>
      <div className="login-blobs">
        <div className="b1" />
        <div className="b2" />
        <div className="b3" />
      </div>
      <div className="login-box">
        <div className="login-header">
          <div className="login-icon">
            <span className="material-symbols-outlined">door_front</span>
          </div>
          <div className="login-title">Door World Admin</div>
          <div className="login-sub">門的世界 管理後台</div>
        </div>
        <form className="login-body" onSubmit={handleLogin}>
          <div className="login-group">
            <label>帳號</label>
            <div className="login-input-wrap">
              <span className="login-input-icon material-symbols-outlined">person</span>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="admin_user" autoComplete="username" />
            </div>
          </div>
          <div className="login-group">
            <label>密碼</label>
            <div className="login-input-wrap">
              <span className="login-input-icon material-symbols-outlined">lock</span>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" autoComplete="current-password" />
            </div>
          </div>
          {error && <div className="login-err" style={{ display: 'block' }}>{error}</div>}
          <button className="login-btn" type="submit" disabled={loading}>
            <span>{loading ? '登入中...' : '登入管理後台'}</span>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </button>
          <div className="login-footer">
            <p>Secure Administrative Access Only<br />Authorized Personnel &amp; Logistics Department</p>
          </div>
        </form>
      </div>
    </div>
  );
}
