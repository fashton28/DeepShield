# Deepfake Detection Chrome Extension

A Chrome Extension (Manifest V3) that captures screenshots from Google Meet calls and sends them to a backend API for deepfake detection using NVIDIA Hive API.

## Project Structure

```
chrome-extension/
├── manifest.json          # Manifest V3 configuration
├── background.js          # Service worker for screenshot capture
├── content.js             # Content script injected into Google Meet
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic and UI interactions
├── popup.css              # Popup styling
├── icons/                 # Extension icons (16x16, 48x48, 128x128)
└── README.md              # This file
```

## Setup Instructions

### 1. Create Icons

Add icon files to the `icons/` directory:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

See `icons/README.md` for instructions.

### 2. Configure Backend URL

Edit `background.js` and update the `BACKEND_URL` constant:

```javascript
const BACKEND_URL = 'http://localhost:3000/api/deepfake'; // Replace with your actual backend URL
```

### 3. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` directory
5. The extension should now appear in your extensions list

### 4. Test the Extension

1. Navigate to `https://meet.google.com/` (or join a meeting)
2. Click the extension icon in the Chrome toolbar
3. Click "Capture & Analyze" button
4. The extension will capture a screenshot and send it to your backend

## How It Works

### Communication Flow

1. **User clicks "Capture & Analyze"** → Popup sends message to background service worker
2. **Background service worker** → Captures visible tab screenshot using `chrome.tabs.captureVisibleTab()`
3. **Background service worker** → Converts screenshot to base64
4. **Background service worker** → Sends POST request to backend API with base64 image
5. **Backend** → Receives image, calls NVIDIA Hive API for deepfake detection
6. **Backend** → Saves result to MongoDB
7. **Backend** → Returns result to extension
8. **Popup** → Displays detection results (fake probability, confidence, etc.)

### Message Passing

- **Popup → Background**: `{ action: 'captureAndAnalyze' }`
- **Background → Backend**: HTTP POST with `{ image: "<base64>", timestamp: "<ISO>" }`
- **Background → Popup**: `{ success: true, result: {...} }` or `{ success: false, error: "..." }`

## Backend API Requirements

Your backend should accept POST requests at the configured endpoint:

```
POST /api/deepfake
Content-Type: application/json

Body:
{
  "image": "<base64_encoded_screenshot>",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

The backend should:
1. Receive the base64 image
2. Determine if image is < 180KB (base64 length < 180,000 chars)
3. Call NVIDIA Hive API:
   - Small images: Send directly as `data:image/jpeg;base64,${imageB64}`
   - Large images: Upload to asset storage first, then use asset_id
4. Process response
5. Save to MongoDB
6. Return result to extension

## Permissions

- `activeTab`: Required to capture visible tab screenshots
- `tabs`: Required to get active tab information
- `https://meet.google.com/*`: Required for content script injection

## Development Notes

- The extension uses Manifest V3 (service worker instead of background page)
- Screenshot capture uses `chrome.tabs.captureVisibleTab()` API
- All API calls are made from the background service worker (not popup)
- Error handling is implemented at each step of the flow

## Next Steps

1. ✅ Create extension skeleton files
2. ⏳ Add icon files
3. ⏳ Implement backend API endpoint
4. ⏳ Test screenshot capture
5. ⏳ Test backend integration
6. ⏳ Adjust UI based on actual API response format
7. ⏳ Add error handling improvements
8. ⏳ Add result history/caching (optional)

## Troubleshooting

- **Extension not loading**: Check `manifest.json` for syntax errors
- **Screenshot not working**: Ensure you're on a Google Meet page and have granted permissions
- **Backend connection failed**: Verify `BACKEND_URL` is correct and backend is running
- **CORS errors**: Ensure your backend allows requests from Chrome extension origins

