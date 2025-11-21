// MongoDB Models/Schemas using Mongoose
import mongoose from 'mongoose';

/**
 * Deepfake Detection Result Schema
 * Stores deepfake percentage and confidence score
 */
const deepfakeDetectionSchema = new mongoose.Schema({
  deepfakePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    index: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Create the model
const DeepfakeDetection = mongoose.model('DeepfakeDetection', deepfakeDetectionSchema);

/**
 * Saves deepfake detection result to MongoDB
 * @param {number} deepfakePercentage - Deepfake percentage (0-1, from is_deepfake field)
 * @param {number} confidence - Confidence score (0-1, from bbox_confidence field)
 * @returns {Promise<Object>} Saved document
 */
export async function saveDetectionResult(deepfakePercentage, confidence) {
  try {
    const detection = new DeepfakeDetection({
      deepfakePercentage: deepfakePercentage,
      confidence: confidence
    });
    const saved = await detection.save();
    return saved;
  } catch (error) {
    console.error('Error saving detection result:', error);
    throw error;
  }
}

/**
 * Gets detection results from MongoDB
 * @param {Object} query - Mongoose query object (optional)
 * @param {Object} options - Query options like limit, sort, etc. (optional)
 * @returns {Promise<Array>} Array of detection results
 */
export async function getDetectionResults(query = {}, options = {}) {
  try {
    let queryBuilder = DeepfakeDetection.find(query);
    
    if (options.sort) {
      queryBuilder = queryBuilder.sort(options.sort);
    }
    if (options.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }
    
    const results = await queryBuilder.exec();
    return results;
  } catch (error) {
    console.error('Error getting detection results:', error);
    throw error;
  }
}

export { DeepfakeDetection };

