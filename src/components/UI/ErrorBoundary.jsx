import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 40, textAlign: 'center', color: '#e5e2e1',
          background: '#0e0e0e', minHeight: '100vh', display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16
        }}>
          <div style={{ fontSize: 48, opacity: 0.3 }}>⚠</div>
          <h2 style={{ fontFamily: 'Lexend, sans-serif', fontSize: 20, fontWeight: 700 }}>頁面發生錯誤</h2>
          <p style={{ color: '#99907b', fontSize: 14, maxWidth: 400 }}>
            {this.state.error?.message || '未知錯誤'}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => this.setState({ hasError: false, error: null })} style={{
              padding: '10px 20px', background: '#c9a227', color: '#3d2e00', border: 'none',
              borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
            }}>重試此頁面</button>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = import.meta.env.BASE_URL; }} style={{
              padding: '10px 20px', background: 'transparent', color: '#99907b', border: '1px solid rgba(77,70,53,0.3)',
              borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
            }}>回到首頁</button>
          </div>
          <details style={{ marginTop: 20, color: '#99907b', fontSize: 11, maxWidth: 500 }}>
            <summary style={{ cursor: 'pointer' }}>技術細節</summary>
            <pre style={{ textAlign: 'left', background: '#1c1b1b', padding: 12, borderRadius: 8, marginTop: 8, overflow: 'auto', maxHeight: 200, fontSize: 10 }}>
              {this.state.error?.stack || 'No stack trace'}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
