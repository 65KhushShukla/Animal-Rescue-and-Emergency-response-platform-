const User = require('../models/User');
const EmergencyReport = require('../models/EmergencyReport');
const MedicalRecord = require('../models/MedicalRecord');
const ShelterRecord = require('../models/ShelterRecord');
const VolunteerTask = require('../models/VolunteerTask');

/**
 * @desc    Get comprehensive system analytics & KPI metrics
 * @route   GET /api/admin/analytics
 * @access  Private (Admin)
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    // 1. Total counts
    const totalReports = await EmergencyReport.countDocuments();
    const activeEmergencies = await EmergencyReport.countDocuments({
      status: { $in: ['REPORTED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED'] },
    });
    const inTreatment = await EmergencyReport.countDocuments({
      status: { $in: ['RESCUED', 'TRANSFERRED_VET', 'TRANSFERRED_SHELTER'] },
    });
    const resolvedCases = await EmergencyReport.countDocuments({ status: 'RESOLVED' });

    const totalUsers = await User.countDocuments();
    const totalShelterAnimals = await ShelterRecord.countDocuments();
    const readyForAdoption = await ShelterRecord.countDocuments({ adoptionStatus: 'READY_FOR_ADOPTION' });
    const adoptedAnimals = await ShelterRecord.countDocuments({ adoptionStatus: 'ADOPTED' });

    // 2. Species Breakdown aggregation
    const speciesBreakdown = await EmergencyReport.aggregate([
      { $group: { _id: '$animalType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // 3. Urgency Breakdown aggregation
    const urgencyBreakdown = await EmergencyReport.aggregate([
      { $group: { _id: '$urgency', count: { $sum: 1 } } },
    ]);

    // 4. Status Breakdown aggregation
    const statusBreakdown = await EmergencyReport.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // 5. User Roles Breakdown
    const userRoleBreakdown = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    // 6. Volunteer Stats
    const totalVolunteerTasks = await VolunteerTask.countDocuments();
    const completedTasks = await VolunteerTask.find({ status: 'COMPLETED' });
    const totalVolunteerHours = completedTasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);

    // 7. Recent 6 months trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyTrend = await EmergencyReport.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        totalReports,
        activeEmergencies,
        inTreatment,
        resolvedCases,
        totalUsers,
        totalShelterAnimals,
        readyForAdoption,
        adoptedAnimals,
        totalVolunteerHours,
        totalVolunteerTasks,
        speciesBreakdown,
        urgencyBreakdown,
        statusBreakdown,
        userRoleBreakdown,
        monthlyTrend,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all users with search & filter
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const query = {};

    if (role && role !== 'ALL') query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { organizationName: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user verification or role
 * @route   PUT /api/admin/users/:id
 * @access  Private (Admin)
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { role, isVerified } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (role) user.role = role;
    if (isVerified !== undefined) user.isVerified = Boolean(isVerified);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User record updated successfully.',
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent deleting own admin account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own admin account.' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User removed from platform.',
    });
  } catch (err) {
    next(err);
  }
};
