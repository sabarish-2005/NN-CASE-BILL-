const User = require('../models/User');

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      settings: user.settings,
    },
  });
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
  const user = await User.create({ name, email, password });
  sendToken(user, 201, res);
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password required' });
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });
  sendToken(user, 200, res);
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, user });
};

exports.updateSettings = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: { settings: req.body } },
    { new: true, runValidators: true }
  );
  res.json({ success: true, user });
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.comparePassword(currentPassword)))
    return res.status(401).json({ success: false, message: 'Current password incorrect' });
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated' });
};
