const router = require('express').Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { requireAdmin } = require('../middleware/requireAdmin');
const {
  getBills, getBill, createBill, updateBill, deleteBill,
  duplicateBill, getStats, getNextNumber
} = require('../controllers/billController');

router.use(protect);
router.get('/stats/summary', getStats);
router.get('/next-number/:type', getNextNumber);

router.route('/')
  .get(getBills)
  .post([
    body('customerId').notEmpty().withMessage('Customer ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    validate
  ], createBill);

router.route('/:id')
  .get(getBill)
  .put([
    body('items').optional().isArray(),
    validate
  ], updateBill)
  .delete(requireAdmin, deleteBill);

router.post('/:id/duplicate', duplicateBill);

module.exports = router;
