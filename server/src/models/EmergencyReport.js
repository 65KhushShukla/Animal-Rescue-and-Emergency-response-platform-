const mongoose = require('mongoose');

const timelineEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedByName: {
      type: String,
      default: 'System',
    },
    note: {
      type: String,
      default: '',
    },
    photoUrl: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const emergencyReportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a brief title or description of the emergency'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    animalType: {
      type: String,
      required: [true, 'Please specify the animal type'],
      enum: ['Dog', 'Cat', 'Bird', 'Cattle', 'Horse', 'Wildlife', 'Reptile', 'Other'],
      default: 'Dog',
    },
    breed: {
      type: String,
      default: 'Unknown / Mixed',
      trim: true,
    },
    estimatedAge: {
      type: String,
      enum: ['Puppy/Kitten', 'Young', 'Adult', 'Senior', 'Unknown'],
      default: 'Unknown',
    },
    urgency: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      default: 'HIGH',
    },
    status: {
      type: String,
      enum: [
        'REPORTED',
        'ACCEPTED',
        'EN_ROUTE',
        'ARRIVED',
        'RESCUED',
        'TRANSFERRED_VET',
        'TRANSFERRED_SHELTER',
        'RESOLVED',
        'CANCELLED',
      ],
      default: 'REPORTED',
    },
    description: {
      type: String,
      required: [true, 'Please provide details about the animal and situation'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    symptoms: [String],
    media: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
        mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
      },
    ],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Please provide coordinates (longitude and latitude)'],
      },
      address: {
        type: String,
        required: [true, 'Please provide a location address or area name'],
      },
      city: {
        type: String,
        default: '',
      },
      landmark: {
        type: String,
        default: '',
      },
    },
    reporter: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      name: {
        type: String,
        default: 'Anonymous Citizen',
      },
      phone: {
        type: String,
        default: '',
      },
      email: {
        type: String,
        default: '',
      },
    },
    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedVet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedShelter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    aiTriage: {
      severity: {
        type: String,
        enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'],
        default: 'UNKNOWN',
      },
      confidence: {
        type: Number,
        default: 0,
      },
      immediateAdvice: {
        type: [String],
        default: [],
      },
      detectedInjuries: {
        type: [String],
        default: [],
      },
      analyzedAt: {
        type: Date,
      },
    },
    timeline: [timelineEntrySchema],
  },
  { timestamps: true }
);

// 2dsphere index for geospatial queries (find nearby emergencies)
emergencyReportSchema.index({ location: '2dsphere' });
emergencyReportSchema.index({ status: 1, urgency: 1 });
emergencyReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EmergencyReport', emergencyReportSchema);
