const mongoose = require('mongoose');

const volunteerTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide task description'],
    },
    taskType: {
      type: String,
      enum: [
        'RESCUE_SUPPORT',
        'ANIMAL_TRANSPORT',
        'SHELTER_FEEDING',
        'FOSTER_CARE',
        'COMMUNITY_OUTREACH',
        'EMERGENCY_DISPATCH',
      ],
      default: 'RESCUE_SUPPORT',
    },
    urgency: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'],
      default: 'NORMAL',
    },
    location: {
      address: { type: String, default: '' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyReport',
    },
    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'OPEN',
    },
    estimatedHours: {
      type: Number,
      default: 2,
    },
    loggedHours: {
      type: Number,
      default: 0,
    },
    completionNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

volunteerTaskSchema.index({ status: 1, urgency: 1 });
volunteerTaskSchema.index({ assignedVolunteer: 1 });

module.exports = mongoose.model('VolunteerTask', volunteerTaskSchema);
