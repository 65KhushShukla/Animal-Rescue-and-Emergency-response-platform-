const ShelterRecord = require('../models/ShelterRecord');
const AdoptionInquiry = require('../models/AdoptionInquiry');
const EmergencyReport = require('../models/EmergencyReport');
const MedicalRecord = require('../models/MedicalRecord');
const { uploadMedia } = require('../config/cloudinary');
const { notifyUser } = require('../utils/notificationHelper');


/**
 * @desc    Admit animal into shelter & create shelter record
 * @route   POST /api/shelter/admit
 * @access  Private (Shelter, Admin)
 */
exports.admitAnimal = async (req, res, next) => {
  try {
    const {
      reportId,
      medicalRecordId,
      animalName,
      animalType,
      breed,
      gender,
      estimatedAge,
      kennelNumber,
      dietaryPlan,
      behaviorNotes,
      adoptionStatus,
      bio,
      isGoodWithKids,
      isGoodWithPets,
      isSpayedNeutered,
      isVaccinated,
      adoptionFee,
    } = req.body;

    const photos = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadMedia(file, 'animal_rescue_shelter');
        if (uploaded) photos.push(uploaded.url);
      }
    }

    const shelterRecord = await ShelterRecord.create({
      reportId: reportId || null,
      medicalRecordId: medicalRecordId || null,
      shelterId: req.user._id,
      animalName,
      animalType: animalType || 'Dog',
      breed: breed || 'Mixed Breed',
      gender: gender || 'Unknown',
      estimatedAge: estimatedAge || 'Adult',
      kennelNumber,
      dietaryPlan: dietaryPlan || 'Standard nutrition formula',
      behaviorNotes: behaviorNotes || 'Alert and responsive',
      adoptionStatus: adoptionStatus || 'IN_RECOVERY',
      adoptionProfile: {
        bio: bio || `${animalName} is a lovely ${animalType} looking for a warm and caring forever home.`,
        photos: photos.length > 0 ? photos : [],
        isGoodWithKids: isGoodWithKids === 'true' || isGoodWithKids === true,
        isGoodWithPets: isGoodWithPets === 'true' || isGoodWithPets === true,
        isSpayedNeutered: isSpayedNeutered === 'true' || isSpayedNeutered === true,
        isVaccinated: isVaccinated === 'true' || isVaccinated === true,
        adoptionFee: adoptionFee ? parseFloat(adoptionFee) : 0,
      },
    });

    // Update emergency report status to TRANSFERRED_SHELTER or RESOLVED
    if (reportId) {
      const emergency = await EmergencyReport.findById(reportId);
      if (emergency) {
        emergency.assignedShelter = req.user._id;
        emergency.status = 'TRANSFERRED_SHELTER';
        emergency.timeline.push({
          status: 'TRANSFERRED_SHELTER',
          updatedBy: req.user._id,
          updatedByName: `${req.user.name} (${req.user.organizationName || 'Shelter'})`,
          note: `Admitted to shelter kennel #${kennelNumber}. Rehabilitation plan initiated.`,
          timestamp: new Date(),
        });
        await emergency.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Animal successfully admitted to shelter.',
      shelterRecord,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all animals housed in this shelter
 * @route   GET /api/shelter/my-animals
 * @access  Private (Shelter, Admin)
 */
exports.getMyShelterAnimals = async (req, res, next) => {
  try {
    const records = await ShelterRecord.find({ shelterId: req.user._id })
      .populate('reportId')
      .populate('medicalRecordId')
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

/**
 * @desc    Add daily care log entry (feeding, walking, meds, notes)
 * @route   POST /api/shelter/:id/care-log
 * @access  Private (Shelter, Volunteer, Admin)
 */
exports.addCareLog = async (req, res, next) => {
  try {
    const { fed, walked, medicationGiven, notes } = req.body;
    const record = await ShelterRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Shelter animal record not found.' });
    }

    record.dailyCareLogs.unshift({
      date: new Date(),
      caregiverName: req.user.name,
      fed: Boolean(fed),
      walked: Boolean(walked),
      medicationGiven: Boolean(medicationGiven),
      notes: notes || '',
    });

    await record.save();

    res.status(200).json({
      success: true,
      message: 'Daily care entry recorded.',
      record,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get incoming animal referrals assigned to this shelter from Vets & Rescue Teams
 * @route   GET /api/shelter/incoming-referrals
 * @access  Private (Shelter, Admin)
 */
exports.getIncomingReferrals = async (req, res, next) => {
  try {
    const existingShelterRecords = await ShelterRecord.find({ shelterId: req.user._id }).select('reportId');
    const existingReportIds = existingShelterRecords
      .map((r) => (r.reportId ? r.reportId.toString() : null))
      .filter(Boolean);

    const emergencies = await EmergencyReport.find({
      assignedShelter: req.user._id,
      _id: { $nin: existingReportIds },
    })
      .populate('assignedTeam', 'name organizationName phone badgeNumber')
      .populate('assignedVet', 'name organizationName phone address')
      .populate('reporter.user', 'name phone email')
      .sort({ updatedAt: -1 });

    const emergencyIds = emergencies.map((e) => e._id);
    const medicalRecords = await MedicalRecord.find({ reportId: { $in: emergencyIds } })
      .populate('vetId', 'name organizationName phone');

    const referrals = emergencies.map((em) => {
      const med = medicalRecords.find((m) => m.reportId.toString() === em._id.toString());
      return {
        emergency: em,
        medicalRecord: med || null,
      };
    });

    res.status(200).json({
      success: true,
      count: referrals.length,
      referrals,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update animal adoption status and profile details
 * @route   PUT /api/shelter/:id/adoption-status
 * @access  Private (Shelter, Admin)
 */
exports.updateAdoptionStatus = async (req, res, next) => {
  try {
    const {
      adoptionStatus,
      kennelNumber,
      dietaryPlan,
      behaviorNotes,
      bio,
      isGoodWithKids,
      isGoodWithPets,
      isSpayedNeutered,
      isVaccinated,
      adoptionFee,
    } = req.body;
    const record = await ShelterRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Shelter record not found.' });
    }

    if (adoptionStatus) record.adoptionStatus = adoptionStatus;
    if (kennelNumber) record.kennelNumber = kennelNumber;
    if (dietaryPlan) record.dietaryPlan = dietaryPlan;
    if (behaviorNotes) record.behaviorNotes = behaviorNotes;

    if (bio !== undefined) record.adoptionProfile.bio = bio;
    if (isGoodWithKids !== undefined) record.adoptionProfile.isGoodWithKids = isGoodWithKids;
    if (isGoodWithPets !== undefined) record.adoptionProfile.isGoodWithPets = isGoodWithPets;
    if (isSpayedNeutered !== undefined) record.adoptionProfile.isSpayedNeutered = isSpayedNeutered;
    if (isVaccinated !== undefined) record.adoptionProfile.isVaccinated = isVaccinated;
    if (adoptionFee !== undefined) record.adoptionProfile.adoptionFee = adoptionFee;

    await record.save();

    // If status updated, sync with linked EmergencyReport
    if (record.reportId) {
      const emergency = await EmergencyReport.findById(record.reportId);
      if (emergency) {
        if (adoptionStatus === 'ADOPTED') {
          emergency.status = 'RESOLVED';
          emergency.timeline.push({
            status: 'RESOLVED',
            updatedBy: req.user._id,
            updatedByName: `${req.user.name} (${req.user.organizationName || 'Shelter'})`,
            note: `🎉 ${record.animalName} has found a forever family and has been officially adopted! Rescue mission resolved.`,
            timestamp: new Date(),
          });
          await emergency.save();

          if (emergency.reporter?.user) {
            await notifyUser(emergency.reporter.user, {
              title: `🎉 Great News! ${record.animalName} was Adopted!`,
              message: `The animal you reported has fully recovered and has been adopted into a forever home.`,
              type: 'STATUS_UPDATE',
              link: `/reports/${emergency._id}`,
              metadata: { reportId: emergency._id },
            });
          }
        } else if (adoptionStatus === 'READY_FOR_ADOPTION') {
          emergency.timeline.push({
            status: 'TRANSFERRED_SHELTER',
            updatedBy: req.user._id,
            updatedByName: `${req.user.name} (${req.user.organizationName || 'Shelter'})`,
            note: `${record.animalName} has completed rehabilitation and is now available for public adoption!`,
            timestamp: new Date(),
          });
          await emergency.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Shelter record updated successfully.',
      record,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * @desc    Public adoption portal - list animals ready for adoption
 * @route   GET /api/shelter/adoptions
 * @access  Public
 */
exports.getPublicAdoptions = async (req, res, next) => {
  try {
    const { animalType, search, goodWithKids, goodWithPets } = req.query;

    const query = {
      adoptionStatus: { $in: ['READY_FOR_ADOPTION', 'PENDING_ADOPTION'] },
    };

    if (animalType && animalType !== 'ALL') {
      query.animalType = animalType;
    }

    if (goodWithKids === 'true') {
      query['adoptionProfile.isGoodWithKids'] = true;
    }

    if (goodWithPets === 'true') {
      query['adoptionProfile.isGoodWithPets'] = true;
    }

    if (search) {
      query.$or = [
        { animalName: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { 'adoptionProfile.bio': { $regex: search, $options: 'i' } },
      ];
    }

    const animals = await ShelterRecord.find(query)
      .populate('shelterId', 'name organizationName phone address email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: animals.length,
      animals,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Submit adoption inquiry application
 * @route   POST /api/shelter/adoptions/:id/inquire
 * @access  Private (Citizen, Volunteer)
 */
exports.submitAdoptionInquiry = async (req, res, next) => {
  try {
    const { housingType, hasOtherPets, petExperienceYears, message, phone, address } = req.body;
    const shelterRecord = await ShelterRecord.findById(req.params.id);

    if (!shelterRecord) {
      return res.status(404).json({ success: false, message: 'Animal not found.' });
    }

    const inquiry = await AdoptionInquiry.create({
      shelterRecordId: shelterRecord._id,
      shelterId: shelterRecord.shelterId,
      applicantId: req.user._id,
      applicantName: req.user.name,
      applicantEmail: req.user.email,
      applicantPhone: phone || req.user.phone || 'N/A',
      address: address || req.user.address || 'N/A',
      housingType: housingType || 'House with Yard',
      hasOtherPets: Boolean(hasOtherPets),
      petExperienceYears: petExperienceYears ? parseInt(petExperienceYears) : 1,
      message,
      status: 'PENDING',
    });

    // Notify Shelter
    await notifyUser(shelterRecord.shelterId, {
      title: `🐾 New Adoption Application!`,
      message: `${req.user.name} submitted an application to adopt ${shelterRecord.animalName}.`,
      type: 'ADOPTION_INQUIRY',
      link: `/shelter`,
      metadata: { reportId: shelterRecord._id },
    });

    res.status(201).json({
      success: true,
      message: 'Adoption application submitted successfully! The shelter will review your request.',
      inquiry,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get adoption inquiries for current shelter
 * @route   GET /api/shelter/inquiries
 * @access  Private (Shelter, Admin)
 */
exports.getShelterInquiries = async (req, res, next) => {
  try {
    const inquiries = await AdoptionInquiry.find({ shelterId: req.user._id })
      .populate('shelterRecordId')
      .populate('applicantId', 'name email phone avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: inquiries.length,
      inquiries,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update adoption application status (APPROVED / REJECTED / UNDER_REVIEW)
 * @route   PUT /api/shelter/inquiries/:id
 * @access  Private (Shelter, Admin)
 */
exports.updateInquiryStatus = async (req, res, next) => {
  try {
    const { status, shelterNotes } = req.body;
    const inquiry = await AdoptionInquiry.findById(req.params.id).populate('shelterRecordId');

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    }

    inquiry.status = status;
    if (shelterNotes) inquiry.shelterNotes = shelterNotes;
    await inquiry.save();

    // If approved, update animal status to ADOPTED or PENDING_ADOPTION
    if (status === 'APPROVED' && inquiry.shelterRecordId) {
      await ShelterRecord.findByIdAndUpdate(inquiry.shelterRecordId._id, {
        adoptionStatus: 'ADOPTED',
      });
    }

    // Notify Applicant
    await notifyUser(inquiry.applicantId, {
      title: `Adoption Application ${status}`,
      message: `Your application to adopt ${inquiry.shelterRecordId?.animalName || 'the animal'} has been marked as: ${status}. ${shelterNotes || ''}`,
      type: 'ADOPTION_INQUIRY',
      link: `/adoptions`,
      metadata: { reportId: inquiry._id },
    });

    res.status(200).json({
      success: true,
      message: `Inquiry status updated to ${status}.`,
      inquiry,
    });
  } catch (err) {
    next(err);
  }
};
