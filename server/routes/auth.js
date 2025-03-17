const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: req.body.email },
        { username: req.body.username }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create new user
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      badges: ['Beginner']
    });

    // Save user
    const savedUser = await newUser.save();
    
    // Create token
    const token = jwt.sign(
      { id: savedUser._id }, 
      process.env.JWT_SECRET || 'edushare_secret_key',
      { expiresIn: '1d' }
    );

    // Return user info (without password) and token
    const { password, ...userInfo } = savedUser._doc;
    res.status(201).json({ ...userInfo, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    // Find user
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate password
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'edushare_secret_key',
      { expiresIn: '1d' }
    );

    // Return user info (without password) and token
    const { password, ...userInfo } = user._doc;
    res.status(200).json({ ...userInfo, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
