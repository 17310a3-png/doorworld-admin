import{r as f,a as E,c as q,j as t,p as A,s as F}from"./index-BGbVHTGT.js";import{a as N,g as D,f as S,C as P,e as R,P as v}from"./utils-CgBJMdzV.js";import{S as L}from"./StatCard-DRyKRCRc.js";const d={nameZh:"展億室內開發有限公司",nameEn:"Door World",brandZh:"門的世界",taxId:"60667469",addr:"新北市五股區成泰路一段130-3號",phone:"02-2292-0366",web:"doorworld.com.tw",tagline:"頂級大門・專業安裝・品質保證"},M={single:"單門",mother:"子母門",double:"雙開門",fire:"防火單門",room:"房間門",bathroom:"衛浴門",sliding:"橫拉門"};function m(e){return e||e===0?"NT$ "+Number(e).toLocaleString():"—"}function C(e){return(e?new Date(e):new Date).toLocaleDateString("zh-TW",{year:"numeric",month:"long",day:"numeric"})}function O(e){if(!e){alert("找不到報價單資料");return}const i=e.formal_quote_data||{},n=Array.isArray(i.accessories)?i.accessories:[],g=Array.isArray(i.services)?i.services:[],c=e.formal_quote_no||e.order_no||e.case_no||"—",h=C(null),p=C(e.created_at),y=M[e.door_type]||e.door_type||"—",r=i.fire_type==="f60a"?"F60A 防火":i.fire_type==="f60a_smoke"?"F60A 遮煙":e.is_fireproof?"防火":"一般",u=e.actual_width_cm||(i.width_mm?Math.round(i.width_mm/10):""),w=e.actual_height_cm||(i.height_mm?Math.round(i.height_mm/10):""),_=u&&w?`寬 ${u} × 高 ${w} cm`:"—",j=e.quantity||1,l=[];(i.door_unit_price||e.official_price)&&l.push(["門扇單價",i.door_unit_price||e.official_price]),i.oversize_charge&&l.push(["超尺寸加收",i.oversize_charge]),i.elevator_charge&&l.push(["無電梯搬運",i.elevator_charge]),l.length===0&&l.push(["門扇總價",e.official_price||0]);let o=0;if(l.forEach(([,s])=>o+=Number(s||0)),g.forEach(s=>o+=Number(s.amount||s.price||0)),n.forEach(s=>o+=Number(s.amount||s.price*(s.qty||1)||0)),e.total_with_tax){const s=Math.round(e.total_with_tax/21);o=e.total_with_tax-s}else e.official_price&&(o=e.official_price);const b=Math.round(o*.05),$=e.total_with_tax||o+b,a=n.length===0?"":`
    <div class="sec"><div class="stitle"><span class="stitle-txt">五金配件</span></div>
    <table class="bd-table">
      ${n.map(s=>`<tr>
        <td class="bdl">${s.name||s.item||"—"}</td>
        <td class="bdv" style="text-align:center;width:70px;font-size:10px">${s.qty||1}</td>
        <td class="bdv">${m(s.amount||Number(s.price||0)*Number(s.qty||1))}</td>
      </tr>`).join("")}
    </table></div>`,x=g.length===0?"":`
    <div class="sec"><div class="stitle"><span class="stitle-txt">施工項目</span></div>
    <table class="bd-table">
      ${g.map(s=>`<tr>
        <td class="bdl">${s.name||s.item||"—"}</td>
        <td class="bdv">${m(s.amount||s.price)}</td>
      </tr>`).join("")}
    </table></div>`,z=`<!DOCTYPE html><html><head>
<meta charset="utf-8"><title>報價單 ${c}</title>
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
      <div class="logo-zh">${d.brandZh}</div>
      <div class="logo-en">${d.nameEn}</div>
      <div class="co-info">
        <strong>${d.nameZh}</strong>　統編 ${d.taxId}<br>
        ${d.addr}　T. ${d.phone}<br>
        ${d.web}
      </div>
    </div>
    <div class="hdr-r">
      <div class="doc-type">正式報價單 Formal Quotation</div>
      <div class="qno">${c}</div>
      <span class="badge">正式報價</span>
      <div class="doc-date">${p}</div>
    </div>
  </div>
  <div class="infobar">
    <div class="ic"><div class="icl">客戶姓名</div><div class="icv">${e.customer_name||"—"}</div></div>
    <div class="ic"><div class="icl">聯絡電話</div><div class="icv">${e.customer_phone||"—"}</div></div>
    ${e.sales_person?`<div class="ic"><div class="icl">業務窗口</div><div class="icv">${e.sales_person}</div></div>`:""}
  </div>
  ${e.case_address?`<div class="addr"><span class="addr-lbl">施工地址</span>${e.case_address}</div>`:""}

  <div class="sec"><div class="stitle"><span class="stitle-txt">產品資訊</span></div>
  <table>
    <tr><td class="tdl">產品編號</td><td class="tdv" style="font-family:monospace;font-size:12px;font-weight:700">${e.product_code||"—"}</td></tr>
    <tr><td class="tdl">門型</td><td class="tdv">${y}　/　${r}</td></tr>
    <tr><td class="tdl">尺寸規格</td><td class="tdv">${_}</td></tr>
    <tr><td class="tdl">數量</td><td class="tdv">${j} 樘</td></tr>
  </table></div>

  <div class="sec"><div class="stitle"><span class="stitle-txt">門扇費用</span></div>
  <table class="bd-table">
    ${l.map(([s,T])=>`<tr><td class="bdl">${s}</td><td class="bdv">${m(T)}</td></tr>`).join("")}
  </table></div>

  ${a}
  ${x}

  <div class="sec">
    <div class="tax-box">
      <div class="tax-row subtotal"><div class="tax-lbl">小計（未稅）</div><div class="tax-val">${m(o)}</div></div>
      <div class="tax-row tax"><div class="tax-lbl">營業稅 5%</div><div class="tax-val">${m(b)}</div></div>
      <div class="tax-row"><div class="tax-lbl">含稅總計</div><div class="tax-val">${m($)}</div></div>
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
    <div class="sign-box"><span class="sign-lbl">公司簽章</span><span class="sign-date">${d.nameZh}</span></div>
  </div>

  <div class="foot">
    <div><span class="foot-brand">${d.brandZh} ${d.nameEn}</span>　${d.tagline}</div>
    <div>列印日期：${h}</div>
  </div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},300);}<\/script>
</body></html>`,k=window.open("","_blank","width=820,height=1160");if(!k){alert("請允許彈出視窗以列印 PDF");return}k.document.write(z),k.document.close()}function U(){const[e,i]=f.useState([]),[n,g]=f.useState(0),[c,h]=f.useState(0),[p,y]=f.useState(""),[r,u]=f.useState("all"),[w,_]=f.useState(!0),j=E(),l=q();async function o(){_(!0);let a="cases?select=*&order=created_at.desc";p&&(a+=`&or=(case_no.ilike.*${encodeURIComponent(p)}*,customer_name.ilike.*${encodeURIComponent(p)}*,order_no.ilike.*${encodeURIComponent(p)}*)`),r!=="all"&&(a+=`&status=eq.${r}`);try{g(await A(a.replace("select=*","select=id"))),i(await F(a+`&offset=${c*v}&limit=${v}`)||[])}catch(x){j(x.message,"error")}_(!1)}f.useEffect(()=>{o()},[p,r,c]);const b=c*v+1,$=Math.min(b+v-1,n);return t.jsxs("div",{children:[t.jsxs("div",{className:"page-header",children:[t.jsxs("div",{className:"page-title-wrap",children:[t.jsx("div",{className:"page-title",children:"報價單總表"}),t.jsx("div",{className:"page-subtitle",children:"所有正式報價單 — 追蹤報價 → 成案 → 付款 → 發包 → 完工"})]}),t.jsx("button",{className:"btn btn-primary",onClick:()=>l("/formalquote/new"),children:"+ 新增報價單"})]}),t.jsx("div",{className:"stats",children:t.jsx(L,{label:"總數",value:n})}),t.jsx("div",{style:{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"},children:[["all","全部"],["official_quoted","已報價"],["order_confirmed","已下單"],["deposit_paid","已付訂","var(--success)"],["production","製作中","#3b82f6"],["shipped","已出貨","#f59e0b"],["arrived","已到倉"],["installed","已安裝","var(--success)"],["completed","已結案","var(--success)"],["cancelled","已取消","var(--danger)"]].map(([a,x,z])=>t.jsx("button",{onClick:()=>{u(a),h(0)},style:{padding:"5px 11px",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"var(--font-body)",border:`1px solid ${r===a?"var(--gold)":"var(--border)"}`,background:r===a?"var(--gold-dim)":"var(--surface-2)",color:r===a?z||"var(--gold)":"var(--text-muted)",fontWeight:r===a?700:500},children:x},a))}),t.jsxs("div",{style:{display:"flex",gap:8,marginBottom:14},children:[t.jsx("input",{className:"search-box",placeholder:"搜尋單號、客戶...",value:p,onChange:a=>{y(a.target.value),h(0)},style:{width:250}}),t.jsx("button",{className:"btn btn-ghost",onClick:o,children:"↻"})]}),t.jsx("div",{className:"table-wrap",children:t.jsxs("table",{children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx("th",{children:"訂單編號"}),t.jsx("th",{children:"客戶"}),t.jsx("th",{children:"型態"}),t.jsx("th",{children:"業務"}),t.jsx("th",{children:"報價金額"}),t.jsx("th",{children:"總價"}),t.jsx("th",{children:"狀態"}),t.jsx("th",{children:"建立"}),t.jsx("th",{style:{width:50},children:"PDF"})]})}),t.jsx("tbody",{children:w?t.jsx("tr",{children:t.jsx("td",{colSpan:"9",children:t.jsxs("div",{className:"loading",children:[t.jsx("div",{className:"spinner"}),t.jsx("br",{}),"載入中..."]})})}):e.length===0?t.jsx("tr",{children:t.jsx("td",{colSpan:"9",children:t.jsxs("div",{className:"empty",children:[t.jsx("div",{className:"icon",children:"📋"}),"無資料"]})})}):e.map(a=>{const x=N[a.status]||N.new;return t.jsxs("tr",{children:[t.jsx("td",{children:t.jsx("strong",{style:{fontFamily:"monospace",fontSize:11},children:a.order_no||a.case_no||"—"})}),t.jsx("td",{children:a.customer_name||"—"}),t.jsx("td",{style:{fontSize:11},children:D[a.customer_type]||a.customer_type||"—"}),t.jsx("td",{style:{fontSize:12},children:a.sales_person||"—"}),t.jsx("td",{className:"price",children:S(a.official_price||a.quoted_price)}),t.jsx("td",{className:"price",children:S(a.total_with_tax)}),t.jsx("td",{children:t.jsx("span",{className:"badge",style:{background:x.bg,color:x.color},children:P[a.status]||a.status})}),t.jsx("td",{style:{fontSize:12,color:"var(--text-muted)"},children:R(a.created_at)}),t.jsx("td",{children:t.jsx("button",{onClick:()=>O(a),title:"列印報價單 PDF",style:{background:"transparent",border:"1px solid var(--gold)",borderRadius:4,padding:"4px 9px",cursor:"pointer",color:"var(--gold)",fontSize:11,fontWeight:600},children:"PDF"})})]},a.id)})})]})}),t.jsxs("div",{className:"pagination",children:[t.jsx("span",{children:n?`${b}-${$} / ${n}`:""}),t.jsxs("div",{className:"page-btns",children:[t.jsx("button",{className:"page-btn",disabled:c===0,onClick:()=>h(a=>a-1),children:"‹"}),t.jsx("button",{className:"page-btn",disabled:(c+1)*v>=n,onClick:()=>h(a=>a+1),children:"›"})]})]})]})}export{U as default};
