// Content Script for Google Meet
// Injected into https://meet.google.com/* pages
// Currently minimal - reserved for future enhancements

console.log('Deepfake Detection extension content script loaded');

// TODO: Future enhancements
// - Detect if video is active/playing
// - Extract video element for frame capture
// - Monitor meeting state changes
// - Provide video element coordinates for selective screenshot

/**
 * Checks if a video element is present and active
 * @returns {boolean} True if video is detected
 */
function hasActiveVideo() {
  // TODO: Implement video detection logic
  const videoElements = document.querySelectorAll('video');
  return videoElements.length > 0;
}

// Listen for messages from background script if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkVideoStatus') {
    sendResponse({ hasVideo: hasActiveVideo() });
  }
  return true;
});

