// Formal Quote (報價單) PDF generator — opens print-ready HTML in new window
// Used by FormalQuote and NewFormalQuote pages

const COMPANY = {
  nameZh: '展億室內開發有限公司',
  nameEn: 'Door World',
  brandZh: '門的世界',
  taxId: '60667469',
  addr: '新北市五股區成泰路一段130-3號',
  phone: '02-2292-0366',
  web: 'doorworld.com.tw',
  tagline: '頂級大門・專業安裝・品質保證'
};

const DOOR_LABEL = { single: '單門', mother: '子母門', double: '雙開門', fire: '防火單門', room: '房間門', bathroom: '衛浴門', sliding: '橫拉門' };

function fmtP(v) { return (v || v === 0) ? 'NT$ ' + Number(v).toLocaleString() : '—'; }
function fmtDate(str) {
  const d = str ? new Date(str) : new Date();
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Open a formal quote PDF (報價單) in a new window with print dialog
 * @param {object} c - case/quote record from Supabase
 */
export function printFormalQuote(c) {
  if (!c) { alert('找不到報價單資料'); return; }

  const fq = c.formal_quote_data || {};
  const accessories = Array.isArray(fq.accessories) ? fq.accessories : [];
  const services = Array.isArray(fq.services) ? fq.services : [];
  const quoteNo = c.formal_quote_no || c.order_no || c.case_no || '—';
  const today = fmtDate(null);
  const dateStr = fmtDate(c.created_at);

  const doorLabel = DOOR_LABEL[c.door_type] || c.door_type || '—';
  const fireLabel = fq.fire_type === 'f60a' ? 'F60A 防火' : fq.fire_type === 'f60a_smoke' ? 'F60A 遮煙' : c.is_fireproof ? '防火' : '一般';
  const wCM = c.actual_width_cm || (fq.width_mm ? Math.round(fq.width_mm / 10) : '');
  const hCM = c.actual_height_cm || (fq.height_mm ? Math.round(fq.height_mm / 10) : '');
  const sizeStr = wCM && hCM ? `寬 ${wCM} × 高 ${hCM} cm` : '—';
  const qty = c.quantity || 1;

  // Build main product rows (门扇单价 + 超尺寸等)
  const mainRows = [];
  if (fq.door_unit_price || c.official_price) mainRows.push(['門扇單價', fq.door_unit_price || c.official_price]);
  if (fq.oversize_charge) mainRows.push(['超尺寸加收', fq.oversize_charge]);
  if (fq.elevator_charge) mainRows.push(['無電梯搬運', fq.elevator_charge]);
  if (mainRows.length === 0) mainRows.push(['門扇總價', c.official_price || 0]);

  // Calculate subtotal
  let subtotal = 0;
  mainRows.forEach(([, v]) => subtotal += Number(v || 0));
  services.forEach(s => subtotal += Number(s.amount || s.price || 0));
  accessories.forEach(a => subtotal += Number(a.amount || (a.price * (a.qty || 1)) || 0));

  // If official_price already exists, trust it as subtotal
  if (c.total_with_tax) {
    const taxFromTotal = Math.round(c.total_with_tax / 21); // 5/105
    subtotal = c.total_with_tax - taxFromTotal;
  } else if (c.official_price) {
    subtotal = c.official_price;
  }

  const tax = Math.round(subtotal * 0.05);
  const totalWithTax = c.total_with_tax || (subtotal + tax);

  // Render accessory rows
  const accRowsHtml = accessories.length === 0 ? '' : `
    <div class="sec"><div class="stitle"><span class="stitle-txt">五金配件</span></div>
    <table class="bd-table">
      ${accessories.map(a => `<tr>
        <td class="bdl">${a.name || a.item || '—'}</td>
        <td class="bdv" style="text-align:center;width:70px;font-size:10px">${a.qty || 1}</td>
        <td class="bdv">${fmtP(a.amount || (Number(a.price || 0) * Number(a.qty || 1)))}</td>
      </tr>`).join('')}
    </table></div>`;

  // Render service rows
  const svcRowsHtml = services.length === 0 ? '' : `
    <div class="sec"><div class="stitle"><span class="stitle-txt">施工項目</span></div>
    <table class="bd-table">
      ${services.map(s => `<tr>
        <td class="bdl">${s.name || s.item || '—'}</td>
        <td class="bdv">${fmtP(s.amount || s.price)}</td>
      </tr>`).join('')}
    </table></div>`;

  const html = `<!DOCTYPE html><html><head>
<meta charset="utf-8"><title>報價單 ${quoteNo}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:210mm}
body{font-family:"Noto Sans TC",sans-serif;background:#fff;color:#1a1a1a;font-size:11px;line-height:1.55}
.page{width:210mm;min-height:297mm;padding:12mm 14mm 10mm;display:flex;flex-direction:column}
.hdr{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:10px;border-bottom:2.5px solid #c9a227;margin-bottom:10px}
.logo-zh{font-size:30px;font-weight:900;color:#1a1a1a;letter-spacing:2px;line-height:1}
.logo-en{font-size:10px;font-weight:700;color:#c9a227;letter-spacing:4px;text-transform:uppercase;margin-top:3px}
.co-info{font-size:8.5px;color:#666;line-height:1.65;margin-top:6px}
.co-info strong{color:#1a1a1a;font-weight:700}
.hdr-r{text-align:right;flex-shrink:0}
.doc-type{font-size:9px;font-weight:700;letter-spacing:4px;color:#888;text-transform:uppercase;margin-bottom:4px}
.qno{font-size:16px;font-weight:900;color:#1a1a1a;letter-spacing:1px}
.badge{display:inline-block;margin-top:4px;padding:3px 12px;border-radius:2px;font-size:9px;font-weight:700;letter-spacing:1px;color:#fff;background:#1a5c38}
.doc-date{font-size:9px;color:#666;margin-top:6px}
.infobar{display:flex;border:1px solid #d4af37;margin-bottom:8px}
.ic{flex:1;padding:7px 12px;border-right:1px solid #d4af37}
.ic:last-child{border-right:none}
.icl{font-size:8px;font-weight:700;letter-spacing:2px;color:#c9a227;text-transform:uppercase;margin-bottom:3px}
.icv{font-size:11.5px;font-weight:700;color:#1a1a1a}
.addr{margin-bottom:8px;padding:6px 11px;background:#f9f6ec;border:1px solid #d4af37;font-size:10.5px;color:#3a3a3a}
.addr-lbl{font-size:8px;font-weight:700;letter-spacing:2px;color:#c9a227;margin-right:8px}
.stitle{display:flex;align-items:center;gap:8px;margin-bottom:5px}
.stitle-txt{font-size:8px;font-weight:700;letter-spacing:3px;text-transform:uppercase;white-space:nowrap;padding:3px 10px;background:#1a1a1a;color:#c9a227}
.stitle::after{content:"";flex:1;height:1px;background:#d4af37}
.sec{margin-bottom:9px}
table{width:100%;border-collapse:collapse}
.tdl{width:95px;padding:5px 10px;background:#f9f6ec;color:#555;font-size:9.5px;font-weight:600;border:1px solid #e2d5a0;vertical-align:middle}
.tdv{padding:5px 10px;color:#1a1a1a;font-size:11px;border:1px solid #e2d5a0;word-break:break-word}
.bd-table{border:1px solid #e2d5a0}
.bdl{padding:5px 12px;background:#f9f6ec;color:#555;font-size:10px;font-weight:600;border-bottom:1px solid #e8dfb8}
.bdv{padding:5px 12px;color:#1a1a1a;font-size:11px;text-align:right;font-weight:600;border-bottom:1px solid #e8dfb8;font-variant-numeric:tabular-nums}
.bd-table tr:last-child .bdl,.bd-table tr:last-child .bdv{border-bottom:none}
.tax-box{margin-top:8px;border:1px solid #1a1a1a}
.tax-row{display:flex;justify-content:space-between;padding:7px 14px;border-bottom:1px solid #333}
.tax-row:last-child{border-bottom:none;background:#1a1a1a;color:#c9a227}
.tax-row.subtotal,.tax-row.tax{background:#fafafa}
.tax-lbl{font-size:10px;font-weight:600;letter-spacing:1px;color:#555}
.tax-val{font-size:12px;font-weight:700;color:#1a1a1a;font-variant-numeric:tabular-nums}
.tax-row:last-child .tax-lbl{color:#c9a227;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase}
.tax-row:last-child .tax-val{color:#c9a227;font-size:22px;font-weight:900;letter-spacing:1px}
.disclaimer{margin-top:7px;padding:6px 10px;background:#f9f6ec;border-left:3px solid #c9a227;font-size:8.5px;color:#666;line-height:1.75}
.spacer{flex:1;min-height:10px}
.sign-row{display:flex;gap:14px;margin-top:14px;margin-bottom:12px}
.sign-box{flex:1;border:1px solid #ccc;padding:10px 14px;min-height:68px;position:relative}
.sign-lbl{font-size:8.5px;font-weight:700;letter-spacing:2px;color:#888;text-transform:uppercase;position:absolute;top:-7px;left:10px;background:#fff;padding:0 6px}
.sign-date{position:absolute;bottom:6px;right:10px;font-size:8px;color:#999}
.foot{padding-top:8px;border-top:1px solid #d4af37;display:flex;justify-content:space-between;align-items:flex-end;font-size:9px;color:#666}
.foot-brand{font-size:11px;font-weight:900;color:#1a1a1a;letter-spacing:1px}
.noprint{text-align:center;padding:12px;background:#1a1a1a;border-bottom:2px solid #c9a227}
.noprint button{background:#c9a227;color:#1a1a1a;border:none;padding:9px 30px;font-size:13px;font-weight:900;cursor:pointer;font-family:"Noto Sans TC",sans-serif;letter-spacing:2px}
@media print{.noprint{display:none}html,body{width:210mm}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{page-break-after:avoid}@page{margin:0;size:A4}}
</style></head><body>
<div class="noprint"><button onclick="window.print()">列印 / 儲存 PDF</button></div>
<div class="page">
  <div class="hdr">
    <div>
      <div class="logo-zh">${COMPANY.brandZh}</div>
      <div class="logo-en">${COMPANY.nameEn}</div>
      <div class="co-info">
        <strong>${COMPANY.nameZh}</strong>　統編 ${COMPANY.taxId}<br>
        ${COMPANY.addr}　T. ${COMPANY.phone}<br>
        ${COMPANY.web}
      </div>
    </div>
    <div class="hdr-r">
      <div class="doc-type">正式報價單 Formal Quotation</div>
      <div class="qno">${quoteNo}</div>
      <span class="badge">正式報價</span>
      <div class="doc-date">${dateStr}</div>
    </div>
  </div>
  <div class="infobar">
    <div class="ic"><div class="icl">客戶姓名</div><div class="icv">${c.customer_name || '—'}</div></div>
    <div class="ic"><div class="icl">聯絡電話</div><div class="icv">${c.customer_phone || '—'}</div></div>
    ${c.sales_person ? `<div class="ic"><div class="icl">業務窗口</div><div class="icv">${c.sales_person}</div></div>` : ''}
  </div>
  ${c.case_address ? `<div class="addr"><span class="addr-lbl">施工地址</span>${c.case_address}</div>` : ''}

  <div class="sec"><div class="stitle"><span class="stitle-txt">產品資訊</span></div>
  <table>
    <tr><td class="tdl">產品編號</td><td class="tdv" style="font-family:monospace;font-size:12px;font-weight:700">${c.product_code || '—'}</td></tr>
    <tr><td class="tdl">門型</td><td class="tdv">${doorLabel}　/　${fireLabel}</td></tr>
    <tr><td class="tdl">尺寸規格</td><td class="tdv">${sizeStr}</td></tr>
    <tr><td class="tdl">數量</td><td class="tdv">${qty} 樘</td></tr>
  </table></div>

  <div class="sec"><div class="stitle"><span class="stitle-txt">門扇費用</span></div>
  <table class="bd-table">
    ${mainRows.map(([l, v]) => `<tr><td class="bdl">${l}</td><td class="bdv">${fmtP(v)}</td></tr>`).join('')}
  </table></div>

  ${accRowsHtml}
  ${svcRowsHtml}

  <div class="sec">
    <div class="tax-box">
      <div class="tax-row subtotal"><div class="tax-lbl">小計（未稅）</div><div class="tax-val">${fmtP(subtotal)}</div></div>
      <div class="tax-row tax"><div class="tax-lbl">營業稅 5%</div><div class="tax-val">${fmtP(tax)}</div></div>
      <div class="tax-row"><div class="tax-lbl">含稅總計</div><div class="tax-val">${fmtP(totalWithTax)}</div></div>
    </div>
  </div>

  <div class="disclaimer">
    ・本報價單為正式報價，經雙方簽署後生效，報價含大門本體、五金配件與基礎安裝。
    ・付款方式：簽約時付 50% 訂金，到貨安裝完成驗收後付尾款 50%。
    ・本報價有效期限自出單日起 <strong>30 天</strong>，逾期請重新詢價。
  </div>

  <div class="spacer"></div>

  <div class="sign-row">
    <div class="sign-box"><span class="sign-lbl">客戶簽章</span><span class="sign-date">日期：　　　年　　月　　日</span></div>
    <div class="sign-box"><span class="sign-lbl">公司簽章</span><span class="sign-date">${COMPANY.nameZh}</span></div>
  </div>

  <div class="foot">
    <div><span class="foot-brand">${COMPANY.brandZh} ${COMPANY.nameEn}</span>　${COMPANY.tagline}</div>
    <div>列印日期：${today}</div>
  </div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},300);}<\/script>
</body></html>`;

  const win = window.open('', '_blank', 'width=820,height=1160');
  if (!win) { alert('請允許彈出視窗以列印 PDF'); return; }
  win.document.write(html);
  win.document.close();
}
