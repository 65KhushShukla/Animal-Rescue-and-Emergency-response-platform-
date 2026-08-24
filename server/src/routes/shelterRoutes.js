const express = require('express');
const router = express.Router();
const {
  admitAnimal,
  getMyShelterAnimals,
  getIncomingReferrals,
  addCareLog,
  updateAdoptionStatus,
  getPublicAdoptions,
  submitAdoptionInquiry,
  getShelterInquiries,
  updateInquiryStatus,
} = require('../controllers/shelterController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public adoption portal
router.get('/adoptions', getPublicAdoptions);
router.post('/adoptions/:id/inquire', protect, submitAdoptionInquiry);

// Shelter management
router.post('/admit', protect, authorize('shelter', 'admin'), upload.array('photos', 5), admitAnimal);
router.get('/my-animals', protect, authorize('shelter', 'admin'), getMyShelterAnimals);
router.get('/incoming-referrals', protect, authorize('shelter', 'admin'), getIncomingReferrals);
router.post('/:id/care-log', protect, authorize('shelter', 'volunteer', 'admin'), addCareLog);
router.put('/:id/adoption-status', protect, authorize('shelter', 'admin'), updateAdoptionStatus);


// Inquiries
router.get('/inquiries', protect, authorize('shelter', 'admin'), getShelterInquiries);
router.put('/inquiries/:id', protect, authorize('shelter', 'admin'), updateInquiryStatus);

module.exports = router;
