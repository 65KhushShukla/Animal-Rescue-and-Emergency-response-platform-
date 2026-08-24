const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true }, // e.g. "Twice daily with meals"
    duration: { type: String, required: true },  // e.g. "7 days"
    instructions: { type: String, default: '' },
  },
  { _id: true }
);

const vaccinationSchema = new mongoose.Schema(
  {
    vaccineName: { type: String, required: true },
    administeredDate: { type: Date, default: Date.now },
    nextDueDate: { type: Date },
    batchNumber: { type: String, default: '' },
  },
  { _id: true }
);

const surgerySchema = new mongoose.Schema(
  {
    procedure: { type: String, required: true },
    surgeryDate: { type: Date, default: Date.now },
    surgeonNotes: { type: String, default: '' },
    postOpCare: { type: String, default: '' },
  },
  { _id: true }
);

const medicalRecordSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyReport',
      required: true,
    },
    animalName: {
      type: String,
      default: 'Rescued Patient',
    },
    animalType: {
      type: String,
      default: 'Dog',
    },
    vetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    intakeDate: {
      type: Date,
      default: Date.now,
    },
    vitals: {
      weightKg: { type: Number, default: 0 },
      temperatureC: { type: Number, default: 0 },
      heartRateBpm: { type: Number, default: 0 },
      hydrationStatus: { type: String, enum: ['Normal', 'Mildly Dehydrated', 'Severely Dehydrated'], default: 'Normal' },
    },
    symptoms: [String],
    diagnosis: {
      type: String,
      required: [true, 'Please provide a clinical diagnosis'],
    },
    treatmentPlan: {
      type: String,
      required: [true, 'Please provide a treatment plan'],
    },
    medications: [medicationSchema],
    vaccinations: [vaccinationSchema],
    surgeries: [surgerySchema],
    status: {
      type: String,
      enum: ['UNDER_TREATMENT', 'CRITICAL_CARE', 'SURGERY_RECOVERY', 'STABLE', 'DISCHARGED'],
      default: 'UNDER_TREATMENT',
    },
    dischargeNotes: {
      type: String,
      default: '',
    },
    referToShelter: {
      type: Boolean,
      default: false,
    },
    referredShelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    medicalMedia: [
      {
        url: { type: String, required: true },
        mediaType: { type: String, default: 'image' },
        description: { type: String, default: 'Medical Exam / X-Ray' },
      },
    ],
  },
  { timestamps: true }
);

medicalRecordSchema.index({ reportId: 1 });
medicalRecordSchema.index({ vetId: 1, status: 1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
