export default function Placeholder({ title }) {
  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-title">{title}</div>
          <div className="page-subtitle">頁面遷移中...</div>
        </div>
      </div>
      <div className="empty">
        <div className="icon">🚧</div>
        此頁面正在從舊版遷移至 React，請稍後...
      </div>
    </div>
  );
}
