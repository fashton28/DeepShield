// Window Selector Logic

// Import capture utilities (inline since ES modules in Electron renderer can be tricky)
async function captureSource(sourceId, backendPort = 3000) {
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

function isVideoCallApp(name) {
  const videoCallKeywords = ['zoom', 'meet', 'teams', 'webex', 'skype', 'discord', 'facetime'];
  const lowerName = name.toLowerCase();
  return videoCallKeywords.some(keyword => lowerName.includes(keyword));
}

// UI Elements
const sourcesContainer = document.getElementById('sources-container');
const loading = document.getElementById('loading');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const refreshBtn = document.getElementById('refresh-btn');
const cancelBtn = document.getElementById('cancel-btn');
const results = document.getElementById('results');
const resultsContent = document.getElementById('results-content');

let selectedSourceId = null;
let sources = [];

// Update status
function updateStatus(type, text) {
  statusIndicator.className = 'status-indicator';
  statusIndicator.classList.add(type);
  statusText.textContent = text;
}

// Load available sources
async function loadSources() {
  try {
    updateStatus('loading', 'Loading sources...');
    loading.style.display = 'block';
    sourcesContainer.innerHTML = '';

    const sourcesList = await window.electronAPI.getSources();
    sources = sourcesList;

    if (sources.length === 0) {
      sourcesContainer.innerHTML = '<div class="loading">No sources available</div>';
      updateStatus('error', 'No sources found');
      return;
    }

    displaySources(sources);
    updateStatus('success', `${sources.length} source(s) available`);
  } catch (error) {
    console.error('Error loading sources:', error);
    sourcesContainer.innerHTML = `<div class="loading" style="color: #dc3545;">Error loading sources: ${error.message}</div>`;
    updateStatus('error', 'Failed to load sources');
  } finally {
    loading.style.display = 'none';
  }
}

// Display sources in grid
function displaySources(sourcesList) {
  const grid = document.createElement('div');
  grid.className = 'source-grid';

  // Sort sources: video call apps first, then by name
  const sortedSources = [...sourcesList].sort((a, b) => {
    const aIsVideoCall = isVideoCallApp(a.name);
    const bIsVideoCall = isVideoCallApp(b.name);
    
    if (aIsVideoCall && !bIsVideoCall) return -1;
    if (!aIsVideoCall && bIsVideoCall) return 1;
    return a.name.localeCompare(b.name);
  });

  sortedSources.forEach(source => {
    const item = document.createElement('div');
    item.className = 'source-item';
    if (isVideoCallApp(source.name)) {
      item.classList.add('video-call');
    }

    const thumbnail = document.createElement('img');
    thumbnail.className = 'source-thumbnail';
    thumbnail.src = source.thumbnail.toDataURL();
    thumbnail.alt = source.name;

    const name = document.createElement('div');
    name.className = 'source-name';
    name.textContent = source.name;

    const type = document.createElement('div');
    type.className = 'source-type';
    type.textContent = source.id.startsWith('screen') ? 'Screen' : 'Window';

    item.appendChild(thumbnail);
    item.appendChild(name);
    item.appendChild(type);

    if (isVideoCallApp(source.name)) {
      const badge = document.createElement('span');
      badge.className = 'video-call-badge';
      badge.textContent = 'Video Call';
      item.appendChild(badge);
    }

    item.addEventListener('click', () => {
      // Remove previous selection
      document.querySelectorAll('.source-item').forEach(el => {
        el.classList.remove('selected');
      });
      
      // Select this item
      item.classList.add('selected');
      selectedSourceId = source.id;
      
      // Enable capture button if exists, or auto-capture
      captureAndAnalyze();
    });

    grid.appendChild(item);
  });

  sourcesContainer.innerHTML = '';
  sourcesContainer.appendChild(grid);
}

// Capture and analyze selected source
async function captureAndAnalyze() {
  if (!selectedSourceId) {
    updateStatus('error', 'Please select a source first');
    return;
  }

  try {
    updateStatus('loading', 'Capturing and analyzing...');
    results.style.display = 'none';

    // Get backend port from IPC
    const captureInfo = await window.electronAPI.captureSource(selectedSourceId);
    
    if (!captureInfo.success) {
      throw new Error(captureInfo.error || 'Failed to initiate capture');
    }

    // Perform capture in renderer process
    const result = await captureSource(selectedSourceId, captureInfo.port || 3000);

    // Display results
    displayResults(result);

    // Notify main process
    await window.electronAPI.analysisComplete(result);

    updateStatus('success', 'Analysis complete');
    
    // Optionally close window after a delay (user can close manually if they want to see results)
    // setTimeout(() => {
    //   window.electronAPI.closeWindow();
    // }, 3000);
  } catch (error) {
    console.error('Error capturing/analyzing:', error);
    updateStatus('error', `Error: ${error.message}`);
    results.style.display = 'block';
    resultsContent.innerHTML = `<div style="color: #dc3545;">Error: ${error.message}</div>`;
  }
}

// Display analysis results
function displayResults(result) {
  const { fake_probability, confidence, bounding_boxes, timestamp } = result;
  
  const fakePercent = (fake_probability * 100).toFixed(2);
  const confPercent = (confidence * 100).toFixed(2);
  
  let status = 'authentic';
  let statusText = 'Authentic';
  if (fake_probability > 0.7) {
    status = 'deepfake';
    statusText = 'Likely Deepfake';
  } else if (fake_probability > 0.4) {
    status = 'uncertain';
    statusText = 'Uncertain';
  }

  resultsContent.innerHTML = `
    <div class="result-status ${status}">${statusText}</div>
    <div class="result-item">
      <span class="result-label">Fake Probability:</span>
      <span class="result-value">${fakePercent}%</span>
    </div>
    <div class="result-item">
      <span class="result-label">Confidence:</span>
      <span class="result-value">${confPercent}%</span>
    </div>
    <div class="result-item">
      <span class="result-label">Faces Detected:</span>
      <span class="result-value">${bounding_boxes?.length || 0}</span>
    </div>
    <div class="result-item">
      <span class="result-label">Timestamp:</span>
      <span class="result-value">${new Date(timestamp || Date.now()).toLocaleString()}</span>
    </div>
  `;

  results.style.display = 'block';
}

// Event listeners
refreshBtn.addEventListener('click', loadSources);
cancelBtn.addEventListener('click', () => {
  window.electronAPI.closeWindow();
});

// Load sources on page load
loadSources();

