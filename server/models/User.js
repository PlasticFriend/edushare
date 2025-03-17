const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  badges: [{
    type: String,
    enum: ['Beginner', 'Helper', 'Expert', 'Master']
  }],
  contributionPoints: {
    type: Number,
    default: 0
  },
  dateJoined: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
