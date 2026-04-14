const mongoose = require('mongoose');

// Shared worker schema definition
const workerBaseSchema = {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  professions: [{
    type: String,
    required: true
  }],
  experience: {
    type: Number,
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  pricing: {
    amount: Number,
    unit: {
      type: String,
      enum: ['hour', 'day', 'job'],
      default: 'hour'
    }
  },
  availability: {
    type: Boolean,
    default: true
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
};

const workerSchema = new mongoose.Schema(workerBaseSchema, { timestamps: true });

// Helper to get or create a model for a specific profession collection
const getWorkerModel = (collectionName) => {
  // sanitize collection name (lowercase, no special chars)
  const sanitized = collectionName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const fullCollectionName = `workers_${sanitized}`;
  
  // Use existing model if already compiled
  if (mongoose.models[fullCollectionName]) {
    return mongoose.models[fullCollectionName];
  }

  // Define new model dynamically
  return mongoose.model(fullCollectionName, workerSchema, fullCollectionName);
};

module.exports = {
  getWorkerModel,
  workerBaseSchema
};
