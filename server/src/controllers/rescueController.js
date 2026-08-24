const EmergencyReport = require('../models/EmergencyReport');
const User = require('../models/User');
const { uploadMedia } = require('../config/cloudinary');
const { notifyUser, notifyRoles } = require('../utils/notificationHelper');

/**
 * @desc    Rescue team accepts an emergency report
 * @route   PUT /api/rescues/:id/accept
 * @access  Private (Rescue Team, Admin)
 */
exports.acceptRescue = async (req, res, next) => {
  try {
    const emergency = await EmergencyReport.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Emergency report not found.' });
    }

    if (emergency.status !== 'REPORTED') {
      return res.status(400).json({
        success: false,
        message: `This rescue request has already been ${emergency.status.toLowerCase()}.`,
      });
    }

    emergency.assignedTeam = req.user._id;
    emergency.status = 'ACCEPTED';

    const timelineEntry = {
      status: 'ACCEPTED',
      updatedBy: req.user._id,
      updatedByName: `${req.user.name} (${req.user.organizationName || 'Rescue Team'})`,
      note: `Rescue mission accepted by ${req.user.name}. Team is preparing dispatch.`,
      timestamp: new Date(),
    };

    emergency.timeline.push(timelineEntry);
    await emergency.save();

    // Notify citizen reporter
    if (emergency.reporter && emergency.reporter.user) {
      await notifyUser(emergency.reporter.user, {
        title: `Rescue Team Dispatched!`,
        message: `Rescue team "${req.user.name}" has accepted your report. Help is on the way!`,
        type: 'STATUS_UPDATE',
        link: `/reports/${emergency._id}`,
        metadata: { reportId: emergency._id },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rescue request accepted successfully.',
      emergency,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update rescue workflow status (EN_ROUTE, ARRIVED, RESCUED, etc.)
 * @route   PUT /api/rescues/:id/status
 * @access  Private (Rescue Team, Admin)
 */
exports.updateRescueStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const emergency = await EmergencyReport.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Emergency report not found.' });
    }

    const validStatuses = [
      'ACCEPTED',
      'EN_ROUTE',
      'ARRIVED',
      'RESCUED',
      'TRANSFERRED_VET',
      'TRANSFERRED_SHELTER',
      'RESOLVED',
      'CANCELLED',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status code provided.' });
    }

    let photoUrl = '';
    if (req.file) {
      const uploaded = await uploadMedia(req.file, 'animal_rescue_milestones');
      if (uploaded) photoUrl = uploaded.url;
    }

    emergency.status = status;

    const timelineEntry = {
      status,
      updatedBy: req.user._id,
      updatedByName: `${req.user.name} (${req.user.organizationName || 'Rescue Team'})`,
      note: note || `Rescue status updated to ${status.replace('_', ' ')}`,
      photoUrl,
      timestamp: new Date(),
    };

    emergency.timeline.push(timelineEntry);
    await emergency.save();

    // Notify citizen reporter
    if (emergency.reporter && emergency.reporter.user) {
      await notifyUser(emergency.reporter.user, {
        title: `Rescue Milestone: ${status.replace('_', ' ')}`,
        message: `Your reported animal case status is now ${status.replace('_', ' ')}. ${note || ''}`,
        type: 'STATUS_UPDATE',
        link: `/reports/${emergency._id}`,
        metadata: { reportId: emergency._id },
      });
    }

    // If transferred to vet, notify veterinarians
    if (status === 'TRANSFERRED_VET') {
      await notifyRoles(['veterinarian'], {
        title: `🐾 Rescued Animal Awaiting Medical Care`,
        message: `Animal from emergency #${emergency._id.toString().slice(-6)} has been rescued and transferred for veterinary examination.`,
        type: 'MEDICAL_UPDATE',
        link: `/veterinary`,
        metadata: { reportId: emergency._id },
      });
    }

    res.status(200).json({
      success: true,
      message: `Status updated to ${status}.`,
      emergency,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Transfer/Assign rescued animal to a specific Vet
 * @route   PUT /api/rescues/:id/assign-vet
 * @access  Private (Rescue Team, Admin)
 */
exports.assignToVet = async (req, res, next) => {
  try {
    const { vetId, note } = req.body;
    const emergency = await EmergencyReport.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Emergency report not found.' });
    }

    const vet = await User.findOne({ _id: vetId, role: 'veterinarian' });
    if (!vet) {
      return res.status(400).json({ success: false, message: 'Veterinarian not found.' });
    }

    emergency.assignedVet = vet._id;
    emergency.status = 'TRANSFERRED_VET';

    emergency.timeline.push({
      status: 'TRANSFERRED_VET',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      note: note || `Transferred to Dr. ${vet.name} (${vet.organizationName || 'Vet Clinic'}) for clinical treatment.`,
      timestamp: new Date(),
    });

    await emergency.save();

    // Direct notification to Vet
    await notifyUser(vet._id, {
      title: `🏥 New Patient Inbound`,
      message: `Rescue team transferred a ${emergency.animalType} (${emergency.urgency}) to your clinic.`,
      type: 'MEDICAL_UPDATE',
      link: `/veterinary`,
      metadata: { reportId: emergency._id },
    });

    res.status(200).json({
      success: true,
      message: `Animal transferred to Vet ${vet.name}.`,
      emergency,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get rescue assignments for the logged-in rescue team
 * @route   GET /api/rescues/my-assignments
 * @access  Private (Rescue Team)
 */
exports.getMyAssignments = async (req, res, next) => {
  try {
    const assignments = await EmergencyReport.find({ assignedTeam: req.user._id })
      .populate('assignedVet', 'name organizationName phone')
      .populate('assignedShelter', 'name organizationName phone')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (err) {
    next(err);
  }
};
