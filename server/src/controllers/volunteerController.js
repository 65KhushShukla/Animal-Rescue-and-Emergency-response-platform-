const VolunteerTask = require('../models/VolunteerTask');
const { notifyUser, notifyRoles } = require('../utils/notificationHelper');

/**
 * @desc    Create a volunteer task / opportunity
 * @route   POST /api/volunteers/tasks
 * @access  Private (Shelter, Rescue Team, Admin)
 */
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, taskType, urgency, address, reportId, estimatedHours } = req.body;

    const task = await VolunteerTask.create({
      title,
      description,
      taskType: taskType || 'RESCUE_SUPPORT',
      urgency: urgency || 'NORMAL',
      location: {
        address: address || '',
      },
      reportId: reportId || null,
      createdBy: req.user._id,
      shelterId: req.user.role === 'shelter' ? req.user._id : null,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 2,
      status: 'OPEN',
    });

    // Notify all volunteers about new task
    await notifyRoles(['volunteer'], {
      title: `🙋 New Volunteer Opportunity: ${title}`,
      message: `${req.user.name} posted a new task (${task.taskType.replace('_', ' ')}).`,
      type: 'VOLUNTEER_ASSIGNMENT',
      link: `/volunteer`,
      metadata: { reportId: task._id },
    });

    res.status(201).json({
      success: true,
      message: 'Volunteer task posted successfully.',
      task,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all open/available volunteer tasks
 * @route   GET /api/volunteers/tasks
 * @access  Private
 */
exports.getTasks = async (req, res, next) => {
  try {
    const { taskType, urgency, status } = req.query;
    const query = {};

    if (taskType && taskType !== 'ALL') query.taskType = taskType;
    if (urgency && urgency !== 'ALL') query.urgency = urgency;
    if (status && status !== 'ALL') query.status = status;

    const tasks = await VolunteerTask.find(query)
      .populate('createdBy', 'name organizationName role phone')
      .populate('assignedVolunteer', 'name phone email')
      .populate('reportId', 'title location urgency animalType')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Claim an open volunteer task
 * @route   PUT /api/volunteers/tasks/:id/claim
 * @access  Private (Volunteer, Admin)
 */
exports.claimTask = async (req, res, next) => {
  try {
    const task = await VolunteerTask.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (task.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        message: 'This task is already claimed or closed.',
      });
    }

    task.assignedVolunteer = req.user._id;
    task.status = 'ASSIGNED';
    await task.save();

    // Notify task creator
    await notifyUser(task.createdBy, {
      title: `Volunteer Claimed Task`,
      message: `${req.user.name} has signed up for "${task.title}".`,
      type: 'VOLUNTEER_ASSIGNMENT',
      link: `/volunteer`,
      metadata: { reportId: task._id },
    });

    res.status(200).json({
      success: true,
      message: 'You have claimed this task! Thank you for your service.',
      task,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Complete volunteer task and log hours
 * @route   PUT /api/volunteers/tasks/:id/complete
 * @access  Private (Volunteer, Admin)
 */
exports.completeTask = async (req, res, next) => {
  try {
    const { loggedHours, completionNotes } = req.body;
    const task = await VolunteerTask.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    task.status = 'COMPLETED';
    if (loggedHours) task.loggedHours = parseFloat(loggedHours);
    if (completionNotes) task.completionNotes = completionNotes;
    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task completed and hours logged!',
      task,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get stats for logged in volunteer (claimed tasks, total hours)
 * @route   GET /api/volunteers/my-stats
 * @access  Private (Volunteer)
 */
exports.getMyStats = async (req, res, next) => {
  try {
    const myTasks = await VolunteerTask.find({ assignedVolunteer: req.user._id })
      .populate('createdBy', 'name organizationName')
      .sort({ updatedAt: -1 });

    const totalHours = myTasks
      .filter((t) => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + (t.loggedHours || t.estimatedHours || 0), 0);

    const completedCount = myTasks.filter((t) => t.status === 'COMPLETED').length;
    const activeCount = myTasks.filter((t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length;

    res.status(200).json({
      success: true,
      stats: {
        totalHours,
        completedCount,
        activeCount,
        myTasks,
      },
    });
  } catch (err) {
    next(err);
  }
};
