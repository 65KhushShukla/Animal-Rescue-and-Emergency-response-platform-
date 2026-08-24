const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Creates a notification for a single user
 */
const notifyUser = async (userId, { title, message, type = 'STATUS_UPDATE', link = '', metadata = {} }) => {
  try {
    if (!userId) return null;
    return await Notification.create({
      recipient: userId,
      title,
      message,
      type,
      link,
      metadata,
    });
  } catch (err) {
    console.error('[Notification Helper Error]:', err.message);
    return null;
  }
};

/**
 * Broadcasts notification to all users of specific roles
 */
const notifyRoles = async (roles = [], { title, message, type = 'EMERGENCY_ALERT', link = '', metadata = {} }) => {
  try {
    const users = await User.find({ role: { $in: roles } }).select('_id');
    if (!users.length) return [];

    const notifications = users.map((user) => ({
      recipient: user._id,
      title,
      message,
      type,
      link,
      metadata,
    }));

    return await Notification.insertMany(notifications);
  } catch (err) {
    console.error('[Notification Broadcast Error]:', err.message);
    return [];
  }
};

module.exports = {
  notifyUser,
  notifyRoles,
};
