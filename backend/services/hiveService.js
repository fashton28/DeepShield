// NVIDIA Hive Deepfake Detection Service
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const INVOKE_URL = 'https://ai.api.nvidia.com/v1/cv/hive/deepfake-image-detection';
const ASSETS_URL = 'https://api.nvcf.nvidia.com/v2/nvcf/assets';

/**
 * Uploads an image asset to NVIDIA asset storage
 * @param {Buffer} imageBuffer - Image buffer data
 * @param {string} description - Asset description
 * @returns {Promise<string>} Asset ID
 */
async function uploadAsset(imageBuffer, description = 'Input Image') {
  const headers = {
    'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    'Content-Type': 'application/json',
    'accept': 'application/json',
  };

  const payload = {
    contentType: 'image/jpeg',
    description: description
  };

  // Create asset
  const response = await fetch(ASSETS_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create asset: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const assetUrl = data.uploadUrl;
  const assetId = data.assetId;

  // Upload image to S3
  const s3Headers = {
    'x-amz-meta-nvcf-asset-description': description,
    'content-type': 'image/jpeg',
  };

  const uploadResponse = await fetch(assetUrl, {
    method: 'PUT',
    body: imageBuffer,
    headers: s3Headers
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload asset: ${uploadResponse.status}`);
  }

  return assetId.toString();
}

/**
 * Detects deepfake in an image using NVIDIA Hive API
 * @param {string} base64Image - Base64 encoded image (without data URL prefix)
 * @returns {Promise<Object>} Detection result from NVIDIA API
 */
export async function detectDeepfake(base64Image) {
  try {
    // Convert base64 to buffer for size check and potential asset upload
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    let payload;
    let headers;

    // Check if image is small enough to send directly (< 180KB base64)
    if (base64Image.length < 180000) {
      // Small image: send directly
      payload = {
        input: [`data:image/jpeg;base64,${base64Image}`]
      };

      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Accept': 'application/json'
      };
    } else {
      // Large image: upload to asset storage first
      console.log('Image is large, uploading to asset storage...');
      const assetId = await uploadAsset(imageBuffer, 'Input Image');

      payload = {
        input: [`data:image/jpeg;asset_id,${assetId}`]
      };

      headers = {
        'Content-Type': 'application/json',
        'NVCF-INPUT-ASSET-REFERENCES': assetId,
        'Authorization': `Bearer ${NVIDIA_API_KEY}`
      };
    }

    // Call NVIDIA Hive API
    const response = await fetch(INVOKE_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NVIDIA API error: ${response.status} ${errorText}`);
    }

    const output = await response.json();
    return output;
  } catch (error) {
    console.error('Error in detectDeepfake:', error);
    throw error;
  }
}

