const router = require('express').Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { requireAdmin } = require('../middleware/requireAdmin');
const { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');

router.use(protect);
router.route('/')
  .get(getCustomers)
  .post([
    body('name').notEmpty().withMessage('Name is required'),
    validate
  ], createCustomer);

router.route('/:id')
  .get(getCustomer)
  .put([
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    validate
  ], updateCustomer)
  .delete(requireAdmin, deleteCustomer);

module.exports = router;
