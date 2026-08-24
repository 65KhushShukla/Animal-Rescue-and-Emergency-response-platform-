const User = require('../models/User');

// Helper to format auth response with token
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const userObj = user.toObject();
  delete userObj.password;

  res.status(statusCode).json({
    success: true,
    token,
    user: userObj,
  });
};

/**
 * @desc    Register a new user with specific role
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, organizationName, badgeNumber, address, latitude, longitude, skills } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Build location object if coords provided
    const location = {
      type: 'Point',
      coordinates: [
        longitude ? parseFloat(longitude) : 77.2090, // default lng (e.g. New Delhi/Metropolitan)
        latitude ? parseFloat(latitude) : 28.6139,   // default lat
      ],
    };

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'citizen',
      phone: phone || '',
      organizationName: organizationName || '',
      badgeNumber: badgeNumber || '',
      address: address || '',
      location,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map((s) => s.trim()) : []),
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Login user & return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password presence
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Check for user (must explicitly select password since it has select: false)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user profile details
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address,
      organizationName: req.body.organizationName,
      badgeNumber: req.body.badgeNumber,
      avatar: req.body.avatar,
    };

    if (req.body.latitude && req.body.longitude) {
      fieldsToUpdate.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
      };
    }

    if (req.body.skills) {
      fieldsToUpdate.skills = Array.isArray(req.body.skills)
        ? req.body.skills
        : req.body.skills.split(',').map((s) => s.trim());
    }

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(
      (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get directory of active/verified organizations & users by role
 * @route   GET /api/auth/directory
 * @access  Private (Authenticated users)
 */
exports.getDirectory = async (req, res, next) => {
  try {
    const { role } = req.query;
    const query = { isVerified: true };

    if (role && role !== 'ALL') {
      query.role = role;
    }

    const users = await User.find(query)
      .select('name email role organizationName badgeNumber phone address location avatar skills isVerified')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    next(err);
  }
};

