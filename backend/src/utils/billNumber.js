const Bill = require('../models/Bill');

const PREFIXES = { dc:'DC', cb:'CB', cr:'CR', gst:'GST', jw:'JW' };

function getFY() {
  const d = new Date(), y = d.getFullYear(), m = d.getMonth();
  const s = m >= 3 ? y : y - 1;
  return `${s}-${(s + 1).toString().slice(-2)}`;
}

module.exports = async function generateBillNo(type) {
  const prefix = PREFIXES[type] || 'DC';
  const fy = getFY();
  const regex = new RegExp(`^NN/${prefix}/${fy}/`);
  const count = await Bill.countDocuments({ billNo: regex });
  return `NN/${prefix}/${fy}/${(count + 1).toString().padStart(4, '0')}`;
};
