const express = require('express');
const router = express.Router();
const {
  createEmergency,
  getEmergencies,
  getEmergencyById,
  getMyReports,
  addTimelineUpdate,
} = require('../controllers/emergencyController');
const { protect, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', optionalAuth, upload.array('media', 5), createEmergency);
router.get('/', getEmergencies);
router.get('/my-reports', protect, getMyReports);
router.get('/:id', getEmergencyById);
router.post('/:id/timeline', protect, upload.single('photo'), addTimelineUpdate);

module.exports = router;
