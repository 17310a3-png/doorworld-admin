import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((msg, type = '') => {
    const id = Date.now() + Math.random();
    const iconName = type === 'error' ? 'error' : type === 'success' ? 'check_circle' : 'info';
    const delay = type === 'error' ? 6000 : 3000;
    setToasts(prev => [...prev, { id, msg, type: type || 'info', iconName }]);
    timersRef.current[id] = setTimeout(() => dismiss(id), delay);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="material-symbols-outlined toast-icon">{t.iconName}</span>
            <span className="toast-msg">{t.msg}</span>
            <button className="toast-close" onClick={() => dismiss(t.id)}>✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
