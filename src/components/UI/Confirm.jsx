import { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, title: '', desc: '', onOk: null });

  const confirm = useCallback((title, desc, onOk) => {
    setState({ open: true, title, desc, onOk });
  }, []);

  function handleOk() {
    state.onOk?.();
    setState(s => ({ ...s, open: false }));
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setState(s => ({ ...s, open: false })); }}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="confirm-body">
              <div className="icon">⚠️</div>
              <div className="modal-title">{state.title}</div>
              <p>{state.desc}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setState(s => ({ ...s, open: false }))}>取消</button>
              <button className="btn btn-danger" onClick={handleOk}>確定</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
