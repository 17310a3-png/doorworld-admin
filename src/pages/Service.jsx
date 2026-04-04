import { useState, useEffect } from 'react';
import { sbFetch } from '../api/supabase';
import { fmtPrice, DOOR_TYPE_LABEL } from '../api/utils';
import { useToast } from '../components/UI/Toast';
import Modal from '../components/UI/Modal';

export default function Service() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, data: null });
  const toast = useToast();

  async function load() {
    setLoading(true);
    try { setRows(await sbFetch('service_costs?select=*&order=door_type.asc') || []); }
    catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {};
    ['demolition', 'wet_install', 'dry_install', 'soundproof', 'smoke_seal', 'fireproof_cert'].forEach(k => {
      body[k] = Number(fd.get(k)) || 0;
    });
    try {
      await sbFetch(`service_costs?id=eq.${modal.data.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      toast('已儲存', 'success');
      setModal({ open: false, data: null });
      load();
    } catch (e) { toast(e.message, 'error'); }
  }

  const d = modal.data || {};

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap"><div className="page-title">施工費用</div><div className="page-subtitle">依門型設定各項施工附加費用</div></div>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>依門型設定各項施工附加費用，點「編輯」修改金額後儲存。</p>

      {loading ? <div className="loading"><div className="spinner" /><br />載入中...</div> :
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {rows.map(r => (
            <div key={r.id} style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius)', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700 }}>{DOOR_TYPE_LABEL[r.door_type] || r.door_type}</div>
                  <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 4, letterSpacing: 1 }}>寬 {r.std_width} × 高 {r.std_height} cm</div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => setModal({ open: true, data: r })}>編輯</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 13 }}>
                <div>拆除 <span className="price">{fmtPrice(r.demolition)}</span></div>
                <div>濕式安裝 <span className="price">{fmtPrice(r.wet_install)}</span></div>
                <div>乾式安裝 <span className="price">{fmtPrice(r.dry_install)}</span></div>
                <div>隔音 <span className="price">{fmtPrice(r.soundproof)}</span></div>
                <div>遮煙 <span className="price">{fmtPrice(r.smoke_seal)}</span></div>
                <div>防火證 <span className="price">{fmtPrice(r.fireproof_cert)}</span></div>
              </div>
            </div>
          ))}
        </div>
      }

      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={`編輯施工費用 — ${DOOR_TYPE_LABEL[d.door_type] || ''}`} maxWidth={500}
        footer={<><button className="btn btn-ghost" onClick={() => setModal({ open: false, data: null })}>取消</button><button className="btn btn-primary" type="submit" form="svc-form">儲存</button></>}>
        <form id="svc-form" onSubmit={save} className="form-grid">
          <div className="form-group"><label>拆除費</label><input name="demolition" type="number" defaultValue={d.demolition || 0} /></div>
          <div className="form-group"><label>濕式安裝</label><input name="wet_install" type="number" defaultValue={d.wet_install || 0} /></div>
          <div className="form-group"><label>乾式安裝</label><input name="dry_install" type="number" defaultValue={d.dry_install || 0} /></div>
          <div className="form-group"><label>隔音</label><input name="soundproof" type="number" defaultValue={d.soundproof || 0} /></div>
          <div className="form-group"><label>遮煙</label><input name="smoke_seal" type="number" defaultValue={d.smoke_seal || 0} /></div>
          <div className="form-group"><label>防火證</label><input name="fireproof_cert" type="number" defaultValue={d.fireproof_cert || 0} /></div>
        </form>
      </Modal>
    </div>
  );
}
