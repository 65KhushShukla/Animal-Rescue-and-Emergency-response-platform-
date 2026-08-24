const EmergencyReport = require('../models/EmergencyReport');
const MedicalRecord = require('../models/MedicalRecord');
const ShelterRecord = require('../models/ShelterRecord');
const { uploadMedia } = require('../config/cloudinary');
const { analyzeEmergency } = require('../utils/aiHelper');
const { notifyRoles, notifyUser } = require('../utils/notificationHelper');


/**
 * @desc    Create a new emergency report
 * @route   POST /api/emergencies
 * @access  Public / Optional Auth (citizens or guests)
 */
exports.createEmergency = async (req, res, next) => {
  try {
    const {
      title,
      animalType,
      breed,
      estimatedAge,
      urgency,
      description,
      symptoms,
      latitude,
      longitude,
      address,
      city,
      landmark,
      reporterName,
      reporterPhone,
      reporterEmail,
    } = req.body;

    // Validate essential coordinates and address
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'GPS coordinates (latitude and longitude) are required.',
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Location address or description is required.',
      });
    }

    // Process uploaded media files
    const mediaList = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadMedia(file, 'animal_rescue_emergencies');
        if (uploaded) {
          mediaList.push(uploaded);
        }
      }
    }

    // Parse symptoms list if sent as string or array
    let parsedSymptoms = [];
    if (symptoms) {
      if (Array.isArray(symptoms)) {
        parsedSymptoms = symptoms;
      } else if (typeof symptoms === 'string') {
        try {
          parsedSymptoms = JSON.parse(symptoms);
        } catch (e) {
          parsedSymptoms = symptoms.split(',').map((s) => s.trim());
        }
      }
    }

    // Run AI Triage
    const aiTriageResult = await analyzeEmergency(
      description,
      animalType || 'Dog',
      parsedSymptoms
    );

    // If citizen didn't manually set urgency, use AI severity
    const finalUrgency = urgency || aiTriageResult.severity || 'HIGH';

    // Build reporter profile
    const reporterData = {
      user: req.user ? req.user._id : null,
      name: req.user ? req.user.name : reporterName || 'Concerned Citizen',
      phone: req.user ? req.user.phone : reporterPhone || '',
      email: req.user ? req.user.email : reporterEmail || '',
    };

    // Construct initial timeline item
    const initialTimeline = [
      {
        status: 'REPORTED',
        updatedBy: req.user ? req.user._id : null,
        updatedByName: reporterData.name,
        note: `Emergency report submitted: ${title || 'Distressed Animal'}. Initial triage level: ${finalUrgency}`,
        photoUrl: mediaList.length > 0 ? mediaList[0].url : '',
        timestamp: new Date(),
      },
    ];

    const emergency = await EmergencyReport.create({
      title: title || `${animalType || 'Animal'} in distress near ${address}`,
      animalType: animalType || 'Dog',
      breed: breed || 'Unknown / Mixed',
      estimatedAge: estimatedAge || 'Unknown',
      urgency: finalUrgency,
      status: 'REPORTED',
      description,
      symptoms: parsedSymptoms,
      media: mediaList,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address,
        city: city || '',
        landmark: landmark || '',
      },
      reporter: reporterData,
      aiTriage: aiTriageResult,
      timeline: initialTimeline,
    });

    // Notify rescue teams and admins
    await notifyRoles(['rescue_team', 'admin'], {
      title: `🚨 New Emergency: ${emergency.urgency} - ${emergency.animalType}`,
      message: `Emergency reported at ${emergency.location.address}. "${emergency.title}"`,
      type: 'EMERGENCY_ALERT',
      link: `/rescues`,
      metadata: { reportId: emergency._id },
    });

    res.status(201).json({
      success: true,
      message: 'Emergency report submitted successfully. Rescue teams have been alerted.',
      emergency,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all emergency reports with filtering, search & geospatial query
 * @route   GET /api/emergencies
 * @access  Public
 */
exports.getEmergencies = async (req, res, next) => {
  try {
    const {
      status,
      urgency,
      animalType,
      search,
      lat,
      lng,
      radiusKm = 25,
      limit = 50,
      page = 1,
    } = req.query;

    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (urgency && urgency !== 'ALL') {
      query.urgency = urgency;
    }

    if (animalType && animalType !== 'ALL') {
      query.animalType = animalType;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
      ];
    }

    // Geospatial filter if lat & lng are specified
    if (lat && lng) {
      const radiusInMeters = parseFloat(radiusKm) * 1000;
      query.location = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: radiusInMeters,
        },
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const emergencies = await EmergencyReport.find(query)
      .populate('assignedTeam', 'name organizationName phone badgeNumber')
      .populate('assignedVet', 'name organizationName phone')
      .populate('assignedShelter', 'name organizationName phone')
      .sort(lat && lng ? {} : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await EmergencyReport.countDocuments(query);

    res.status(200).json({
      success: true,
      count: emergencies.length,
      total,
      emergencies,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single emergency report by ID
 * @route   GET /api/emergencies/:id
 * @access  Public
 */
exports.getEmergencyById = async (req, res, next) => {
  try {
    let emergency = await EmergencyReport.findById(req.params.id)
      .populate('assignedTeam', 'name organizationName phone badgeNumber avatar')
      .populate('assignedVet', 'name organizationName phone address badgeNumber avatar')
      .populate('assignedShelter', 'name organizationName phone address badgeNumber avatar')
      .populate('reporter.user', 'name phone email')
      .populate('timeline.updatedBy', 'name role organizationName');

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency report not found.',
      });
    }

    // Fetch linked MedicalRecord and ShelterRecord
    const medicalRecord = await MedicalRecord.findOne({ reportId: emergency._id })
      .populate('vetId', 'name organizationName phone address badgeNumber avatar')
      .populate('referredShelterId', 'name organizationName phone address badgeNumber avatar');

    const shelterRecord = await ShelterRecord.findOne({ reportId: emergency._id })
      .populate('shelterId', 'name organizationName phone address badgeNumber avatar');

    // If emergency was missing assignedVet or assignedShelter in DB, sync from medical record
    let needsSave = false;
    if (!emergency.assignedVet && medicalRecord?.vetId) {
      emergency.assignedVet = medicalRecord.vetId;
      needsSave = true;
    }
    if (!emergency.assignedShelter && (shelterRecord?.shelterId || medicalRecord?.referredShelterId)) {
      emergency.assignedShelter = shelterRecord?.shelterId || medicalRecord?.referredShelterId;
      needsSave = true;
    }

    if (needsSave) {
      await EmergencyReport.findByIdAndUpdate(emergency._id, {
        assignedVet: emergency.assignedVet?._id || emergency.assignedVet,
        assignedShelter: emergency.assignedShelter?._id || emergency.assignedShelter,
      });
    }

    res.status(200).json({
      success: true,
      emergency,
      medicalRecord,
      shelterRecord,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * @desc    Get reports created by current logged in citizen
 * @route   GET /api/emergencies/my-reports
 * @access  Private (Citizen)
 */
exports.getMyReports = async (req, res, next) => {
  try {
    const reports = await EmergencyReport.find({
      $or: [
        { 'reporter.user': req.user._id },
        { 'reporter.email': req.user.email },
      ],
    })
      .populate('assignedTeam', 'name phone organizationName')
      .populate('assignedVet', 'name phone organizationName')
      .populate('assignedShelter', 'name phone organizationName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add a timeline update / note to an emergency report
 * @route   POST /api/emergencies/:id/timeline
 * @access  Private
 */
exports.addTimelineUpdate = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const emergency = await EmergencyReport.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency report not found.',
      });
    }

    let photoUrl = '';
    if (req.file) {
      const uploaded = await uploadMedia(req.file, 'animal_rescue_timeline');
      if (uploaded) photoUrl = uploaded.url;
    }

    const timelineEntry = {
      status: status || emergency.status,
      updatedBy: req.user._id,
      updatedByName: `${req.user.name} (${req.user.role.replace('_', ' ')})`,
      note: note || `Status updated to ${status || emergency.status}`,
      photoUrl,
      timestamp: new Date(),
    };

    if (status && status !== emergency.status) {
      emergency.status = status;
    }

    emergency.timeline.push(timelineEntry);
    await emergency.save();

    // Notify reporter
    if (emergency.reporter && emergency.reporter.user) {
      await notifyUser(emergency.reporter.user, {
        title: `Rescue Update: ${emergency.title}`,
        message: `Status is now: ${emergency.status}. Note: ${note || 'Updated by rescue personnel'}`,
        type: 'STATUS_UPDATE',
        link: `/reports/${emergency._id}`,
        metadata: { reportId: emergency._id },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Timeline updated successfully.',
      emergency,
    });
  } catch (err) {
    next(err);
  }
};
