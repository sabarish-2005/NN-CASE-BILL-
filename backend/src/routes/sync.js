const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { processSync } = require('../controllers/syncController');

const router = express.Router();

router.post('/', protect, [
  body('operations').optional().isArray(),
  body('lastSyncTimestamp').optional().isNumeric(),
  body('deviceId').optional().isString(),
  validate
], processSync);

module.exports = router;
