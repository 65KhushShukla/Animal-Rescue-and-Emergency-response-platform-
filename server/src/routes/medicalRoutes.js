const express = require('express');
const router = express.Router();
const {
  createOrUpdateRecord,
  getPendingPatients,
  getRecordByReportId,
  getMyRecords,
} = require('../controllers/medicalController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

router.post('/', protect, authorize('veterinarian', 'admin'), createOrUpdateRecord);
router.get('/patients', protect, authorize('veterinarian', 'admin'), getPendingPatients);
router.get('/my-records', protect, authorize('veterinarian', 'admin'), getMyRecords);
router.get('/record/:reportId', optionalAuth, getRecordByReportId);

module.exports = router;

