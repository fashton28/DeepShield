// Content Script for Google Meet
// Injected into https://meet.google.com/* pages
// Currently minimal - reserved for future enhancements

console.log('Deepfake Detection extension content script loaded');

// Implemented features:
// - Detect if video is active/playing (isVideoPlaying, hasActiveVideo)
// - Provide video element coordinates for selective screenshot (getVideoInfo)
// TODO: Future enhancements
// - Extract video element for frame capture
// - Monitor meeting state changes

/**
 * Checks if a video element is actively playing
 * @param {HTMLVideoElement} video - Video element to check
 * @returns {boolean} True if the video is actively playing
 */
function isVideoPlaying(video) {
  return !video.paused &&
         !video.ended &&
         video.readyState >= 2 && // HAVE_CURRENT_DATA or higher
         video.videoWidth > 0 &&
         video.videoHeight > 0;
}

/**
 * Checks if a video element is present and active
 * @returns {boolean} True if video is detected
 */
function hasActiveVideo() {
  const videoElements = document.querySelectorAll('video');

  if (videoElements.length === 0) {
    return false;
  }

  // Check if at least one video is actively playing
  for (const video of videoElements) {
    if (isVideoPlaying(video)) {
      return true;
    }
  }

  // Fallback: return true if there are video elements with valid dimensions
  // (they may be paused but still contain analyzable content)
  for (const video of videoElements) {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Gets information about all video elements on the page
 * @returns {Array<Object>} Array of video info objects with coordinates and status
 */
function getVideoInfo() {
  const videoElements = document.querySelectorAll('video');
  const videoInfo = [];

  for (const video of videoElements) {
    const rect = video.getBoundingClientRect();
    videoInfo.push({
      width: video.videoWidth,
      height: video.videoHeight,
      displayWidth: rect.width,
      displayHeight: rect.height,
      x: rect.x,
      y: rect.y,
      isPlaying: isVideoPlaying(video),
      isPaused: video.paused,
      readyState: video.readyState,
      currentTime: video.currentTime,
      duration: video.duration
    });
  }

  return videoInfo;
}

// Listen for messages from background script if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkVideoStatus') {
    sendResponse({ hasVideo: hasActiveVideo() });
  } else if (request.action === 'getVideoInfo') {
    sendResponse({
      hasVideo: hasActiveVideo(),
      videos: getVideoInfo()
    });
  }
  return true;
});

