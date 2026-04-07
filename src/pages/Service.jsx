import { useState, useEffect } from 'react';
import { sbFetch } from '../api/supabase';
import { fmtPrice, DOOR_TYPE_LABEL } from '../api/utils';
import { useToast } from '../components/UI/Toast';
import Modal from '../components/UI/Modal';

const FIELDS = [
  { key: 'fire_cert_60a', label: '防火認證 60A' },
  { key: 'smoke_seal', label: '煙氣封條' },
  { key: 'old_door_removal', label: '拆舊門' },
  { key: 'old_frame_remove', label: '拆舊框' },
  { key: 'wet_grout', label: '濕式灌漿' },
  { key: 'wet_paint', label: '油漆' },
  { key: 'dry_frame', label: '乾式包框' },
  { key: 'soundproof_basic', label: '隔音（基本）' },
  { key: 'soundproof_50db', label: '隔音（50dB）' },
  { key: 'no_elevator_per_floor', label: '無電梯搬運/每層' },
  { key: 'oversize_width_per_10cm', label: '超寬/每10cm' },
  { key: 'oversize_height_per_10cm', label: '超高/每10cm' }
];

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
    FIELDS.forEach(f => { body[f.key] = Number(fd.get(f.key)) || 0; });
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {rows.map(r => (
            <div key={r.id} style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius)', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700 }}>{r.door_type_name || DOOR_TYPE_LABEL[r.door_type] || r.door_type}</div>
                  <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 4, letterSpacing: 1 }}>寬 {r.std_width} × 高 {r.std_height} cm</div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => setModal({ open: true, data: r })}>編輯</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 13 }}>
                {FIELDS.map(f => (
                  <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{f.label}</span>
                    <span className="price">{fmtPrice(r[f.key])}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      }

      <Modal open={modal.open} onClose={() => setModal({ open: false, data: null })} title={`編輯施工費用 — ${d.door_type_name || DOOR_TYPE_LABEL[d.door_type] || ''}`} maxWidth={550}
        footer={<><button className="btn btn-ghost" onClick={() => setModal({ open: false, data: null })}>取消</button><button className="btn btn-primary" type="submit" form="svc-form">儲存</button></>}>
        <form id="svc-form" onSubmit={save} className="form-grid">
          {FIELDS.map(f => (
            <div key={f.key} className="form-group">
              <label>{f.label}</label>
              <input name={f.key} type="number" defaultValue={d[f.key] || 0} />
            </div>
          ))}
        </form>
      </Modal>
    </div>
  );
}