import { Bill, UserSettings, BILL_TYPE_CONFIG, fmtCurrency, fmtDate } from '../utils';

export function InvoiceTemplate(
  bill: Bill, 
  settings: Partial<UserSettings>, 
  logoBase64?: string, 
  sigBase64?: string
): string {
  
  const typeConfig = BILL_TYPE_CONFIG[bill.type];
  const isGst = bill.type === 'gst';
  const title = typeConfig ? typeConfig.name.toUpperCase() : 'INVOICE';

  // Bank Details from settings
  const bankName = settings.bankName || 'HDFC Bank';
  const acctNo = settings.bankAcct || '50200012345678';
  const ifsc = settings.bankIfsc || 'HDFC0001234';
  const branch = settings.bankBranch || 'Main Branch';

  const logoHtml = logoBase64 
    ? `<img src="data:image/png;base64,${logoBase64}" class="logo" />` 
    : `<div class="logo-placeholder">LOGO</div>`;

  const sigHtml = sigBase64 
    ? `<img src="data:image/png;base64,${sigBase64}" class="signature" />` 
    : `<div class="sig-placeholder"></div>`;

  // Determine columns based on type
  const hasHsn = isGst;
  const hasGst = isGst;

  let tableHeader = `
    <tr>
      <th>#</th>
      <th>Description</th>
      ${hasHsn ? '<th>HSN</th>' : ''}
      <th>Qty</th>
      <th>Unit</th>
      <th>Rate</th>
      ${hasGst ? '<th>GST %</th>' : ''}
      <th>Amount</th>
    </tr>
  `;

  let tableRows = bill.items.map((it, i) => `
    <tr>
      <td class="center">${i + 1}</td>
      <td>${it.description}</td>
      ${hasHsn ? `<td class="center">${it.hsn || '-'}</td>` : ''}
      <td class="center">${it.qty}</td>
      <td class="center">${it.unit}</td>
      <td class="right">${fmtCurrency(it.rate)}</td>
      ${hasGst ? `<td class="center">${it.gstRate}%</td>` : ''}
      <td class="right">${fmtCurrency(it.amount)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${bill.billNo}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #000;
      font-size: 14px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 3px solid #1e3a5f;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .company-details h1 {
      margin: 0 0 5px 0;
      color: #1e3a5f;
      font-size: 24px;
    }
    .company-details p {
      margin: 2px 0;
      color: #4a4a4a;
    }
    .logo {
      max-width: 150px;
      max-height: 80px;
    }
    .logo-placeholder {
      width: 150px;
      height: 80px;
      background: #f1f5f9;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      border: 1px dashed #cbd5e1;
    }
    .title-row {
      text-align: center;
      margin-bottom: 20px;
    }
    .title-row h2 {
      margin: 0;
      color: #1e3a5f;
      text-decoration: underline;
    }
    .meta-details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .bill-to, .bill-info {
      width: 48%;
    }
    .bill-to h3, .bill-info h3 {
      margin: 0 0 10px 0;
      color: #1e3a5f;
      font-size: 16px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
    }
    .info-row {
      display: flex;
      margin-bottom: 5px;
    }
    .info-label {
      width: 120px;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 10px;
    }
    th {
      background-color: #1e3a5f;
      color: white;
      text-align: left;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .totals {
      width: 40%;
      float: right;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #eee;
    }
    .grand-total {
      background-color: #eff6ff;
      font-weight: bold;
      font-size: 18px;
      padding: 10px;
      border-bottom: 2px solid #1e3a5f;
    }
    .clear { clear: both; }
    .words {
      font-style: italic;
      margin-top: 10px;
      padding: 10px;
      background: #f8fafc;
      border: 1px solid #ccc;
    }
    .footer {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
    }
    .bank-details, .terms {
      width: 45%;
      font-size: 12px;
    }
    .signatures {
      width: 45%;
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
    }
    .sig-box {
      text-align: center;
      width: 45%;
    }
    .signature {
      max-width: 150px;
      max-height: 50px;
      margin-bottom: 5px;
    }
    .sig-placeholder {
      height: 50px;
      margin-bottom: 5px;
    }
    .sig-line {
      border-top: 1px solid #000;
      padding-top: 5px;
      font-weight: bold;
    }
    .highlight-red {
      color: #dc2626;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="company-details">
      <h1>${settings.companyName || 'NN Billing'}</h1>
      <p>${settings.companyAddr || '123 Main St, City, State'}</p>
      <p>Phone: ${settings.companyPhone || '+91 9999999999'}</p>
      ${settings.gstin ? `<p><strong>GSTIN:</strong> ${settings.gstin}</p>` : ''}
    </div>
    <div>
      ${logoHtml}
    </div>
  </div>

  <div class="title-row">
    <h2>${title}</h2>
  </div>

  <div class="meta-details">
    <div class="bill-to">
      <h3>Billed To</h3>
      <p><strong>${bill.custName || 'Walk-in Customer'}</strong></p>
      ${bill.custAddr ? `<p>${bill.custAddr}</p>` : ''}
      ${bill.custPhone ? `<p>Phone: ${bill.custPhone}</p>` : ''}
      ${bill.custGst ? `<p>GSTIN: ${bill.custGst}</p>` : ''}
    </div>
    <div class="bill-info">
      <h3>Invoice Details</h3>
      <div class="info-row"><div class="info-label">Bill No:</div><div>${bill.billNo}</div></div>
      <div class="info-row"><div class="info-label">Date:</div><div>${fmtDate(bill.date)}</div></div>
      ${bill.transport ? `<div class="info-row"><div class="info-label">Transport:</div><div>${bill.transport}</div></div>` : ''}
      ${bill.vehicleNo ? `<div class="info-row"><div class="info-label">Vehicle No:</div><div>${bill.vehicleNo}</div></div>` : ''}
    </div>
  </div>

  <table>
    ${tableHeader}
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>${fmtCurrency(bill.subtotal)}</span>
    </div>
    ${isGst ? `
    <div class="total-row">
      <span>CGST</span>
      <span>${fmtCurrency(bill.cgstTotal)}</span>
    </div>
    <div class="total-row">
      <span>SGST</span>
      <span>${fmtCurrency(bill.sgstTotal)}</span>
    </div>
    ` : ''}
    <div class="total-row">
      <span>Round Off</span>
      <span>${fmtCurrency(bill.roundOff)}</span>
    </div>
    <div class="total-row grand-total ${bill.type === 'credit' ? 'highlight-red' : ''}">
      <span>${bill.type === 'credit' ? 'Amount Due' : 'Grand Total'}</span>
      <span>${fmtCurrency(bill.total)}</span>
    </div>
  </div>
  
  <div class="clear"></div>

  <div class="words">
    <strong>Amount in Words:</strong> ${bill.words}
  </div>

  <div class="footer">
    <div class="bank-details">
      ${isGst ? `
      <strong>Bank Details:</strong><br>
      Bank Name: ${bankName}<br>
      Account No: ${acctNo}<br>
      IFSC Code: ${ifsc}<br>
      Branch: ${branch}<br>
      ` : ''}
      <br>
      <strong>Notes / Terms:</strong><br>
      ${bill.notes || 'Thanks for your business!'}
    </div>

    <div class="signatures">
      <div class="sig-box">
        <div class="sig-placeholder"></div>
        <div class="sig-line">Receiver's Signature</div>
      </div>
      <div class="sig-box">
        ${sigHtml}
        <div class="sig-line">Authorized Signatory</div>
      </div>
    </div>
  </div>

  ${bill.type === 'cash' ? `
  <div style="text-align: center; margin-top: 30px; border: 2px dashed #16a34a; padding: 10px; color: #16a34a; font-weight: bold; width: 200px; margin-left: auto; margin-right: auto; transform: rotate(-5deg);">
    CASH RECEIVED
  </div>
  ` : ''}

</body>
</html>
  `;
}
