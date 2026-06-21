const router = require('express').Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { requireAdmin } = require('../middleware/requireAdmin');
const {
  getLabors,
  getLabor,
  createLabor,
  updateLabor,
  deleteLabor,
  addWorkRecord,
  updateWorkRecord,
  deleteWorkRecord,
  getSummary,
} = require('../controllers/laborController');

router.use(protect);

router.get('/', getLabors);
router.get('/summary', getSummary);

router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  validate
], createLabor);

router.route('/:id')
  .get(getLabor)
  .put([
    body('name').optional().notEmpty(),
    validate
  ], updateLabor)
  .delete(requireAdmin, deleteLabor);

// Work records
router.post('/:id/work', [
  body('date').notEmpty().withMessage('Date is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  validate
], addWorkRecord);

router.put('/:id/work', [
  body('recordId').notEmpty().withMessage('Record ID is required'),
  validate
], updateWorkRecord);

router.delete('/:id/work', deleteWorkRecord);

module.exports = router;
