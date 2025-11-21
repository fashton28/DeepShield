// Background Service Worker for Deepfake Detection Extension
// Handles screenshot capture and communication with backend API

// Backend endpoint URL
const BACKEND_URL = 'http://localhost:3000/api/deepfake';

/**
 * Listens for messages from popup
 * Expected message: { action: 'captureAndAnalyze' }
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureAndAnalyze') {
    handleCaptureAndAnalyze(sender.tab)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
});

/**
 * Main handler for capture and analyze flow
 * @param {chrome.tabs.Tab} tab - The active tab
 */
async function handleCaptureAndAnalyze(tab) {
  try {
    // Capture screenshot (JPEG format, quality 80 for smaller file size)
    const screenshotDataUrl = await captureScreenshot(tab);
    
    // Convert data URL to base64
    const base64Image = convertDataUrlToBase64(screenshotDataUrl);
    
    // Send to backend API
    const backendResponse = await sendToBackend(base64Image);
    
    // Backend returns { success: true, result: {...} }
    // Return just the result part to avoid double nesting
    if (backendResponse.success && backendResponse.result) {
      return backendResponse.result;
    }
    
    // Fallback: return the whole response if structure is different
    return backendResponse;
  } catch (error) {
    console.error('Error in handleCaptureAndAnalyze:', error);
    throw error;
  }
}

/**
 * Captures a screenshot of the visible tab
 * Uses JPEG format with quality setting to reduce file size
 * @param {chrome.tabs.Tab} tab - The tab to capture
 * @returns {Promise<string>} Data URL of the screenshot
 */
async function captureScreenshot(tab) {
  // Use JPEG format with quality 80 to significantly reduce file size
  // JPEG is much smaller than PNG (typically 70-90% reduction)
  // Quality: 0-100, where 80 provides good balance between quality and size
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, { 
      format: 'jpeg', 
      quality: 80 
    }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(dataUrl);
      }
    });
  });
}

/**
 * Converts data URL to base64 string (removes data URL prefix)
 * @param {string} dataUrl - Data URL from screenshot (e.g., "data:image/jpeg;base64,...")
 * @returns {string} Base64 encoded image string
 */
function convertDataUrlToBase64(dataUrl) {
  // Extract base64 portion from data URL
  // Input: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  // Output: "/9j/4AAQSkZJRg..." (just the base64 part)
  
  const base64Index = dataUrl.indexOf('base64,');
  if (base64Index === -1) {
    throw new Error('Invalid data URL format');
  }
  return dataUrl.substring(base64Index + 7);
}

/**
 * Sends base64 image to backend API
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<Object>} API response with detection results
 */
async function sendToBackend(base64Image) {
  // Send POST request to backend API
  const payload = {
    image: base64Image,
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending to backend:', error);
    throw error;
  }
}

