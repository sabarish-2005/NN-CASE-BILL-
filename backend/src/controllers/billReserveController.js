const Bill = require('../models/Bill');
const generateBillNo = require('../utils/billNumber');

exports.reserveNumber = async (req, res) => {
  const { uuid, type } = req.body;
  if (!uuid || !type) {
    return res.status(400).json({ success: false, message: 'Missing uuid or type' });
  }

  // Check if bill exists
  let bill = await Bill.findOne({ uuid });
  if (bill) {
    if (bill.billNo && !bill.billNo.startsWith('DRAFT')) {
      // Already reserved
      return res.json({ success: true, uuid, billNo: bill.billNo });
    }
  }

  const billNo = await generateBillNo(type);
  
  if (bill) {
    bill.billNo = billNo;
    await bill.save();
  }

  res.json({ success: true, uuid, billNo });
};
