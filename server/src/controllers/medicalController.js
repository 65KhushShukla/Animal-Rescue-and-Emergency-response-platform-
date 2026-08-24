const MedicalRecord = require('../models/MedicalRecord');
const EmergencyReport = require('../models/EmergencyReport');
const ShelterRecord = require('../models/ShelterRecord');
const User = require('../models/User');
const { notifyUser, notifyRoles } = require('../utils/notificationHelper');

/**
 * @desc    Create or update medical record for a rescued animal
 * @route   POST /api/medical
 * @access  Private (Veterinarian, Admin)
 */
exports.createOrUpdateRecord = async (req, res, next) => {
  try {
    const {
      reportId,
      animalName,
      animalType,
      vitals,
      symptoms,
      diagnosis,
      treatmentPlan,
      medications,
      vaccinations,
      surgeries,
      status,
      dischargeNotes,
      referToShelter,
      referredShelterId,
    } = req.body;

    const emergency = await EmergencyReport.findById(reportId);
    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Emergency report not found.' });
    }

    let record = await MedicalRecord.findOne({ reportId });

    if (record) {
      // Update existing record
      if (animalName) record.animalName = animalName;
      if (animalType) record.animalType = animalType;
      if (vitals) record.vitals = vitals;
      if (symptoms) record.symptoms = symptoms;
      if (diagnosis) record.diagnosis = diagnosis;
      if (treatmentPlan) record.treatmentPlan = treatmentPlan;
      if (medications) record.medications = medications;
      if (vaccinations) record.vaccinations = vaccinations;
      if (surgeries) record.surgeries = surgeries;
      if (status) record.status = status;
      if (dischargeNotes) record.dischargeNotes = dischargeNotes;
      if (referToShelter !== undefined) record.referToShelter = referToShelter;
      if (referredShelterId) record.referredShelterId = referredShelterId;
      record.vetId = req.user._id;

      await record.save();
    } else {
      // Create new record
      record = await MedicalRecord.create({
        reportId,
        animalName: animalName || `${emergency.animalType} #${emergency._id.toString().slice(-4)}`,
        animalType: animalType || emergency.animalType,
        vetId: req.user._id,
        vitals: vitals || {},
        symptoms: symptoms || emergency.symptoms || [],
        diagnosis,
        treatmentPlan,
        medications: medications || [],
        vaccinations: vaccinations || [],
        surgeries: surgeries || [],
        status: status || 'UNDER_TREATMENT',
        dischargeNotes: dischargeNotes || '',
        referToShelter: Boolean(referToShelter),
        referredShelterId: referredShelterId || null,
      });
    }

    // Keep emergency assignedVet updated
    emergency.assignedVet = req.user._id;

    // Determine target emergency status & timeline update
    let targetEmergencyStatus = 'TRANSFERRED_VET';
    let timelineNote = `Clinical evaluation: ${diagnosis}. Status: ${status || 'Under Treatment'}.`;

    if (referToShelter && referredShelterId) {
      emergency.assignedShelter = referredShelterId;
      if (status === 'DISCHARGED' || status === 'STABLE') {
        targetEmergencyStatus = 'TRANSFERRED_SHELTER';
        timelineNote += ` Discharged and referred to Shelter for rehabilitation.`;
      }
    } else if (status === 'DISCHARGED') {
      targetEmergencyStatus = 'RESOLVED';
      timelineNote += ` Clinical treatment complete, discharged.`;
    }

    emergency.status = targetEmergencyStatus;
    emergency.timeline.push({
      status: targetEmergencyStatus,
      updatedBy: req.user._id,
      updatedByName: `Dr. ${req.user.name} (${req.user.organizationName || 'Vet Hospital'})`,
      note: timelineNote,
      timestamp: new Date(),
    });
    await emergency.save();

    // If referral to shelter is requested, notify shelter
    if (referToShelter && referredShelterId) {
      const shelter = await User.findById(referredShelterId);
      if (shelter) {
        // Auto-notify shelter
        await notifyUser(shelter._id, {
          title: `🏡 Animal Ready for Shelter Admission`,
          message: `Dr. ${req.user.name} referred ${record.animalName} (${record.animalType}) to your shelter following clinical stabilization.`,
          type: 'STATUS_UPDATE',
          link: `/shelter`,
          metadata: { reportId: emergency._id },
        });
      }
    }

    // Also notify citizen reporter
    if (emergency.reporter && emergency.reporter.user) {
      await notifyUser(emergency.reporter.user, {
        title: `Medical Update: ${emergency.title}`,
        message: `Dr. ${req.user.name} updated medical chart. Status: ${status || 'Under Treatment'}. Diagnosis: ${diagnosis}`,
        type: 'MEDICAL_UPDATE',
        link: `/reports/${emergency._id}`,
        metadata: { reportId: emergency._id },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medical chart updated successfully.',
      record,
      emergency,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * @desc    Get medical queue (incoming distress reports, transit rescues, and assigned patients)
 * @route   GET /api/medical/patients
 * @access  Private (Veterinarian, Admin)
 */
exports.getPendingPatients = async (req, res, next) => {
  try {
    const { status } = req.query;

    const query = {
      $or: [
        { status: { $in: ['REPORTED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'RESCUED', 'TRANSFERRED_VET'] } },
        { assignedVet: req.user._id },
      ],
    };

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const patients = await EmergencyReport.find(query)
      .populate('assignedTeam', 'name organizationName phone badgeNumber')
      .populate('assignedVet', 'name organizationName phone address badgeNumber')
      .populate('assignedShelter', 'name organizationName phone address')
      .populate('reporter.user', 'name phone email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * @desc    Get medical record by Emergency Report ID
 * @route   GET /api/medical/record/:reportId
 * @access  Private
 */
exports.getRecordByReportId = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findOne({ reportId: req.params.reportId })
      .populate('vetId', 'name organizationName phone address badgeNumber')
      .populate('referredShelterId', 'name organizationName phone address');

    if (!record) {
      return res.status(200).json({
        success: true,
        record: null,
        message: 'No medical chart created yet for this emergency.',
      });
    }

    res.status(200).json({
      success: true,
      record,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all medical records treated by this vet
 * @route   GET /api/medical/my-records
 * @access  Private (Veterinarian)
 */
exports.getMyRecords = async (req, res, next) => {
  try {
    const records = await MedicalRecord.find({ vetId: req.user._id })
      .populate('reportId')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (err) {
    next(err);
  }
};
