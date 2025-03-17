const router = require('express').Router();
const Material = require('../models/Material');
const User = require('../models/User');
const Request = require('../models/Request');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Get all materials
router.get('/', async (req, res) => {
  try {
    const materials = await Material.find()
      .populate('uploadedBy', 'username profilePicture badges')
      .sort({ uploadDate: -1 });
    res.status(200).json(materials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get material by ID
router.get('/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
      .populate('uploadedBy', 'username profilePicture badges');
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    res.status(200).json(material);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new material
router.post('/', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const newMaterial = new Material({
      ...req.body,
      fileUrl: req.file ? `/uploads/${req.file.filename}` : req.body.fileUrl,
      uploadedBy: req.user.id
    });
    
    const savedMaterial = await newMaterial.save();
    
    // Update user contribution points
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { contributionPoints: 10 }
    });
    
    // Check if this material fulfills any requests
    if (req.body.fulfillsRequestId) {
      await Request.findByIdAndUpdate(req.body.fulfillsRequestId, {
        status: 'Fulfilled',
        fulfillmentMaterial: savedMaterial._id
      });
    }
    
    res.status(201).json(savedMaterial);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rate a material
router.post('/:id/rate', verifyToken, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    // Check if user already rated
    const existingRatingIndex = material.ratings.findIndex(
      rating => rating.user.toString() === req.user.id
    );
    
    if (existingRatingIndex >= 0) {
      // Update existing rating
      material.ratings[existingRatingIndex].value = req.body.rating;
    } else {
      // Add new rating
      material.ratings.push({
        user: req.user.id,
        value: req.body.rating
      });
    }
    
    // Calculate average rating
    const totalRating = material.ratings.reduce((sum, item) => sum + item.value, 0);
    material.averageRating = totalRating / material.ratings.length;
    
    await material.save();
    
    // Update uploader's badges based on ratings
    if (material.ratings.length >= 5 && material.averageRating >= 4) {
      const uploader = await User.findById(material.uploadedBy);
      
      if (!uploader.badges.includes('Expert')) {
        await User.findByIdAndUpdate(material.uploadedBy, {
          $addToSet: { badges: 'Expert' }
        });
      }
    }
    
    res.status(200).json(material);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Download a material (increment download count)
router.post('/:id/download', verifyToken, async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    res.status(200).json(material);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
