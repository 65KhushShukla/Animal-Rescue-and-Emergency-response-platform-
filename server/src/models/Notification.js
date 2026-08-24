const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'EMERGENCY_ALERT',
        'STATUS_UPDATE',
        'MEDICAL_UPDATE',
        'ADOPTION_INQUIRY',
        'VOLUNTEER_ASSIGNMENT',
        'SYSTEM',
      ],
      default: 'STATUS_UPDATE',
    },
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyReport' },
      role: { type: String },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
