const Labor = require('../models/Labor');

// GET all labors for user
exports.getLabors = async (req, res) => {
  const labors = await Labor.find({ createdBy: req.user.id }).sort('name');
  res.json({ labors });
};

// GET single labor
exports.getLabor = async (req, res) => {
  const labor = await Labor.findById(req.params.id);
  if (!labor || labor.createdBy.toString() !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Labor not found' });
  }
  res.json({ labor });
};

// CREATE labor
exports.createLabor = async (req, res) => {
  const { name, ratePerPiece } = req.body;
  const labor = new Labor({
    name,
    ratePerPiece,
    createdBy: req.user.id,
  });
  await labor.save();
  res.status(201).json({ labor });
};

// UPDATE labor
exports.updateLabor = async (req, res) => {
  const { name, ratePerPiece } = req.body;
  const labor = await Labor.findByIdAndUpdate(
    req.params.id,
    { name, ratePerPiece },
    { new: true }
  );
  if (!labor || labor.createdBy.toString() !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Labor not found' });
  }
  res.json({ labor });
};

// DELETE labor
exports.deleteLabor = async (req, res) => {
  const labor = await Labor.findByIdAndDelete(req.params.id);
  if (!labor || labor.createdBy.toString() !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Labor not found' });
  }
  res.json({ success: true, message: 'Labor deleted' });
};

// ADD work record (daily entry)
exports.addWorkRecord = async (req, res) => {
  const { piecesCompleted, notes, date } = req.body;
  const labor = await Labor.findById(req.params.id);
  if (!labor || labor.createdBy.toString() !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Labor not found' });
  }

  const recordDate = date ? new Date(date) : new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[recordDate.getDay()];

  const earningForDay = parseFloat(piecesCompleted || 0) * parseFloat(labor.ratePerPiece || 0);

  labor.workRecords.push({
    date: recordDate,
    day: dayName,
    piecesCompleted,
    earningForDay,
    notes,
  });

  await labor.save();
  res.json({ labor });
};

// UPDATE work record
exports.updateWorkRecord = async (req, res) => {
  const { recordId, piecesCompleted, notes } = req.body;
  const labor = await Labor.findById(req.params.id);
  if (!labor || labor.createdBy.toString() !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Labor not found' });
  }

  const record = labor.workRecords.id(recordId);
  if (!record) {
    return res.status(404).json({ success: false, message: 'Work record not found' });
  }

  record.piecesCompleted = piecesCompleted;
  record.earningForDay = parseFloat(piecesCompleted || 0) * parseFloat(labor.ratePerPiece || 0);
  if (notes !== undefined) record.notes = notes;

  await labor.save();
  res.json({ labor });
};

// DELETE work record
exports.deleteWorkRecord = async (req, res) => {
  const { recordId } = req.body;
  const labor = await Labor.findById(req.params.id);
  if (!labor || labor.createdBy.toString() !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Labor not found' });
  }

  labor.workRecords.id(recordId).remove();
  await labor.save();
  res.json({ labor });
};

// GET labor summary (for payroll/reports)
exports.getSummary = async (req, res) => {
  const { from, to } = req.query;
  const labors = await Labor.find({ createdBy: req.user.id });

  const summary = labors.map((labor) => {
    let records = labor.workRecords || [];
    if (from || to) {
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to + 'T23:59:59') : null;
      records = records.filter((r) => {
        if (fromDate && r.date < fromDate) return false;
        if (toDate && r.date > toDate) return false;
        return true;
      });
    }

    const totalPcs = records.reduce((sum, r) => sum + (r.piecesCompleted || 0), 0);
    const totalEarn = records.reduce((sum, r) => sum + (r.earningForDay || 0), 0);

    return {
      name: labor.name,
      ratePerPiece: labor.ratePerPiece,
      totalPieces: totalPcs,
      totalEarnings: totalEarn,
      recordCount: records.length,
    };
  });

  res.json({ summary });
};
