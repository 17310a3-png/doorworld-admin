export function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function fmtPrice(n) {
  if (n == null || n === '') return '—';
  return '$' + Number(n).toLocaleString();
}

export const DOOR_TYPE_LABEL = {
  single: '單門', mother: '子母門', double: '雙開門',
  room: '房間門', ghost: '幽靈門', bathroom: '衛浴門',
  special: '特殊門', sliding: '橫拉門'
};

export const CASE_STATUS_LABEL = {
  new: '新案件', measure_scheduled: '已排丈量', measured: '丈量完成',
  official_quoted: '已正式報價', order_confirmed: '已確認下單',
  deposit_paid: '訂金已付', production: '製作中',
  shipped: '已出貨', arrived: '已到倉',
  installed: '已安裝', completed: '已結案', cancelled: '已取消'
};

export const CASE_STATUS_COLOR = {
  new: { bg: 'rgba(201,162,39,.15)', color: '#c9a227' },
  measure_scheduled: { bg: 'rgba(59,130,246,.15)', color: '#3b82f6' },
  measured: { bg: 'rgba(16,185,129,.15)', color: '#10b981' },
  official_quoted: { bg: 'rgba(139,92,246,.15)', color: '#8b5cf6' },
  order_confirmed: { bg: 'rgba(245,158,11,.15)', color: '#f59e0b' },
  deposit_paid: { bg: 'rgba(16,185,129,.15)', color: '#10b981' },
  production: { bg: 'rgba(59,130,246,.15)', color: '#3b82f6' },
  shipped: { bg: 'rgba(245,158,11,.15)', color: '#f59e0b' },
  arrived: { bg: 'rgba(201,162,39,.15)', color: '#c9a227' },
  installed: { bg: 'rgba(16,185,129,.2)', color: '#10b981' },
  completed: { bg: 'rgba(16,185,129,.25)', color: '#10b981' },
  cancelled: { bg: 'rgba(239,68,68,.15)', color: '#ef4444' }
};

export const CASE_STEPS = ['new','measure_scheduled','measured','official_quoted','order_confirmed','deposit_paid','production','shipped','arrived','installed','completed'];

export const CTYPE_SHORT = {
  S: '股東', C: '直客', D: '設計師', D1: 'D1', D2: 'D2',
  A: '代理', B: '建商', CC: '商會', DD: '經銷',
  E: '員工', G: '公機關', V: 'VIP', Z: '親友', X: '公司'
};

export const PAGE_SIZE = 20;
