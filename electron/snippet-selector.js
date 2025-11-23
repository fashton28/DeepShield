// Screen Snippet Selector
let isSelecting = false;
let startX = 0;
let startY = 0;
let selectionBox = null;
let overlay = null;
let screenSourceId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  selectionBox = document.getElementById('selection-box');
  overlay = document.getElementById('overlay');

  // Get screen source
  try {
    const sources = await window.electronAPI.getSources();
    const screenSource = sources.find(s => s.id.startsWith('screen'));
    if (screenSource) {
      screenSourceId = screenSource.id;
    }
  } catch (error) {
    console.error('Error getting sources:', error);
  }

  // Mouse down - start selection
  document.addEventListener('mousedown', (e) => {
    isSelecting = true;
    // Store both screen and client coordinates
    startX = e.screenX;
    startY = e.screenY;
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    
    selectionBox.style.display = 'block';
    selectionBox.style.left = startClientX + 'px';
    selectionBox.style.top = startClientY + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
  });

  // Mouse move - update selection
  document.addEventListener('mousemove', (e) => {
    if (!isSelecting) return;

    const currentX = e.screenX;
    const currentY = e.screenY;

    // Calculate screen coordinates
    const screenLeft = Math.min(startX, currentX);
    const screenTop = Math.min(startY, currentY);
    const screenWidth = Math.abs(currentX - startX);
    const screenHeight = Math.abs(currentY - startY);

    // Update visual selection box (use client coordinates for display)
    // Since window is fullscreen, clientX/Y should align with screenX/Y
    const clientLeft = Math.min(e.clientX, e.clientX - (currentX - startX));
    const clientTop = Math.min(e.clientY, e.clientY - (currentY - startY));
    
    selectionBox.style.left = clientLeft + 'px';
    selectionBox.style.top = clientTop + 'px';
    selectionBox.style.width = screenWidth + 'px';
    selectionBox.style.height = screenHeight + 'px';
  });

  // Mouse up - finish selection
  document.addEventListener('mouseup', async (e) => {
    if (!isSelecting) return;
    isSelecting = false;

    const currentX = e.screenX;
    const currentY = e.screenY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    // Only capture if selection is large enough
    if (width > 10 && height > 10) {
      await captureRegion(left, top, width, height);
    }

    // Close window
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  });

  // ESC to cancel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (window.electronAPI) {
        window.electronAPI.closeWindow();
      }
    }
  });
});

// Capture the selected region
async function captureRegion(x, y, width, height) {
  try {
    if (!screenSourceId) {
      const sources = await window.electronAPI.getSources();
      const screenSource = sources.find(s => s.id.startsWith('screen'));
      if (!screenSource) {
        throw new Error('No screen source found');
      }
      screenSourceId = screenSource.id;
    }

    // Get the screen stream
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: screenSourceId
        }
      }
    });

    // Create video element
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;

    // Wait for video to be ready
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.width = video.videoWidth;
        video.height = video.videoHeight;
        resolve();
      };
      video.onerror = reject;
      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Video load timeout')), 5000);
    });

    // Wait a bit for the video to actually render a frame
    await new Promise(resolve => setTimeout(resolve, 100));

    // Create canvas to capture the full screen first
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = video.videoWidth;
    fullCanvas.height = video.videoHeight;
    const fullCtx = fullCanvas.getContext('2d');
    
    // Draw the full video to canvas
    fullCtx.drawImage(video, 0, 0, fullCanvas.width, fullCanvas.height);

    // Stop the stream
    stream.getTracks().forEach(track => track.stop());

    // Now create a canvas for the selected region
    const regionCanvas = document.createElement('canvas');
    regionCanvas.width = width;
    regionCanvas.height = height;
    const regionCtx = regionCanvas.getContext('2d');

    // Crop the selected region from the full screen canvas
    // The coordinates are in screen pixels, and the fullCanvas is the full screen
    // So we can directly use x, y, width, height
    regionCtx.drawImage(
      fullCanvas,
      x, y, width, height,  // Source region (screen coordinates)
      0, 0, width, height   // Destination (canvas)
    );

    // Convert to base64
    const base64Image = regionCanvas.toDataURL('image/jpeg', 0.8);
    const base64Data = base64Image.split(',')[1];

    // Send to backend API
    const backendPort = await window.electronAPI.getBackendPort();
    
    // Check if backend is reachable first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const healthCheck = await fetch(`http://localhost:${backendPort}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!healthCheck.ok) {
        throw new Error('Backend server is not responding');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Backend server is not responding on port ${backendPort}. Please ensure the backend is started.`);
      }
      throw new Error(`Backend server is not running on port ${backendPort}. Please ensure the backend is started.`);
    }

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
      const errorText = await response.text();
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();

    if (result.success && result.result) {
      // Notify main process with results
      await window.electronAPI.analysisComplete(result.result);
    } else {
      throw new Error('Invalid response from backend');
    }
  } catch (error) {
    console.error('Error capturing region:', error);
    // Show error notification
    if (window.electronAPI) {
      await window.electronAPI.showError(error.message || 'Failed to capture and analyze');
    }
  }
}

