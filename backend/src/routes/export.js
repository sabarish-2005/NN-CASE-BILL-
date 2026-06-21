
const router = require('express').Router();
const path = require('path');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { exportExcel, uploadPdf } = require('../controllers/exportController');

// protect all export routes
router.use(protect);

// Excel export
router.get('/excel', exportExcel);

// File upload (PDF)
const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname) || '.pdf'
		cb(null, `${Date.now()}${ext}`)
	}
})
const upload = multer({ storage })
router.post('/upload', upload.single('file'), uploadPdf)

module.exports = router;
