const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { reserveNumber } = require('../controllers/billReserveController');

const router = express.Router();

router.post('/reserve-number', protect, [
  body('uuid').notEmpty().withMessage('UUID is required'),
  body('type').notEmpty().withMessage('Type is required'),
  validate
], reserveNumber);

module.exports = router;
