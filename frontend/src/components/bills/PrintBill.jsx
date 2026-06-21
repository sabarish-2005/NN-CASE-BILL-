import { CO, BILL_TYPES, fmtCurrency, fmtDate } from '../../utils'

export function renderBillHTML(b, settings={}) {
  const bt = BILL_TYPES[b.type] || BILL_TYPES.dc
  const isGST = b.type === 'gst'
  const emptyRows = Math.max(0, 10 - (b.items||[]).length)
  const logo = settings?.logo
    ? `<img src="${settings.logo}" style="max-width:75px;max-height:65px;object-fit:contain;border-radius:3px"/>`
    : `<div style="font-size:32px;color:#c9a227;line-height:1;text-align:center">⚜</div><div style="font-size:7pt;color:#c9a227;font-weight:900;letter-spacing:1px;text-align:center;margin-top:3px">NACHIMUTHU<br>NATRAYAN</div>`
  const sig = settings?.signature
    ? `<img src="${settings.signature}" style="height:42px;object-fit:contain;margin:4px 0"/>`
    : `<div style="height:42px"></div>`

  const DEFAULT_BANK = {
    bankName: 'State Bank of India (SBI)',
    bankBranch: 'Kalangal Branch',
    accountHolder: 'Mr. SABARISH V',
    accountNo: '45172475098',
    ifsc: 'SBIN0071059'
  }
  const bnk = {
    bankName: settings?.bankName || DEFAULT_BANK.bankName,
    bankBranch: settings?.bankBranch || DEFAULT_BANK.bankBranch,
    accountHolder: settings?.accountHolder || DEFAULT_BANK.accountHolder,
    accountNo: settings?.accountNo || DEFAULT_BANK.accountNo,
    ifsc: settings?.ifsc || DEFAULT_BANK.ifsc,
  }

  const bankHtml = `<div style="border:1px solid #c5d8cb;padding:8px 10px;margin:6px 0;background:#fff;min-width:220px;text-align:left;font-size:9pt;color:#333;border-radius:4px">
         <div style="font-weight:800;color:#0a2e1a;margin-bottom:6px">Bank Details</div>
         <table style="width:100%;border-collapse:collapse;font-size:9pt;color:#333">
           <tbody>
             <tr><td style="padding:2px 6px;font-weight:700;width:90px">Bank</td><td style="padding:2px 6px">${bnk.bankName}</td></tr>
             <tr><td style="padding:2px 6px;font-weight:700">Branch</td><td style="padding:2px 6px">${bnk.bankBranch}</td></tr>
             <tr><td style="padding:2px 6px;font-weight:700">A/C No</td><td style="padding:2px 6px;font-family:monospace">${bnk.accountNo}</td></tr>
             <tr><td style="padding:2px 6px;font-weight:700">IFSC</td><td style="padding:2px 6px">${bnk.ifsc}</td></tr>
             <tr><td style="padding:2px 6px;font-weight:700">A/C Holder</td><td style="padding:2px 6px">${bnk.accountHolder}</td></tr>
           </tbody>
         </table>
       </div>`

  const itemRows = (b.items||[]).map((it,i) => `
  <tr>
    <td style="border:1px solid #c5d8cb;padding:4px 6px;text-align:center;font-size:9.5pt">${i+1}</td>
    <td style="border:1px solid #c5d8cb;padding:4px 6px;font-size:9.5pt;font-weight:600">${it.desc||''}</td>
    <td style="border:1px solid #c5d8cb;padding:4px 6px;text-align:center;font-family:monospace;font-size:9pt">${it.hsn||''}</td>
    <td style="border:1px solid #c5d8cb;padding:4px 6px;text-align:center;font-size:9.5pt">${it.qty||0}</td>
    <td style="border:1px solid #c5d8cb;padding:4px 6px;text-align:center;font-size:9.5pt">${it.unit||'Nos'}</td>
    <td style="border:1px solid #c5d8cb;padding:4px 6px;text-align:right;font-family:monospace;font-size:9.5pt">${fmtCurrency(it.rate)}</td>
    ${isGST?`<td style="border:1px solid #c5d8cb;padding:4px 6px;text-align:center;font-size:9pt">${it.gstRate||0}%</td>`:''}
    <td style="border:1px solid #c5d8cb;padding:4px 6px;text-align:right;font-family:monospace;font-weight:900;font-size:10pt;background:rgba(201,162,39,.06);white-space:nowrap">₹ ${fmtCurrency(it.amt||it.qty*it.rate)}</td>
  </tr>`).join('')

  const emptyTrs = Array(emptyRows).fill(`
  <tr style="height:20px">
    ${Array(isGST?8:7).fill('<td style="border:1px solid #c5d8cb">&nbsp;</td>').join('')}
  </tr>`).join('')

  return `
<div style="font-family:Arial,sans-serif;font-size:10.5pt;color:#000;background:#fff;padding:10px;width:100%">
<div style="border:2.5px solid #0a2e1a;border-radius:4px;overflow:hidden">

  <!-- HEADER -->
  <div style="display:flex;align-items:stretch;border-bottom:2px solid #0a2e1a">
    ${settings?.logo
      ? `<div style="width:90px;flex-shrink:0;background-color:#0a2e1a;background-image:url('${settings.logo}');background-position:center;background-repeat:no-repeat;background-size:contain;padding:8px;border-right:2px solid #c9a227"></div>`
      : `<div style="width:90px;flex-shrink:0;background:linear-gradient(160deg,#0a2e1a,#155230);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 8px;border-right:2px solid #c9a227">${logo}</div>`
    }
    <div style="flex:1;padding:8px 12px;text-align:center;border-right:2px solid #0a2e1a">
      <div style="height:3px;background:linear-gradient(to right,#c9a227,#e0b84a,#c9a227);margin-bottom:6px;border-radius:2px"></div>
      <div style="font-size:22pt;font-weight:900;color:#0a2e1a;letter-spacing:3px;font-family:Arial Black,sans-serif;line-height:1.1">${CO.name}</div>
      <div style="font-size:9.5pt;color:#155230;font-weight:700;margin-top:3px">${CO.sub} — ${CO.tag}</div>
      <div style="font-size:8.5pt;color:#333;margin-top:3px">📍 ${CO.addr}, ${CO.city} — ${CO.pin}</div>
      <div style="font-size:8.5pt;color:#333;margin-top:2px">📞 ${CO.phone} &nbsp;|&nbsp; State Code: ${CO.stateCode}${settings?.gstin?' &nbsp;|&nbsp; GSTIN: '+settings.gstin:''}</div>
      <div style="height:3px;background:linear-gradient(to right,#c9a227,#e0b84a,#c9a227);margin-top:6px;border-radius:2px"></div>
    </div>
    <div style="width:115px;flex-shrink:0;background:linear-gradient(160deg,#0a2e1a,#155230);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 8px">
      <div style="font-size:7.5pt;color:rgba(201,162,39,.7);letter-spacing:2px;text-align:center">ORIGINAL COPY</div>
      <div style="font-size:13pt;font-weight:900;color:#c9a227;text-align:center;margin-top:5px;letter-spacing:1px;text-decoration:underline;font-family:Arial Black,sans-serif">${bt.label.toUpperCase()}</div>
    </div>
  </div>

  <!-- BILL INFO + CUSTOMER -->
  <div style="display:flex;border-bottom:1px solid #0a2e1a">
    <div style="flex:1;padding:6px 10px;border-right:1px solid #0a2e1a;font-size:9.5pt">
      <table style="border-collapse:collapse"><tbody>
        <tr><td style="font-weight:800;color:#0a2e1a;padding-right:8px;padding-bottom:3px">Bill No.</td><td style="font-weight:900;font-size:11pt;font-family:monospace;color:#0a2e1a">: ${b.billNo||''}</td></tr>
        <tr><td style="font-weight:800;color:#0a2e1a;padding-right:8px;padding-bottom:3px">Date</td><td>: <strong>${fmtDate(b.date)}</strong></td></tr>
        <tr><td style="font-weight:800;color:#0a2e1a;padding-right:8px;padding-bottom:3px">Transport</td><td>: ${b.transport||'By Hand'}</td></tr>
        ${b.vehicleNo?`<tr><td style="font-weight:800;color:#0a2e1a;padding-right:8px">Vehicle No.</td><td>: <strong>${b.vehicleNo}</strong></td></tr>`:''}
      </tbody></table>
    </div>
    <div style="flex:1;padding:6px 10px;font-size:9.5pt;background:rgba(10,46,26,.025)">
      <div style="font-size:7.5pt;color:#888;letter-spacing:1.5px;margin-bottom:3px;font-weight:700">BILL TO / DELIVER TO :</div>
      <div style="font-size:13pt;font-weight:900;color:#0a2e1a;font-family:Arial,sans-serif;line-height:1.2">${b.custName||'Walk-in Customer'}</div>
      ${b.custAddr?`<div style="font-size:9pt;color:#444;margin-top:2px;line-height:1.5">📍 ${b.custAddr}</div>`:''}
      ${b.custPhone?`<div style="font-size:9pt;color:#333;margin-top:1px">📞 ${b.custPhone}</div>`:''}
      ${b.custGST?`<div style="font-size:9pt;color:#333">GSTIN: ${b.custGST}</div>`:''}
    </div>
  </div>

  <!-- ITEMS -->
  <table style="width:100%;border-collapse:collapse;font-size:9.5pt;position:relative">
    <thead><tr style="background:#0a2e1a">
      <th style="border:1px solid #155230;padding:5px 6px;text-align:center;color:#c9a227;font-size:9pt;width:28px">S.No</th>
      <th style="border:1px solid #155230;padding:5px 6px;text-align:left;color:#c9a227;font-size:9pt">Description of Goods / Services</th>
      <th style="border:1px solid #155230;padding:5px 6px;text-align:center;color:#c9a227;font-size:9pt;width:60px">HSN</th>
      <th style="border:1px solid #155230;padding:5px 6px;text-align:center;color:#c9a227;font-size:9pt;width:46px">Qty</th>
      <th style="border:1px solid #155230;padding:5px 6px;text-align:center;color:#c9a227;font-size:9pt;width:42px">Unit</th>
      <th style="border:1px solid #155230;padding:5px 6px;text-align:right;color:#c9a227;font-size:9pt;width:72px">Rate (₹)</th>
      ${isGST?'<th style="border:1px solid #155230;padding:5px 6px;text-align:center;color:#c9a227;font-size:9pt;width:55px">GST %</th>':''}
      <th style="border:1px solid #155230;padding:5px 6px;text-align:right;color:#c9a227;font-size:9pt;width:86px">Amount (₹)</th>
    </tr></thead>
    <tbody>${itemRows}${emptyTrs}</tbody>
  </table>

  <!-- TOTALS + WORDS -->
  <div style="display:flex;border-top:1px solid #0a2e1a">
    <div style="flex:1;padding:8px 12px;border-right:1px solid #0a2e1a;background:rgba(10,46,26,.025)">
      <div style="font-size:7.5pt;color:#888;letter-spacing:1.5px;margin-bottom:5px;font-weight:700">AMOUNT IN WORDS :</div>
      <div style="font-size:10.5pt;font-weight:800;color:#0a2e1a;text-transform:uppercase;line-height:1.6;letter-spacing:.3px">${b.words||''}</div>
      ${b.notes?`<div style="margin-top:7px;padding-top:5px;border-top:1px dashed #c5d8cb;font-size:8.5pt;color:#555"><strong>Note:</strong> ${b.notes}</div>`:''}
      ${bankHtml}
    </div>
    <div style="width:210px;flex-shrink:0;padding:8px 12px;background:rgba(10,46,26,.04)">
      <table style="width:100%;font-size:9.5pt;border-collapse:collapse"><tbody>
        <tr><td style="padding:2px 0;color:#444">Sub Total</td><td style="text-align:right;font-family:monospace;font-weight:700;white-space:nowrap">₹ ${fmtCurrency(b.subtotal||0)}</td></tr>
        ${isGST&&(b.gstRate||b.cgstTotal)>0?`
        <tr><td style="padding:2px 0;color:#444">CGST @ ${(b.gstRate||0)/2}%</td><td style="text-align:right;font-family:monospace;white-space:nowrap">₹ ${fmtCurrency(b.cgstTotal||0)}</td></tr>
        <tr><td style="padding:2px 0;color:#444">SGST @ ${(b.gstRate||0)/2}%</td><td style="text-align:right;font-family:monospace;white-space:nowrap">₹ ${fmtCurrency(b.sgstTotal||0)}</td></tr>`:''}
        ${(b.roundOff&&b.roundOff!==0)?`<tr><td style="padding:2px 0;color:#888;font-size:8.5pt">Round Off</td><td style="text-align:right;font-family:monospace;font-size:8.5pt">${b.roundOff>0?'+':''}${fmtCurrency(b.roundOff)}</td></tr>`:''}
        <tr style="border-top:2.5px solid #0a2e1a">
          <td style="padding:5px 0 0;font-weight:900;font-size:13pt;color:#0a2e1a">GRAND TOTAL</td>
          <td style="text-align:right;padding:5px 0 0;font-weight:900;font-size:15pt;color:#0a2e1a;font-family:monospace;white-space:nowrap">₹ ${fmtCurrency(b.total||0)}</td>
        </tr>
      </tbody></table>
    </div>
  </div>

  <!-- THANK YOU BAR -->
  <div style="background:linear-gradient(135deg,#0a2e1a,#155230);color:#c9a227;font-weight:800;font-size:9pt;letter-spacing:.5px;text-align:center;padding:5px 10px;border-top:1px solid #0a2e1a">
    ⚜ &nbsp; EXPERT CUTTING &nbsp;|&nbsp; PERFECT FINISH &nbsp;|&nbsp; TIMELY DELIVERY &nbsp; ⚜
  </div>

  <!-- SIGNATURE ROW -->
  <div style="display:flex;border-top:1.5px solid #0a2e1a">
    <div style="flex:1;border-right:1px solid #0a2e1a;padding:7px 10px;height:74px;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;font-size:8.5pt;color:#444">
      Receiver's Signature &amp; Seal
    </div>
    <div style="flex:1;border-right:1px solid #0a2e1a;padding:7px 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-size:8.5pt;color:#555;gap:3px">
      <div style="font-size:7.5pt;color:#999">This document is valid without signature</div>
    </div>
    <div style="flex:1;padding:7px 10px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center;font-size:8.5pt">
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
        <div><strong style="font-size:10pt;color:#0a2e1a">For ${CO.name}</strong><br/><span style="color:#155230;font-size:8pt">${CO.sub}</span></div>
      </div>
      ${sig}
      <div style="color:#444">${CO.owner} — ${CO.role}</div>
    </div>
  </div>

</div>
</div>`
}

export default function BillPreviewPrint({ bill, settings }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: renderBillHTML(bill, settings) }} />
  )
}
