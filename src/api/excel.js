import * as XLSX from 'xlsx';

const COMPANY_NAME = '門的世界 DOORWORLD　展億室內開發有限公司';
const COMPANY_INFO = '統編 60667469　新北市五股區成泰路一段130-3號　TEL: 02-2292-0366　Email: doorworld168@gmail.com';

const DOOR_TYPE_LABEL = {
  single: '單開門', mother: '子母門', double: '雙開門',
  fire: '防火單門', room: '房間門', bathroom: '衛浴門', sliding: '橫拉門'
};
const STATUS_LABEL = { draft: '草稿', sent: '已送出', confirmed: '已確認', cancelled: '已取消' };

// 報價單注意事項 16 條（依據官方範本 v001/20251212）
const QUOTE_TERMS = [
  '定義：工作日（不含假日）、日曆天（含假日）',
  '1. 下單時乙方先預付50%訂金，收訂金日視為下單日。',
  '2. 客製化產品下單後如要求改單，由下單日起算第3個曆天下午1點（台灣時間）後，改單所造成的損失由乙方承擔訂單總價之80%。',
  '3. 有品質問題時自驗收後5個工作天內經乙方提出，逾期甲方不再負責，其需修復缺件之所造成的二次上門工費材料費由乙方承擔。',
  '4. 依客製化生產週期約在45-60個日曆天，如遇外界不可抗因素（非人為,外力,天災,地變因素導致）工期延長，甲方應提前20個工作天提出，調整交貨時間。',
  '5. 驗收日後7個日曆天前乙方必須付清尾款（50%），交貨日起算30個日曆天後，必須離開甲方倉庫，如超出時間需收取倉儲費用（以總價款3%/日曆天收取）。',
  '6. 出廠價格預設不含稅金、敲牆、拆舊回收、灌漿及選配零件等額外項目，如有需要以追加報價單核定為準。',
  '7. 通訊軟體及電話均屬於溝通過程，所有產品內容和細節最終以簽署報價單最終版本為準。',
  '8. 兩造就契約履行所發生之爭議時，以臺灣新北地方法院為第一審管轄法院。',
  '9. 乙方如無鎖具要求，一律依甲方標準鎖體開孔，如乙方有自備鎖具，以乙方提供鎖具開孔圖或有備註時起為生產日。',
  '10. 本交易為附條件買賣，依動產擔保交易法第三章之規定，在貨款未完全付清或票據未兌現付價前，報價單之標的所有權仍屬甲方所有。',
  '11. 報價適用於上述條件與產品本身，如有特殊安裝需求及現場有礙難施工之情形，可委託甲方前往丈量確認。',
  '12. 如需委請甲方丈量，乙方需先付訂金3,000，訂金可折抵訂單總價。',
  '13. 保固服務：A.保證提供之（門體）非人為,外力,天災,地變因素導致外，皆有不變形3年保固服務。B.五金配件：如門鎖、鉸鏈等保固3年，他牌電子鎖依廠商保固期限為主。C.安裝保固：完工日起6個月內如有施工瑕疵免費處理。',
  '14. 保養：門片、把手及配件五金請用抹布搭配清水保養，請勿使用刺激性清潔產品（如：酒精、漂白水...等）。',
  '15. 乙方如需提前付款委請甲方丈量者；該款項將開立「暫收款憑證」，待最終報價單確認後，始一併開立統一發票；如未進入正式訂單階段，甲方無須另開發票，惟仍可提供收據作為付款憑證。',
  '16. 如有任何疑問，請即時聯絡業務人員。',
];

function fmtP(v) { return v ? 'NT$ ' + Number(v).toLocaleString() : '—'; }
function fmtDate(str) {
  const d = str ? new Date(str) : new Date();
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// 解析訂單編號（例如 NTPC-A-2026-04-001 → 地區/類別/年度/月份/流水號）
function parseQuoteNo(no) {
  if (!no) return { region: '', category: '', year: '', month: '', serial: '' };
  const parts = String(no).split('-');
  if (parts.length >= 5) return { region: parts[0], category: parts[1], year: parts[2], month: parts[3], serial: parts.slice(4).join('-') };
  return { region: no, category: '', year: '', month: '', serial: '' };
}

// ─── 估價單（SheetJS，純文字）────────────────────────────────────────────────
export function exportQuoteExcel(q) {
  const doorLabel = DOOR_TYPE_LABEL[q.door_type] || q.door_type || '—';
  const statusLabel = STATUS_LABEL[q.status] || q.status || '—';

  const aoa = [
    [COMPANY_NAME, '', '', ''],
    [COMPANY_INFO, '', '', ''],
    ['', '', '', ''],
    ['估價單', '', '', ''],
    ['', '', '', ''],
    ['估價單號', q.quote_no || '—', '日期', fmtDate(q.created_at)],
    ['狀態', statusLabel, '建單人', q.created_by || '—'],
    ['', '', '', ''],
    ['客戶姓名', q.customer_name || '—', '電話', q.customer_phone || '—'],
    ['地址', q.customer_addr || '—', '', ''],
    ['', '', '', ''],
    ['── 產品明細 ──', '', '', ''],
    ['產品代碼', '門型', '尺寸（cm）', '數量（堂）'],
    [q.product_code || '—', doorLabel, `${q.width_cm || '—'} × ${q.height_cm || '—'}`, q.quantity || 1],
    ['', '', '', ''],
    ['── 費用明細 ──', '', '', ''],
    ['門扇單價', '', '', fmtP(q.unit_price)],
    ['超規加價', '', '', fmtP(q.oversize_charge)],
    ['無電梯加價', '', '', fmtP(q.elevator_charge)],
    ['附加施工費', '', '', fmtP(q.addon_total)],
    ['', '', '', ''],
    ['含稅合計', '', '', fmtP(q.total_price)],
  ];

  if (q.breakdown) {
    aoa.push(['', '', '', '']);
    aoa.push(['── 費用說明 ──', '', '', '']);
    q.breakdown.split('\n').forEach(line => line.trim() && aoa.push(['', line.trim(), '', '']));
  }
  if (q.note) {
    aoa.push(['', '', '', '']);
    aoa.push(['備註', q.note, '', '']);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 18 }];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },
    { s: { r: 9, c: 1 }, e: { r: 9, c: 3 } },
    { s: { r: 11, c: 0 }, e: { r: 11, c: 3 } },
    { s: { r: 15, c: 0 }, e: { r: 15, c: 3 } },
    { s: { r: 17, c: 0 }, e: { r: 17, c: 2 } },
    { s: { r: 18, c: 0 }, e: { r: 18, c: 2 } },
    { s: { r: 19, c: 0 }, e: { r: 19, c: 2 } },
    { s: { r: 20, c: 0 }, e: { r: 20, c: 2 } },
    { s: { r: 22, c: 0 }, e: { r: 22, c: 2 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '估價單');
  XLSX.writeFile(wb, `估價單_${q.quote_no || 'export'}.xlsx`);
}

// ─── 報價單（ExcelJS，A4 完整公司範本）────────────────────────────────────────
export async function exportFormalQuoteExcel(c) {
  if (!c) return;
  const ExcelJS = (await import('exceljs')).default;

  const fd = c.formal_quote_data || {};
  const doorLabel = DOOR_TYPE_LABEL[c.door_type] || c.door_type || '單開門';
  const fireLabel = fd.fire_type === 'f60a' ? 'f60A防火'
                  : fd.fire_type === 'f60a_smoke' ? 'f60A遮煙門'
                  : fd.fire_type === 'soundproof' ? '隔音'
                  : c.is_fireproof ? 'f60A防火' : '不防火';
  const qty = c.quantity || 1;
  const wCM = fd.width_mm ? Math.round(fd.width_mm / 10) : (c.actual_width_cm || '');
  const hCM = fd.height_mm ? Math.round(fd.height_mm / 10) : (c.actual_height_cm || '');

  const reqs = fd.special_requirements || [];
  const reqChecks = ['無', '拆舊', '回收', '佔框', '濕式施工', '乾式包框', '站框'];
  const reqStr = reqChecks.map(r => (reqs.includes(r) ? '■' : '☐') + r).join('   ');

  // 訂單編號分段
  const noSeg = parseQuoteNo(c.formal_quote_no || c.order_no || c.case_no);

  // 單價
  let unitPrice = fd.unit_price || 0;
  if (!unitPrice && c.official_note) {
    const idx = c.official_note.indexOf('門扇單價:');
    if (idx !== -1) {
      let j = idx + 5, ns = '';
      while (j < c.official_note.length && c.official_note.charCodeAt(j) >= 48 && c.official_note.charCodeAt(j) <= 57) { ns += c.official_note[j]; j++; }
      if (ns) unitPrice = parseInt(ns, 10);
    }
  }
  if (!unitPrice && c.official_price && qty > 0) unitPrice = Math.round(c.official_price / qty);

  const discountRate = c.discount_rate || 1;
  const doorSubtotal = unitPrice * qty;
  const discounted = c.official_price || Math.round(doorSubtotal * discountRate);
  const installFee = c.install_fee || 0;
  const deliveryFee = fd.delivery_fee || 0; // 搬運費用

  // 追加報價（最多 3 行 + 小計）
  let addonTotal = 0;
  const addonParsed = [];
  if (c.addon_items) {
    c.addon_items.split('\n').forEach(raw => {
      const line = raw.trim();
      if (!line) return;
      let i = line.length - 1;
      while (i >= 0 && (line[i] === ' ' || (line.charCodeAt(i) >= 48 && line.charCodeAt(i) <= 57) || line[i] === ',')) i--;
      const numStart = i + 1;
      if (numStart < line.length) {
        const amt = parseInt(line.substring(numStart).trim().replace(/,/g, ''), 10);
        if (!isNaN(amt)) { addonTotal += amt; addonParsed.push([line.substring(0, numStart).trim(), amt]); return; }
      }
      addonParsed.push([line, null]);
    });
  }

  const totalPrice = c.total_with_tax || (discounted + addonTotal + installFee + deliveryFee);
  const measureFee = c.measure_fee || 3000;
  const deposit = c.deposit_50 || Math.round(totalPrice * 0.5);
  const balance = c.balance || (totalPrice - deposit - measureFee);

  // 付款方式（從 fd 讀取，預設未勾選）
  const payMethods = fd.payment_methods || {}; // { measure: 'cash'/'transfer'/'card', deposit: ..., balance: ... }
  const checkMark = (val, target) => val === target ? '■' : '☐';

  // 五金配件
  const acc = fd.accessories || [];
  const accStr = acc.length ? acc.map(a => `${a.label}：${a.useUpgrade ? a.upgrade : a.standard}${a.useUpgrade ? '（選配）' : ''}`).join('\n') : '—';

  // ── Build workbook ──────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = '門的世界 DOORWORLD';
  const ws = wb.addWorksheet('報價單');

  // 4-欄版面：A=標籤 B=值 C=標籤 D=值
  ws.columns = [
    { width: 16 },
    { width: 26 },
    { width: 16 },
    { width: 26 },
  ];

  const GOLD   = 'FFC9A227';
  const DARK   = 'FF1A1A1A';
  const CREAM  = 'FFFFF9F0';
  const LBLUE  = 'FFF5ECC8';
  const WHITE  = 'FFFFFFFF';
  const GRAY   = 'FFF5F5F5';
  const BORDER = { style: 'thin', color: { argb: 'FFD4AF37' } };
  const ALL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

  function s(cell, { fill, font, align, border } = {}) {
    if (fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
    if (font) cell.font = { name: '微軟正黑體', ...font };
    if (align) cell.alignment = align;
    if (border) cell.border = border;
  }

  function labelCell(addr, text, opts = {}) {
    const cell = ws.getCell(addr);
    cell.value = text;
    s(cell, { fill: LBLUE, font: { bold: true, size: 10, color: { argb: 'FF5A4800' } }, align: { vertical: 'middle', horizontal: 'center' }, border: ALL_BORDERS, ...opts });
    return cell;
  }
  function valueCell(addr, text, opts = {}) {
    const cell = ws.getCell(addr);
    cell.value = text ?? '—';
    s(cell, { fill: WHITE, font: { size: 11 }, align: { vertical: 'middle', wrapText: true }, border: ALL_BORDERS, ...opts });
    return cell;
  }
  function sectionHeader(addr, text) {
    s(ws.getCell(addr), { fill: DARK, font: { bold: true, size: 11, color: { argb: GOLD } }, align: { horizontal: 'center', vertical: 'middle' } });
    ws.getCell(addr).value = text;
  }

  let r = 1;

  // ── 1. 公司頁首 ──
  ws.mergeCells(`A${r}:D${r}`);
  s(ws.getCell(`A${r}`), { fill: DARK, font: { bold: true, size: 14, color: { argb: GOLD } }, align: { horizontal: 'center', vertical: 'middle' } });
  ws.getCell(`A${r}`).value = COMPANY_NAME;
  ws.getRow(r).height = 30; r++;

  ws.mergeCells(`A${r}:D${r}`);
  s(ws.getCell(`A${r}`), { fill: DARK, font: { size: 9, color: { argb: 'FFAAAAAA' } }, align: { horizontal: 'center', vertical: 'middle' } });
  ws.getCell(`A${r}`).value = COMPANY_INFO;
  ws.getRow(r).height = 16; r++;

  // ── 2. 報價單標題 ──
  ws.mergeCells(`A${r}:D${r}`);
  s(ws.getCell(`A${r}`), { fill: CREAM, font: { bold: true, size: 22, color: { argb: DARK } }, align: { horizontal: 'center', vertical: 'middle' } });
  ws.getCell(`A${r}`).value = '報  價  單  QUOTE';
  ws.getRow(r).height = 44; r++;

  // 版本日期
  ws.mergeCells(`A${r}:D${r}`);
  s(ws.getCell(`A${r}`), { fill: GRAY, font: { size: 9, color: { argb: 'FF666666' } }, align: { horizontal: 'right', vertical: 'middle' } });
  ws.getCell(`A${r}`).value = '版本/更新日期：001/20251212    ';
  ws.getRow(r).height = 14; r++;

  // ── 3. 訂單編號 ──
  sectionHeader(`A${r}`, '');
  ws.mergeCells(`A${r}:D${r}`);
  ws.getCell(`A${r}`).value = '▌ 訂單資訊';
  ws.getRow(r).height = 22; r++;

  labelCell(`A${r}`, '訂單編號'); valueCell(`B${r}`, c.formal_quote_no || c.order_no || '—', { font: { bold: true, size: 12 } });
  labelCell(`C${r}`, '建單日期'); valueCell(`D${r}`, fmtDate(c.official_quote_at || c.created_at));
  ws.getRow(r).height = 22; r++;

  labelCell(`A${r}`, '地區/類別'); valueCell(`B${r}`, `${noSeg.region || '—'} / ${noSeg.category || '—'}`);
  labelCell(`C${r}`, '年度/月份/流水'); valueCell(`D${r}`, `${noSeg.year || '—'} / ${noSeg.month || '—'} / ${noSeg.serial || '—'}`);
  ws.getRow(r).height = 20; r++;

  labelCell(`A${r}`, '建單者/CODE'); valueCell(`B${r}`, c.created_by || '—');
  labelCell(`C${r}`, '承辦業務'); valueCell(`D${r}`, c.sales_person || '—');
  ws.getRow(r).height = 20; r++;

  // ── 4. 甲方/乙方 ──
  ws.mergeCells(`A${r}:D${r}`);
  sectionHeader(`A${r}`, '▌ 甲方（賣方） / 乙方（買方）');
  ws.getRow(r).height = 22; r++;

  labelCell(`A${r}`, '甲方'); valueCell(`B${r}`, '門的世界 DOORWORLD');
  labelCell(`C${r}`, '甲方電話'); valueCell(`D${r}`, '02-22920366');
  ws.getRow(r).height = 20; r++;

  labelCell(`A${r}`, '聯絡人'); valueCell(`B${r}`, c.customer_name || c.contact_person || '—', { font: { bold: true, size: 11 } });
  labelCell(`C${r}`, '統編'); valueCell(`D${r}`, c.tax_id || '—');
  ws.getRow(r).height = 20; r++;

  labelCell(`A${r}`, '電話'); valueCell(`B${r}`, c.customer_phone || '—');
  labelCell(`C${r}`, '樓層/電梯'); valueCell(`D${r}`, `${fd.floor || '—'} F  ${fd.has_elevator === false ? '☐有電梯  ■無電梯' : '■有電梯  ☐無電梯'}`);
  ws.getRow(r).height = 20; r++;

  labelCell(`A${r}`, '案場地址');
  ws.mergeCells(`B${r}:D${r}`);
  valueCell(`B${r}`, c.case_address || c.customer_addr || '—');
  ws.getRow(r).height = 22; r++;

  // ── 5. 門體規格 ──
  ws.mergeCells(`A${r}:D${r}`);
  sectionHeader(`A${r}`, '▌ 門體規格');
  ws.getRow(r).height = 22; r++;

  labelCell(`A${r}`, '產品編號'); valueCell(`B${r}`, c.product_code || '—', { font: { bold: true, size: 11 } });
  labelCell(`C${r}`, '材質/工藝'); valueCell(`D${r}`, fd.material || '—');
  ws.getRow(r).height = 20; r++;

  labelCell(`A${r}`, '前板樣式'); valueCell(`B${r}`, fd.front_panel_style || '—');
  labelCell(`C${r}`, '背板樣式'); valueCell(`D${r}`, fd.back_panel_style || '—');
  ws.getRow(r).height = 20; r++;

  labelCell(`A${r}`, '門的需求'); valueCell(`B${r}`, doorLabel);
  labelCell(`C${r}`, '其他需求'); valueCell(`D${r}`, fireLabel);
  ws.getRow(r).height = 20; r++;

  labelCell(`A${r}`, '運送安裝方式'); valueCell(`B${r}`, fd.install_method || '甲方派送安裝');
  labelCell(`C${r}`, '交貨時間'); valueCell(`D${r}`, `${c.delivery_days || 90} 日曆天`);
  ws.getRow(r).height = 20; r++;

  labelCell(`A${r}`, '特殊需求');
  ws.mergeCells(`B${r}:D${r}`);
  valueCell(`B${r}`, reqStr);
  ws.getRow(r).height = 22; r++;

  labelCell(`A${r}`, '搬運費用'); valueCell(`B${r}`, deliveryFee ? fmtP(deliveryFee) : '無');
  ws.mergeCells(`C${r}:D${r}`);
  valueCell(`C${r}`, '*桃園以北適用，新竹以南/宜蘭/花蓮/台東另議', { font: { size: 9, color: { argb: 'FF888888' } } });
  ws.getRow(r).height = 20; r++;

  // ── 6. 門框尺寸 ──
  ws.mergeCells(`A${r}:D${r}`);
  sectionHeader(`A${r}`, '▌ 門框尺寸 (mm) — 請務必再次確認');
  ws.getRow(r).height = 22; r++;

  labelCell(`A${r}`, '圖號'); valueCell(`B${r}`, fd.drawing_no || '—');
  labelCell(`C${r}`, '門樘數量'); valueCell(`D${r}`, fd.frame_count || qty);
  ws.getRow(r).height = 20; r++;

  labelCell(`A${r}`, '門洞寬(W)'); valueCell(`B${r}`, wCM ? `${wCM * 10} mm (${wCM} cm)` : '—');
  labelCell(`C${r}`, '門洞高(H)'); valueCell(`D${r}`, hCM ? `${hCM * 10} mm (${hCM} cm)` : '—');
  ws.getRow(r).height = 20; r++;

  labelCell(`A${r}`, '門開方向'); valueCell(`B${r}`, `${fd.door_direction || '—'} （人在外向內看）`);
  labelCell(`C${r}`, '交貨方式'); valueCell(`D${r}`, fd.delivery_type || '框扇同時');
  ws.getRow(r).height = 20; r++;

  labelCell(`A${r}`, '框厚 (如不清楚可空白)'); valueCell(`B${r}`, fd.frame_thickness || '—');
  labelCell(`C${r}`, '扇厚 (如不清楚可空白)'); valueCell(`D${r}`, fd.panel_thickness || '—');
  ws.getRow(r).height = 20; r++;

  labelCell(`A${r}`, '藝術框'); valueCell(`B${r}`, fd.art_frame || '無');
  labelCell(`C${r}`, '門扇單價'); valueCell(`D${r}`, fmtP(unitPrice), { font: { bold: true, size: 11, color: { argb: GOLD } } });
  ws.getRow(r).height = 20; r++;

  labelCell(`A${r}`, '門扇顏色'); valueCell(`B${r}`, fd.door_color || '—');
  labelCell(`C${r}`, '門鎖樣式'); valueCell(`D${r}`, fd.lock_style || '—');
  ws.getRow(r).height = 20; r++;

  // ── 7. 五金配件 ──
  if (acc.length > 0) {
    ws.mergeCells(`A${r}:D${r}`);
    sectionHeader(`A${r}`, '▌ 五金配件');
    ws.getRow(r).height = 22; r++;

    labelCell(`A${r}`, '配件清單');
    ws.mergeCells(`B${r}:D${r}`);
    valueCell(`B${r}`, accStr, { align: { vertical: 'top', wrapText: true } });
    ws.getRow(r).height = Math.max(20, acc.length * 18); r++;
  }

  // ── 8. 追加報價（最多 3 行 + 小計）──
  ws.mergeCells(`A${r}:D${r}`);
  sectionHeader(`A${r}`, '▌ 追加報價');
  ws.getRow(r).height = 22; r++;

  // 顯示前 3 行 (不夠補空)
  for (let i = 0; i < 3; i++) {
    const item = addonParsed[i] || [null, null];
    labelCell(`A${r}`, `項目 ${i + 1}`);
    ws.mergeCells(`B${r}:C${r}`);
    valueCell(`B${r}`, item[0] || '—');
    valueCell(`D${r}`, item[1] != null ? fmtP(item[1]) : '—', { align: { horizontal: 'right', vertical: 'middle' } });
    ws.getRow(r).height = 20; r++;
  }
  // 額外項目（>3 行的合併到備註區）
  if (addonParsed.length > 3) {
    const extraStr = addonParsed.slice(3).map(([lbl, amt]) => `${lbl}：${amt != null ? fmtP(amt) : '—'}`).join('\n');
    labelCell(`A${r}`, '其他項目');
    ws.mergeCells(`B${r}:D${r}`);
    valueCell(`B${r}`, extraStr, { align: { vertical: 'top', wrapText: true } });
    ws.getRow(r).height = Math.max(20, (addonParsed.length - 3) * 18); r++;
  }

  // 小計
  labelCell(`A${r}`, '小計金額');
  ws.mergeCells(`B${r}:C${r}`);
  valueCell(`B${r}`, '');
  valueCell(`D${r}`, fmtP(addonTotal), { font: { bold: true, size: 12, color: { argb: GOLD } }, align: { horizontal: 'right', vertical: 'middle' } });
  ws.getRow(r).height = 22; r++;

  // ── 9. 備註 ──
  if (c.note) {
    labelCell(`A${r}`, '備註事項');
    ws.mergeCells(`B${r}:D${r}`);
    valueCell(`B${r}`, c.note, { align: { vertical: 'top', wrapText: true } });
    ws.getRow(r).height = 40; r++;
  }

  // ── 10. 訂單金額（含付款方式）──
  ws.mergeCells(`A${r}:D${r}`);
  sectionHeader(`A${r}`, '▌ 訂單金額 / 付款方式');
  ws.getRow(r).height = 22; r++;

  // 表頭
  labelCell(`A${r}`, '項目');
  labelCell(`B${r}`, '金額', { align: { horizontal: 'right', vertical: 'middle' } });
  ws.mergeCells(`C${r}:D${r}`);
  labelCell(`C${r}`, '付款方式');
  ws.getRow(r).height = 20; r++;

  // 丈量費用
  labelCell(`A${r}`, '丈量費用', { fill: WHITE, font: { bold: false, size: 11, color: { argb: DARK } } });
  valueCell(`B${r}`, fmtP(measureFee), { align: { horizontal: 'right', vertical: 'middle' } });
  ws.mergeCells(`C${r}:D${r}`);
  valueCell(`C${r}`, `${checkMark(payMethods.measure, 'cash')}現金   ${checkMark(payMethods.measure, 'transfer')}匯款   ${checkMark(payMethods.measure, 'card')}信用卡(綠界)`);
  ws.getRow(r).height = 22; r++;

  // 訂金 50%
  labelCell(`A${r}`, '訂金 50%', { fill: WHITE, font: { bold: false, size: 11, color: { argb: DARK } } });
  valueCell(`B${r}`, fmtP(deposit), { align: { horizontal: 'right', vertical: 'middle' } });
  ws.mergeCells(`C${r}:D${r}`);
  valueCell(`C${r}`, `${checkMark(payMethods.deposit, 'cash')}現金   ${checkMark(payMethods.deposit, 'transfer')}匯款   ${checkMark(payMethods.deposit, 'card')}信用卡(綠界)`);
  ws.getRow(r).height = 22; r++;

  // 尾款
  labelCell(`A${r}`, '尾款', { fill: WHITE, font: { bold: false, size: 11, color: { argb: DARK } } });
  valueCell(`B${r}`, fmtP(balance), { align: { horizontal: 'right', vertical: 'middle' } });
  ws.mergeCells(`C${r}:D${r}`);
  valueCell(`C${r}`, `${checkMark(payMethods.balance, 'cash')}現金   ${checkMark(payMethods.balance, 'transfer')}匯款   ${checkMark(payMethods.balance, 'card')}信用卡(綠界)   ${checkMark(payMethods.balance, 'measure_paid')}丈量費已付`);
  ws.getRow(r).height = 22; r++;

  // 含稅總價
  s(ws.getCell(`A${r}`), { fill: DARK, font: { bold: true, size: 13, color: { argb: GOLD } }, align: { horizontal: 'center', vertical: 'middle' }, border: ALL_BORDERS });
  ws.getCell(`A${r}`).value = '含稅總價';
  ws.mergeCells(`B${r}:D${r}`);
  s(ws.getCell(`B${r}`), { fill: DARK, font: { bold: true, size: 16, color: { argb: GOLD } }, align: { horizontal: 'right', vertical: 'middle' }, border: ALL_BORDERS });
  ws.getCell(`B${r}`).value = fmtP(totalPrice);
  ws.getRow(r).height = 32; r++;

  // ── 11. 客戶確認回傳 ──
  r++; // spacer
  ws.mergeCells(`A${r}:D${r}`);
  s(ws.getCell(`A${r}`), { fill: GRAY, font: { bold: true, size: 11, color: { argb: DARK } }, align: { horizontal: 'left', vertical: 'middle' } });
  ws.getCell(`A${r}`).value = '客戶確認回傳（發票章 / 簽章 / 全名 / 日期）';
  ws.getRow(r).height = 22; r++;

  ws.mergeCells(`A${r}:D${r}`);
  s(ws.getCell(`A${r}`), { fill: WHITE, font: { size: 10, color: { argb: 'FF555555' } }, align: { horizontal: 'left', vertical: 'middle', wrapText: true }, border: ALL_BORDERS });
  ws.getCell(`A${r}`).value = '本人已詳細核對上述訂購單注意事項，確保其正確性。\n\n簽章：____________________     日期：____________________';
  ws.getRow(r).height = 60; r++;

  // ── 12. 報價單注意事項 16 條 ──
  r++; // spacer
  ws.mergeCells(`A${r}:D${r}`);
  sectionHeader(`A${r}`, '▌ 報價單注意事項');
  ws.getRow(r).height = 22; r++;

  QUOTE_TERMS.forEach((line, idx) => {
    ws.mergeCells(`A${r}:D${r}`);
    const isHeader = idx === 0;
    s(ws.getCell(`A${r}`), {
      fill: isHeader ? LBLUE : WHITE,
      font: { size: 9, color: { argb: 'FF333333' }, bold: isHeader },
      align: { vertical: 'top', wrapText: true, horizontal: 'left' },
      border: ALL_BORDERS,
    });
    ws.getCell(`A${r}`).value = line;
    // 動態行高
    const len = line.length;
    ws.getRow(r).height = Math.max(18, Math.ceil(len / 50) * 16);
    r++;
  });

  // ── 13. 頁尾 ──
  r++;
  ws.mergeCells(`A${r}:D${r}`);
  s(ws.getCell(`A${r}`), { fill: DARK, font: { size: 8, color: { argb: 'FF888888' } }, align: { horizontal: 'center', vertical: 'middle' } });
  ws.getCell(`A${r}`).value = '門的世界 DOORWORLD　展億室內開發有限公司　|　TEL: 02-22920366　|　Email: doorworld168@gmail.com';
  ws.getRow(r).height = 20;

  // ── Download ──
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `報價單_${c.formal_quote_no || c.order_no || 'export'}.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href);
}
