const express = require('express');
const router = express.Router();
const {
  acceptRescue,
  updateRescueStatus,
  assignToVet,
  getMyAssignments,
} = require('../controllers/rescueController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/my-assignments', protect, authorize('rescue_team', 'admin'), getMyAssignments);
router.put('/:id/accept', protect, authorize('rescue_team', 'admin'), acceptRescue);
router.put('/:id/status', protect, authorize('rescue_team', 'admin'), upload.single('photo'), updateRescueStatus);
router.put('/:id/assign-vet', protect, authorize('rescue_team', 'admin'), assignToVet);

module.exports = router;
