const mongoose = require('mongoose');

const adoptionInquirySchema = new mongoose.Schema(
  {
    shelterRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShelterRecord',
      required: true,
    },
    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    applicantName: {
      type: String,
      required: true,
    },
    applicantEmail: {
      type: String,
      required: true,
    },
    applicantPhone: {
      type: String,
      required: true,
    },
    housingType: {
      type: String,
      enum: ['Apartment', 'House with Yard', 'Farm / Rural Property', 'Other'],
      default: 'House with Yard',
    },
    hasOtherPets: {
      type: Boolean,
      default: false,
    },
    petExperienceYears: {
      type: Number,
      default: 1,
    },
    message: {
      type: String,
      required: [true, 'Please explain why you would like to adopt this animal'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED'],
      default: 'PENDING',
    },
    shelterNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

adoptionInquirySchema.index({ shelterId: 1, status: 1 });
adoptionInquirySchema.index({ applicantId: 1 });

module.exports = mongoose.model('AdoptionInquiry', adoptionInquirySchema);
