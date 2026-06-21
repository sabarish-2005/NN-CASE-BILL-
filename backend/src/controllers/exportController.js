const Bill    = require('../models/Bill');
const ExcelJS = require('exceljs');

const CO = {
  name: 'NACHIMUTHU NATRAYAN',
  sub:  'SABARISH JOB WORKS',
  addr: '2/206, Bus Stand Near, Selakkarichal, Sulur - 641658',
  phone:'9043695759',
};
const fmtD = d => d ? new Date(d).toLocaleDateString('en-IN') : '';
const fmtN = n => parseFloat(n||0).toFixed(2);

// GET /api/export/excel
exports.exportExcel = async (req, res) => {
  const { from, to, type } = req.query;
  const query = { createdBy: req.user.id };
  if (type && type !== 'all') query.type = type;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to)   query.date.$lte = new Date(to + 'T23:59:59');
  }
  const bills = await Bill.find(query).sort('-date');

  const wb = new ExcelJS.Workbook();
  wb.creator = CO.name;
  wb.created = new Date();

  // ── Summary Sheet ──
  const ws = wb.addWorksheet('Bills Summary', { views: [{ state: 'frozen', ySplit: 5 }] });

  // Header
  ws.mergeCells('A1:I1');
  ws.getCell('A1').value = CO.name;
  ws.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF0A2E1A' } };
  ws.getCell('A1').alignment = { horizontal: 'center' };
  ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF8E8' } };

  ws.mergeCells('A2:I2');
  ws.getCell('A2').value = `${CO.sub} | ${CO.addr} | Ph: ${CO.phone}`;
  ws.getCell('A2').font = { size: 10, color: { argb: 'FF155230' } };
  ws.getCell('A2').alignment = { horizontal: 'center' };

  ws.addRow([]);
  const headerRow = ws.addRow(['S.No','Bill No','Type','Date','Customer','Phone','Sub Total','GST','Grand Total','Status']);
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A2E1A' } };
    cell.font = { bold: true, color: { argb: 'FFC9A227' }, size: 11 };
    cell.alignment = { horizontal: 'center' };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FFC9A227' } } };
  });

  const TYPES = { dc:'Delivery Challan', cb:'Cash Bill', cr:'Credit Bill', gst:'GST Invoice', jw:'Job Work' };
  let totalRev = 0, totalGST = 0;
  bills.forEach((b, i) => {
    const gst = (b.cgstTotal||0) + (b.sgstTotal||0);
    totalRev += b.total || 0;
    totalGST += gst;
    const row = ws.addRow([i+1, b.billNo, TYPES[b.type]||b.type, fmtD(b.date), b.custName||'Walk-in', b.custPhone||'', +fmtN(b.subtotal), +fmtN(gst), +fmtN(b.total), b.status||'final']);
    if (i % 2 === 0) row.eachCell(c => { c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFEFF6FF' } }; });
    row.getCell(7).numFmt = '#,##0.00';
    row.getCell(8).numFmt = '#,##0.00';
    row.getCell(9).numFmt = '#,##0.00';
    row.getCell(9).font = { bold: true };
  });

  // Totals row
  const totRow = ws.addRow(['','','','','','TOTAL','','',+fmtN(totalRev),'']);
  totRow.getCell(6).font = { bold: true, size: 12 };
  totRow.getCell(9).font = { bold: true, size: 13, color: { argb: 'FF0A2E1A' } };
  totRow.getCell(9).numFmt = '#,##0.00';
  totRow.eachCell(c => { c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFFDF8E8' } }; });

  ws.columns = [
    {width:6},{width:22},{width:18},{width:14},{width:28},{width:14},{width:14},{width:12},{width:16},{width:10}
  ];

  // ── Items Sheet ──
  const ws2 = wb.addWorksheet('Bill Items');
  ws2.addRow(['Bill No','Type','Date','Customer','S.No','Description','HSN','Qty','Unit','Rate','Amount']);
  ws2.getRow(1).eachCell(c => {
    c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF155230' } };
    c.font = { bold: true, color:{ argb:'FFC9A227' } };
  });
  bills.forEach(b => {
    (b.items||[]).forEach((it,i) => {
      ws2.addRow([b.billNo, TYPES[b.type]||b.type, fmtD(b.date), b.custName||'', i+1, it.desc, it.hsn, it.qty, it.unit, +fmtN(it.rate), +fmtN(it.amt)]);
    });
  });
  ws2.columns = [{width:22},{width:16},{width:12},{width:26},{width:6},{width:34},{width:10},{width:8},{width:8},{width:12},{width:14}];

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=NN_Bills_${Date.now()}.xlsx`);
  await wb.xlsx.write(res);
  res.end();
};

// POST /api/export/upload
exports.uploadPdf = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' })
  // Build public URL to uploaded file (server serves /uploads statically)
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
  return res.json({ success: true, url })
}
