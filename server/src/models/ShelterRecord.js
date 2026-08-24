const mongoose = require('mongoose');

const careLogSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    caregiverName: { type: String, required: true },
    fed: { type: Boolean, default: true },
    walked: { type: Boolean, default: false },
    medicationGiven: { type: Boolean, default: false },
    notes: { type: String, default: '' },
  },
  { _id: true }
);

const shelterRecordSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyReport',
    },
    medicalRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalRecord',
    },
    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    animalName: {
      type: String,
      required: [true, 'Please provide an animal name'],
      trim: true,
    },
    animalType: {
      type: String,
      required: true,
      enum: ['Dog', 'Cat', 'Bird', 'Cattle', 'Horse', 'Wildlife', 'Reptile', 'Other'],
      default: 'Dog',
    },
    breed: {
      type: String,
      default: 'Mixed Breed',
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Unknown'],
      default: 'Unknown',
    },
    estimatedAge: {
      type: String,
      default: 'Adult',
    },
    kennelNumber: {
      type: String,
      required: [true, 'Please assign a kennel or enclosure identifier'],
      trim: true,
    },
    intakeDate: {
      type: Date,
      default: Date.now,
    },
    dietaryPlan: {
      type: String,
      default: 'Standard diet',
    },
    behaviorNotes: {
      type: String,
      default: 'Calm and friendly',
    },
    dailyCareLogs: [careLogSchema],
    adoptionStatus: {
      type: String,
      enum: ['IN_RECOVERY', 'READY_FOR_ADOPTION', 'PENDING_ADOPTION', 'ADOPTED', 'PERMANENT_SANCTUARY'],
      default: 'IN_RECOVERY',
    },
    adoptionProfile: {
      bio: { type: String, default: '' },
      photos: [String],
      isGoodWithKids: { type: Boolean, default: true },
      isGoodWithPets: { type: Boolean, default: true },
      isSpayedNeutered: { type: Boolean, default: false },
      isVaccinated: { type: Boolean, default: false },
      adoptionFee: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

shelterRecordSchema.index({ shelterId: 1, adoptionStatus: 1 });
shelterRecordSchema.index({ adoptionStatus: 1 });

module.exports = mongoose.model('ShelterRecord', shelterRecordSchema);
