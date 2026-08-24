const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  claimTask,
  completeTask,
  getMyStats,
} = require('../controllers/volunteerController');
const { protect, authorize } = require('../middleware/auth');

router.get('/tasks', protect, getTasks);
router.post('/tasks', protect, authorize('shelter', 'rescue_team', 'admin'), createTask);
router.put('/tasks/:id/claim', protect, authorize('volunteer', 'admin'), claimTask);
router.put('/tasks/:id/complete', protect, authorize('volunteer', 'admin'), completeTask);
router.get('/my-stats', protect, authorize('volunteer', 'admin'), getMyStats);

module.exports = router;
