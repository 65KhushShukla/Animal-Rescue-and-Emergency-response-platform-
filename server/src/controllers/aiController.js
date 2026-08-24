const { analyzeEmergency } = require('../utils/aiHelper');

/**
 * @desc    Get real-time AI triage assessment for distress description
 * @route   POST /api/ai/triage
 * @access  Public
 */
exports.getAiTriage = async (req, res, next) => {
  try {
    const { description, animalType, symptoms } = req.body;

    if (!description && (!symptoms || symptoms.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide description or symptoms to analyze.',
      });
    }

    const triageResult = await analyzeEmergency(
      description || '',
      animalType || 'Dog',
      symptoms || []
    );

    res.status(200).json({
      success: true,
      triage: triageResult,
    });
  } catch (err) {
    next(err);
  }
};
