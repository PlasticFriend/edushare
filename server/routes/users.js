const router = require('express').Router();
const User = require('../models/User');
const Material = require('../models/Material');
const { verifyToken } = require('../middleware/auth');

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { password, ...userInfo } = user._doc;
    res.status(200).json(userInfo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's uploaded materials
router.get('/:id/materials', async (req, res) => {
  try {
    const materials = await Material.find({ uploadedBy: req.params.id })
      .sort({ uploadDate: -1 });
    
    res.status(200).json(materials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    );
    
    const { password: pwd, ...userInfo } = updatedUser._doc;
    res.status(200).json(userInfo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
