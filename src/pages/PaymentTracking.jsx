import { useState, useEffect, useCallback } from 'react';
import { sbFetch } from '../api/supabase';
import { fmtPrice } from '../api/utils';
import StatCard from '../components/UI/StatCard';
import { useToast } from '../components/UI/Toast';
import { useConfirm } from '../components/UI/Confirm';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/UI/Modal';

const PAY_TYPE_LABEL = { measurement: '丈量費', deposit: '訂金', balance: '尾款', other: '其他' };
const PAY_METHOD_LABEL = { cash: '現金', transfer: '匯款', card: '信用卡', other: '其他' };

function fmtD(d) { return d ? new Date(d).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }) : ''; }

function getPayStatus(c) {
  const total = c.total_with_tax || c.official_price || 0;
  if (total <= 0) return 'none';
  const mPaid = !c.measure_fee || !!c.measure_fee_paid_at;
  const dPaid = !c.deposit_50 || !!c.deposit_50_paid_at;
  const bPaid = !!c.balance_paid_at;
  if (mPaid && dPaid && bPaid) return 'paid';
  if (c.measure_fee_paid_at || c.deposit_50_paid_at) return 'partial';
  return 'unpaid';
}

const STATUS_MAP = {
  paid: { label: '已付清', bg: 'rgba(34,197,94,.12)', color: '#22c55e' },
  partial: { label: '部分收款', bg: 'rgba(245,158,11,.12)', color: '#f59e0b' },
  unpaid: { label: '未收款', bg: 'rgba(239,68,68,.12)', color: '#ef4444' },
  none: { label: '—', bg: 'transparent', color: 'var(--text-muted)' }
};

export default function PaymentTracking() {
  const [cases, setCases] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [paymentsModal, setPaymentsModal] = useState({ open: false, caseRow: null, list: [] });
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCases(await sbFetch('cases?select=*&status=in.(order_confirmed,deposit_paid,production,shipped,arrived,installed,completed)&order=created_at.desc&limit=500') || []);
    } catch (e) { toast(e.message, 'error'); }
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  // Totals
  let totalAmt = 0, collected = 0, paidCount = 0, partialCount = 0, unpaidCount = 0;
  cases.forEach(c => {
    totalAmt += (c.total_with_tax || c.official_price || 0);
    if (c.measure_fee && c.measure_fee_paid_at) collected += c.measure_fee;
    if (c.deposit_50 && c.deposit_50_paid_at) collected += c.deposit_50;
    if (c.balance && c.balance_paid_at) collected += c.balance;
    const s = getPayStatus(c);
    if (s === 'paid') paidCount++;
    else if (s === 'partial') partialCount++;
    else if (s === 'unpaid') unpaidCount++;
  });

  // Filter
  let filtered = cases;
  if (filter === 'outstanding') filtered = cases.filter(c => { const s = getPayStatus(c); return s === 'unpaid' || s === 'partial'; });
  else if (filter === 'partial') filtered = cases.filter(c => getPayStatus(c) === 'partial');
  else if (filter === 'paid') filtered = cases.filter(c => getPayStatus(c) === 'paid');

  // Mark single payment
  async function markPaid(caseId, field, amount) {
    confirm(`確認已收到 ${fmtPrice(amount)}？`, '標記後將記錄今天日期為收款日。', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const patch = { [field]: today, updated_at: new Date().toISOString() };
      const c = cases.find(x => x.id === caseId);
      if (field === 'deposit_50_paid_at' && c && !c.deposit_50) {
        patch.deposit_50 = Math.round((c.total_with_tax || c.official_price || 0) * 0.5);
      }
      if (field === 'balance_paid_at' && c) {
        const total = c.total_with_tax || c.official_price || 0;
        patch.balance = Math.max(0, total - (c.deposit_50 || 0) - (c.measure_fee || 0));
      }
      try {
        await sbFetch(`cases?id=eq.${caseId}`, { method: 'PATCH', body: JSON.stringify(patch) });
        toast('已標記收款', 'success');
        load();
      } catch (e) { toast('操作失敗: ' + e.message, 'error'); }
    });
  }

  // Mark all paid
  async function markAllPaid(caseId) {
    confirm('確認所有款項已收齊？', '將一次標記丈量費、訂金、尾款為已收。', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const c = cases.find(x => x.id === caseId);
      const patch = { updated_at: new Date().toISOString() };
      if (c) {
        const total = c.total_with_tax || c.official_price || 0;
        const dep = c.deposit_50 || Math.round(total * 0.5);
        const mfee = c.measure_fee || 0;
        if (!c.measure_fee_paid_at && mfee) patch.measure_fee_paid_at = today;
        if (!c.deposit_50_paid_at) { patch.deposit_50_paid_at = today; if (!c.deposit_50) patch.deposit_50 = dep; }
        if (!c.balance_paid_at) { patch.balance_paid_at = today; patch.balance = Math.max(0, total - dep - mfee); }
      }
      try {
        await sbFetch(`cases?id=eq.${caseId}`, { method: 'PATCH', body: JSON.stringify(patch) });
        toast('已標記全部收齊', 'success');
        load();
      } catch (e) { toast('操作失敗: ' + e.message, 'error'); }
    });
  }

  // 取消單一付款標記（僅管理員）
  async function unmarkPaid(caseId, field, label) {
    if (!user?.isAdmin) { toast('僅管理員可取消標記', 'error'); return; }
    confirm(`取消「${label}」收款標記？`, '會清除收款日期，案件回復為未收款狀態。', async () => {
      try {
        await sbFetch(`cases?id=eq.${caseId}`, { method: 'PATCH', body: JSON.stringify({ [field]: null, updated_at: new Date().toISOString() }) });
        toast('已取消標記', 'success');
        load();
      } catch (e) { toast('操作失敗: ' + e.message, 'error'); }
    });
  }

  // 開啟付款紀錄 modal — 列出 payments 表的紀錄
  async function openPayments(c) {
    try {
      const list = await sbFetch(`payments?case_id=eq.${c.id}&select=*&order=created_at.desc`) || [];
      setPaymentsModal({ open: true, caseRow: c, list });
    } catch (e) { toast(e.message, 'error'); }
  }

  // 刪除單筆 payments 紀錄（僅管理員）
  async function deletePayment(p) {
    if (!user?.isAdmin) { toast('僅管理員可刪除付款紀錄', 'error'); return; }
    confirm('確認刪除這筆付款紀錄？', `${PAY_TYPE_LABEL[p.payment_type] || p.payment_type} ${fmtPrice(p.amount)}\n\n此動作無法復原。`, async () => {
      try {
        await sbFetch(`payments?id=eq.${p.id}`, { method: 'DELETE' });
        toast('已刪除付款紀錄', 'success');
        // 重新載入 modal 跟主表
        openPayments(paymentsModal.caseRow);
        load();
      } catch (e) { toast('刪除失敗: ' + e.message, 'error'); }
    });
  }

  // Payment cell
  function PayCell({ amt, paid, paidDate, field, caseId, label }) {
    if (!amt) return <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>—</td>;
    if (paid) {
      return (
        <td style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--success)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {fmtPrice(amt)} <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>check_circle</span>
          </div>
          {paidDate && <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{fmtD(paidDate)}</div>}
          {user?.isAdmin && (
            <button
              onClick={() => unmarkPaid(caseId, field, label)}
              title="取消收款標記（管理員）"
              style={{ marginTop: 3, fontSize: 9, padding: '1px 6px', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 3, cursor: 'pointer' }}
            >取消</button>
          )}
        </td>
      );
    }
    return (
      <td style={{ textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{fmtPrice(amt)}</div>
        <button className="btn btn-ghost btn-sm" onClick={() => markPaid(caseId, field, amt)}
          style={{ fontSize: 10, padding: '2px 8px', marginTop: 3, color: 'var(--gold)', borderColor: 'var(--gold)' }}>
          標記已收
        </button>
      </td>
    );
  }

  const filterBtn = (label, val, color) => {
    const on = filter === val;
    return <button key={val} onClick={() => setFilter(val)} style={{ padding: '5px 11px', borderRadius: 6, border: `1px solid ${on ? 'var(--gold)' : 'var(--border)'}`, background: on ? 'var(--gold-dim)' : 'var(--surface-2)', color: on ? (color || 'var(--gold)') : 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: on ? 700 : 500 }}>{label}</button>;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-title">收款追蹤</div>
          <div className="page-subtitle">管理丈量費、訂金、尾款的收款與標記</div>
        </div>
        <button className="btn btn-primary" onClick={load}>↻ 重新載入</button>
      </div>

      <div className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="案件數" value={cases.length} icon="assignment" />
        <StatCard label="已收款" value={fmtPrice(collected)} color="var(--success)" icon="check_circle" />
        <StatCard label="未收款" value={fmtPrice(totalAmt - collected)} color="var(--danger)" icon="warning" style={{ borderColor: 'rgba(239,68,68,.3)' }} />
        <StatCard label="收款率" value={totalAmt > 0 ? Math.round(collected / totalAmt * 100) + '%' : '0%'} icon="percent" />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {filterBtn(`全部 (${cases.length})`, 'all')}
        {filterBtn(`未收清 (${partialCount + unpaidCount})`, 'outstanding', 'var(--danger)')}
        {filterBtn(`部分收款 (${partialCount})`, 'partial', '#f59e0b')}
        {filterBtn(`已付清 (${paidCount})`, 'paid', 'var(--success)')}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /><br />載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: .3, display: 'block', marginBottom: 10 }}>account_balance</span>
          無符合條件的案件
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>案件</th>
                <th>客戶</th>
                <th>總價</th>
                <th>丈量費</th>
                <th>訂金 50%</th>
                <th>尾款</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const total = c.total_with_tax || c.official_price || 0;
                const mfee = c.measure_fee || 0;
                const dep = c.deposit_50 || 0;
                const bal = c.balance || Math.max(0, total - dep - mfee);
                const mPaid = !!c.measure_fee_paid_at;
                const dPaid = !!c.deposit_50_paid_at;
                const bPaid = !!c.balance_paid_at;
                const status = getPayStatus(c);
                const st = STATUS_MAP[status] || STATUS_MAP.none;

                return (
                  <tr key={c.id}>
                    <td><strong style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--gold)' }}>{c.formal_quote_no || c.order_no || c.case_no || '—'}</strong></td>
                    <td>
                      <strong style={{ fontWeight: 600 }}>{c.customer_name || '—'}</strong>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.sales_person || ''}</div>
                    </td>
                    <td className="price" style={{ color: 'var(--gold)', fontSize: 14 }}>{fmtPrice(total)}</td>
                    <PayCell amt={mfee} paid={mPaid} paidDate={c.measure_fee_paid_at} field="measure_fee_paid_at" caseId={c.id} label="丈量費" />
                    <PayCell amt={dep} paid={dPaid} paidDate={c.deposit_50_paid_at} field="deposit_50_paid_at" caseId={c.id} label="訂金 50%" />
                    <PayCell amt={bal} paid={bPaid} paidDate={c.balance_paid_at} field="balance_paid_at" caseId={c.id} label="尾款" />
                    <td><span className="badge" style={{ background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.label}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {status !== 'paid' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => markAllPaid(c.id)}
                            style={{ fontSize: 10, padding: '3px 8px', color: 'var(--success)', borderColor: 'var(--success)' }}>
                            全部收齊
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => openPayments(c)}
                          style={{ fontSize: 10, padding: '3px 8px', color: 'var(--gold)', borderColor: 'var(--gold)' }}>
                          付款紀錄
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 付款紀錄 modal */}
      <Modal
        open={paymentsModal.open}
        onClose={() => setPaymentsModal({ open: false, caseRow: null, list: [] })}
        title={`付款紀錄 — ${paymentsModal.caseRow?.formal_quote_no || paymentsModal.caseRow?.case_no || ''}`}
        maxWidth={620}
        footer={<button className="btn btn-ghost" onClick={() => setPaymentsModal({ open: false, caseRow: null, list: [] })}>關閉</button>}
      >
        {paymentsModal.list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
            無付款紀錄（payments 表）
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {paymentsModal.list.map(p => (
              <div key={p.id} style={{ padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', padding: '2px 8px', background: 'var(--gold-dim)', borderRadius: 4 }}>
                  {PAY_TYPE_LABEL[p.payment_type] || p.payment_type || '—'}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  {fmtPrice(p.amount)}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {PAY_METHOD_LABEL[p.payment_method] || p.payment_method || '—'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {p.created_at ? new Date(p.created_at).toLocaleDateString('zh-TW') : ''}
                  {p.recorded_by ? ` · ${p.recorded_by}` : ''}
                </span>
                {user?.isAdmin && (
                  <button
                    onClick={() => deletePayment(p)}
                    title="刪除此筆付款（管理員）"
                    style={{ padding: '3px 8px', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
                  >🗑 刪除</button>
                )}
                {p.note && (
                  <div style={{ width: '100%', fontSize: 11, color: 'var(--text-muted)', paddingLeft: 4 }}>
                    備註：{p.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
