// Deepfake Detection API Routes
import express from 'express';
import { detectDeepfake } from '../services/hiveService.js';
import { saveDetectionResult, getDetectionResults } from '../db/models.js';

const router = express.Router();

/**
 * POST /api/deepfake
 * Receives base64 image from Chrome extension and processes it
 * 
 * Request body:
 * {
 *   image: "<base64_encoded_image>",
 *   timestamp: "<ISO_timestamp>"
 * }
 */
router.post('/', async (req, res, next) => {
  try {
    const { image, timestamp } = req.body;

    // Validate input
    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: image'
      });
    }

    // Validate base64 format (basic check)
    if (typeof image !== 'string' || image.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image format: must be a non-empty base64 string'
      });
    }

    console.log(`Processing deepfake detection request (image size: ${image.length} chars)`);

    // Call NVIDIA Hive API for deepfake detection
    const detectionResult = await detectDeepfake(image);

    // Extract detection results from API response
    const { fakeProbability, confidence, boundingBoxes } = extractDetectionData(detectionResult);

    // Save to MongoDB (deepfake percentage and confidence)
    try {
      await saveDetectionResult(fakeProbability, confidence);
      console.log('Detection result saved to MongoDB');
    } catch (dbError) {
      console.error('Error saving to MongoDB:', dbError);
      // Continue even if DB save fails - still return result to client
    }

    // Return success response
    res.json({
      success: true,
      result: {
        fake_probability: fakeProbability,
        confidence: confidence,
        bounding_boxes: boundingBoxes,
        timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
        raw_response: detectionResult
      }
    });

  } catch (error) {
    console.error('Error in deepfake detection route:', error);
    next(error);
  }
});

/**
 * Extracts detection data from NVIDIA Hive API response
 * Response structure:
 * {
 *   "data": [
 *     {
 *       "index": 0,
 *       "bounding_boxes": [
 *         {
 *           "vertices": [...],
 *           "bbox_confidence": 0.935,
 *           "is_deepfake": 0.998
 *         }
 *       ],
 *       "image": "..."
 *     }
 *   ]
 * }
 * 
 * @param {Object} apiResponse - Response from NVIDIA Hive API
 * @returns {Object} Extracted detection data with fakeProbability, confidence, and boundingBoxes
 */
function extractDetectionData(apiResponse) {
  // Default values
  let fakeProbability = 0;
  let confidence = 0;
  let boundingBoxes = [];

  // Check if response has data array
  if (!apiResponse || !apiResponse.data || !Array.isArray(apiResponse.data) || apiResponse.data.length === 0) {
    console.warn('Invalid API response structure or no data found');
    return { fakeProbability, confidence, boundingBoxes };
  }

  // Get first data item (usually there's only one)
  const firstDataItem = apiResponse.data[0];

  // Extract bounding boxes
  if (firstDataItem.bounding_boxes && Array.isArray(firstDataItem.bounding_boxes)) {
    boundingBoxes = firstDataItem.bounding_boxes;

    // If there are bounding boxes, use the first one (or highest confidence)
    if (boundingBoxes.length > 0) {
      // Sort by confidence (highest first) and take the top one
      const sortedBoxes = [...boundingBoxes].sort((a, b) => 
        (b.bbox_confidence || 0) - (a.bbox_confidence || 0)
      );
      
      const topBox = sortedBoxes[0];
      fakeProbability = topBox.is_deepfake || 0;
      confidence = topBox.bbox_confidence || 0;
    }
  }

  return {
    fakeProbability,
    confidence,
    boundingBoxes
  };
}

/**
 * GET /api/deepfake/results
 * Retrieves detection results from MongoDB
 * 
 * Query parameters:
 * - limit: Number of results to return (default: 50)
 * - sort: Sort order ('asc' or 'desc', default: 'desc')
 * - startDate: Filter by start date (ISO string)
 * - endDate: Filter by end date (ISO string)
 */
router.get('/results', async (req, res, next) => {
  try {
    const { limit = 50, sort = 'desc', startDate, endDate } = req.query;

    // Build query object for date filtering
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Build options object
    const options = {
      limit: parseInt(limit, 10),
      sort: { createdAt: sort === 'asc' ? 1 : -1 }
    };

    // Get results from database
    const results = await getDetectionResults(query, options);

    // Get total count for pagination (without limit)
    const allResults = await getDetectionResults(query, {});
    const total = allResults.length;

    res.json({
      success: true,
      data: results,
      total: total,
      limit: parseInt(limit, 10)
    });

  } catch (error) {
    console.error('Error getting detection results:', error);
    next(error);
  }
});

export { router as deepfakeRouter };

