// Popup Script for Deepfake Detection Extension
// Handles UI interactions and message passing to background service worker

// UI Elements
const analyzeBtn = document.getElementById('analyze-btn');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const resultsSection = document.getElementById('results-section');
const resultsContent = document.getElementById('results-content');
const errorSection = document.getElementById('error-section');
const errorMessage = document.getElementById('error-message');

/**
 * Updates the status indicator UI
 * @param {string} status - Status type: 'ready', 'analyzing', 'complete', 'error'
 * @param {string} text - Status text to display
 */
function updateStatus(status, text) {
  statusIndicator.className = `status-indicator status-${status}`;
  statusText.textContent = text;
}

/**
 * Displays analysis results in the UI
 * @param {Object} result - Result object from backend API
 */
function displayResults(result) {
  // Parse and display results
  // Result structure from backend:
  // {
  //   fake_probability: number,
  //   confidence: number,
  //   bounding_boxes: array,
  //   timestamp: string,
  //   raw_response: object
  // }
  
  resultsSection.classList.remove('hidden');
  errorSection.classList.add('hidden');
  
  // Debug: log the result to see what we're receiving
  console.log('Displaying results:', result);
  console.log('fake_probability:', result.fake_probability, typeof result.fake_probability);
  console.log('confidence:', result.confidence, typeof result.confidence);
  console.log('bounding_boxes:', result.bounding_boxes);
  
  // Extract values - check both direct properties and raw_response if needed
  let fakeProbValue = result.fake_probability;
  let confidenceValue = result.confidence;
  
  // If values are not in result, try to extract from raw_response or bounding_boxes
  if ((fakeProbValue === undefined || fakeProbValue === null) && result.bounding_boxes && result.bounding_boxes.length > 0) {
    // Get the first bounding box (or highest confidence one)
    const sortedBoxes = [...result.bounding_boxes].sort((a, b) => 
      (b.bbox_confidence || 0) - (a.bbox_confidence || 0)
    );
    fakeProbValue = sortedBoxes[0].is_deepfake;
    confidenceValue = sortedBoxes[0].bbox_confidence;
    console.log('Extracted from bounding_boxes - fakeProbValue:', fakeProbValue, 'confidenceValue:', confidenceValue);
  }
  
  // Ensure values are numbers and format as percentages
  // Convert to number, multiply by 100, round to 2 decimal places
  let fakeProb = 'N/A';
  let confidence = 'N/A';
  
  // Check if value exists (including 0, which is a valid value)
  if (fakeProbValue !== undefined && fakeProbValue !== null && fakeProbValue !== '') {
    const numValue = typeof fakeProbValue === 'string' ? parseFloat(fakeProbValue) : Number(fakeProbValue);
    console.log('fakeProbValue converted:', numValue, 'isNaN:', isNaN(numValue));
    if (!isNaN(numValue) && isFinite(numValue)) {
      fakeProb = (numValue * 100).toFixed(2) + '%';
      console.log('fakeProb formatted:', fakeProb);
    }
  }
  
  if (confidenceValue !== undefined && confidenceValue !== null && confidenceValue !== '') {
    const numValue = typeof confidenceValue === 'string' ? parseFloat(confidenceValue) : Number(confidenceValue);
    console.log('confidenceValue converted:', numValue, 'isNaN:', isNaN(numValue));
    if (!isNaN(numValue) && isFinite(numValue)) {
      confidence = (numValue * 100).toFixed(2) + '%';
      console.log('confidence formatted:', confidence);
    }
  }
  
  console.log('Final values - fakeProb:', fakeProb, 'confidence:', confidence);
  const bboxCount = result.bounding_boxes ? result.bounding_boxes.length : 0;
  
  // Determine status based on fake probability
  let statusClass = 'status-safe';
  let statusText = 'Likely Real';
  if (fakeProbValue !== undefined && fakeProbValue !== null) {
    if (fakeProbValue > 0.7) {
      statusClass = 'status-fake';
      statusText = 'Likely Deepfake';
    } else if (fakeProbValue > 0.4) {
      statusClass = 'status-uncertain';
      statusText = 'Uncertain';
    }
  }
  
  resultsContent.innerHTML = `
    <div class="result-status ${statusClass}">
      <strong>${statusText}</strong>
    </div>
    <div class="result-item">
      <label>Fake Probability:</label>
      <span class="fake-prob-value">${fakeProb}</span>
    </div>
    <div class="result-item">
      <label>Confidence:</label>
      <span>${confidence}</span>
    </div>
    <div class="result-item">
      <label>Faces Detected:</label>
      <span>${bboxCount}</span>
    </div>
    <div class="result-item">
      <label>Timestamp:</label>
      <span>${result.timestamp || new Date().toLocaleString()}</span>
    </div>
    ${bboxCount > 0 ? `
      <div class="bounding-boxes-info">
        <details>
          <summary>Bounding Box Details (${bboxCount})</summary>
          <div class="bbox-list">
            ${result.bounding_boxes.map((box, idx) => `
              <div class="bbox-item">
                <div><strong>Box ${idx + 1}:</strong></div>
                <div>Deepfake: ${((box.is_deepfake || 0) * 100).toFixed(2)}%</div>
                <div>Confidence: ${((box.bbox_confidence || 0) * 100).toFixed(2)}%</div>
              </div>
            `).join('')}
          </div>
        </details>
      </div>
    ` : ''}
    <details class="raw-result-details">
      <summary>Raw Response</summary>
      <pre class="raw-result">${JSON.stringify(result, null, 2)}</pre>
    </details>
  `;
}

/**
 * Displays error message in the UI
 * @param {string} error - Error message to display
 */
function displayError(error) {
  errorSection.classList.remove('hidden');
  resultsSection.classList.add('hidden');
  errorMessage.textContent = error;
}

/**
 * Sends message to background service worker to capture and analyze
 */
async function captureAndAnalyze() {
  try {
    // Update UI to analyzing state
    updateStatus('analyzing', 'Analyzing...');
    analyzeBtn.disabled = true;
    resultsSection.classList.add('hidden');
    errorSection.classList.add('hidden');

    const response = await chrome.runtime.sendMessage({
      action: 'captureAndAnalyze'
    });
    
    if (response.success) {
      updateStatus('complete', 'Analysis Complete');
      // Debug: log the full response
      console.log('Full response from background:', response);
      console.log('Result object:', response.result);
      
      // Handle response structure - result might be nested or direct
      const resultData = response.result || response;
      displayResults(resultData);
    } else {
      updateStatus('error', 'Error');
      displayError(response.error || 'Unknown error occurred');
    }
  } catch (error) {
    console.error('Error in captureAndAnalyze:', error);
    updateStatus('error', 'Error');
    displayError(error.message || 'Failed to analyze screenshot');
  } finally {
    analyzeBtn.disabled = false;
  }
}

// Event Listeners
analyzeBtn.addEventListener('click', captureAndAnalyze);

// Initialize UI state
updateStatus('ready', 'Ready');

