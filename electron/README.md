# Electron Desktop Application

This directory contains the Electron desktop application for Deep Shield.

## Setup

1. Install dependencies from the root directory:
```bash
npm install
```

2. Make sure backend dependencies are installed:
```bash
cd backend && npm install && cd ..
```

3. Make sure frontend dependencies are installed:
```bash
cd frontend && pnpm install && cd ..
```

4. Configure environment variables:
   - Create/update `backend/.env` with your MongoDB URI and NVIDIA API key
   - The backend will run on port 3000 (default)
   - The frontend should run on port 3001

## Running the Application

### Development Mode

1. Start the frontend (Next.js dashboard) in one terminal:
```bash
cd frontend && pnpm dev
```

2. Start the Electron app in another terminal:
```bash
npm run electron:dev
```

The Electron app will:
- Start the embedded Express backend server automatically
- Create a system tray icon
- Register the global shortcut `Cmd+Shift+A` (or `Ctrl+Shift+A` on Windows/Linux)

### Usage

1. **Global Shortcut**: Press `Cmd+Shift+A` (or `Ctrl+Shift+A`) from anywhere to open the source selector
2. **System Tray**: Right-click the tray icon to access:
   - Open Dashboard
   - Capture & Analyze
   - Quit
3. **Source Selection**: When the selector window opens:
   - Select a window or screen to capture
   - The app will automatically capture and analyze
   - Results will be shown in a notification
   - Click the notification to open the dashboard

## Features

- **Global Keyboard Shortcut**: `Cmd+Shift+A` works system-wide
- **System Tray Integration**: App runs in background
- **Window/Screen Selection**: Choose what to capture
- **Video Call Detection**: Automatically highlights video call windows
- **Notifications**: Shows analysis results as system notifications
- **Dashboard Access**: Open dashboard in Electron window or external browser
- **Embedded Backend**: Express server runs automatically with the app

## File Structure

- `main.js` - Main Electron process (window management, backend, shortcuts)
- `preload.js` - Secure IPC bridge for renderer process
- `capture.js` - Screenshot/video capture utilities
- `window-selector.html` - Source selector UI
- `window-selector.js` - Selector logic
- `window-selector.css` - Selector styles

## Building for Distribution

```bash
npm run electron:build
```

This will create distributable packages in the `dist/` directory.

## Troubleshooting

### Backend Port Already in Use
If port 3000 is already in use, the embedded backend will fail to start. Either:
- Stop the existing backend server, or
- Change the port in `backend/.env`

### Global Shortcut Not Working
- On macOS, you may need to grant accessibility permissions
- On Linux, you may need to install additional packages
- Try restarting the app

### No Sources Available
- Make sure you have windows open
- Grant screen recording permissions (macOS)
- Try refreshing the source list

Fix latency problems when starting the program, as it takes about 30 seconds for it to fully load and allow users to make use of the snippet tool.