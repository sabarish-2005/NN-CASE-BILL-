const router = require('express').Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { requireAdmin } = require('../middleware/requireAdmin');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');

router.use(protect);

router.route('/')
  .get(getProducts)
  .post([
    body('name').notEmpty().withMessage('Name is required'),
    validate
  ], createProduct);

router.route('/:id')
  .get(getProduct)
  .put([
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    validate
  ], updateProduct)
  .delete(requireAdmin, deleteProduct);

module.exports = router;
