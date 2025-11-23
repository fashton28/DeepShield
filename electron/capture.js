// Capture utilities for Electron (Renderer Process)
// This file is used in the renderer process (window-selector.js)

/**
 * Captures a screenshot from a specific source and sends it to the backend API
 * This function runs in the renderer process where DOM APIs are available
 * @param {string} sourceId - The ID of the source to capture
 * @param {number} backendPort - Port where backend is running
 * @returns {Promise<Object>} Analysis result from backend
 */
export async function captureSource(sourceId, backendPort = 3000) {
  try {
    // Get the stream from the source
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId
        }
      }
    });

    // Create video element to capture frame
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;

    // Wait for video to be ready
    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.width = video.videoWidth;
        video.height = video.videoHeight;
        resolve();
      };
    });

    // Create canvas to capture frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Stop the stream
    stream.getTracks().forEach(track => track.stop());

    // Convert canvas to base64 (JPEG format, quality 80)
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);
    
    // Extract base64 data (remove data URL prefix)
    const base64Data = base64Image.split(',')[1];

    // Send to backend API
    const response = await fetch(`http://localhost:${backendPort}/api/deepfake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: base64Data,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success && result.result) {
      return result.result;
    }
    
    return result;
  } catch (error) {
    console.error('Error capturing source:', error);
    throw error;
  }
}

/**
 * Detects if a source is a video call application
 * @param {string} name - Source name
 * @returns {boolean}
 */
export function isVideoCallApp(name) {
  const videoCallKeywords = ['zoom', 'meet', 'teams', 'webex', 'skype', 'discord', 'facetime'];
  const lowerName = name.toLowerCase();
  return videoCallKeywords.some(keyword => lowerName.includes(keyword));
}

