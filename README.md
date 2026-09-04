# Deep Shield

**Deep Shield** is a comprehensive deepfake detection platform designed for interviewers to verify the authenticity of candidates during video calls. The platform combines real-time deepfake detection with a powerful dashboard for analyzing detection results.

## Features

* **Real-time Deepfake Detection**: Capture and analyze screenshots from Google Meet calls using NVIDIA Hive AI
* **Chrome Extension**: Seamless integration with Google Meet for instant detection
* **Analytics Dashboard**: Comprehensive dashboard with charts, statistics, and detection history
* **MongoDB Storage**: Persistent storage of all detection results for analysis
* **Modern UI**: Beautiful, responsive Next.js dashboard with real-time data visualization

## Architecture

Deep Shield consists of three main components:

1. **Chrome Extension** - Captures screenshots from Google Meet and sends them for analysis
2. **Backend API** - Express.js server that processes images using NVIDIA Hive API and stores results in MongoDB
3. **Frontend Dashboard** - Next.js application for viewing and analyzing detection results

## Tech Stack

### Backend

* **Node.js** with Express.js
* **MongoDB** with Mongoose
* **NVIDIA Hive API** for deepfake detection
* **RESTful API** architecture

### Frontend

* **Next.js 15** with React 19
* **TypeScript** for type safety
* **Tailwind CSS** for styling
* **Recharts** for data visualization
* **shadcn/ui** components

### Chrome Extension

* **Manifest V3**
* **Service Worker** for background processing
* **Content Scripts** for Google Meet integration

## Prerequisites

Before you begin, ensure you have the following installed:

* **Node.js** (v18 or higher)
* **pnpm** (or npm/yarn)
* **MongoDB** (local installation or MongoDB Atlas account)
* **Chrome Browser** (for the extension)
* **NVIDIA API Key** (for deepfake detection)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/fashton28/DeepShield.git
cd DeepShield
```

### 2. Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/deepfake-detection
NVIDIA_API_KEY=your_nvidia_api_key_here
```

#### Start the Backend Server

```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend will start on `http://localhost:3000`

### 3. Frontend Setup

#### Install Dependencies

```bash
cd frontend
pnpm install
```

#### Configure Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### Start the Frontend Development Server

```bash
pnpm dev
```

The frontend will start on `http://localhost:3001` (or the next available port)

### 4. Chrome Extension Setup

#### Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in the top right)
3. Click **"Load unpacked"**
4. Select the `chrome-extension` directory from this project
5. The extension should now appear in your extensions list

#### Add Extension Icons (Optional)

The extension requires icon files. Create or add the following to `chrome-extension/icons/`:

* `icon16.png` (16x16 pixels)
* `icon48.png` (48x48 pixels)
* `icon128.png` (128x128 pixels)

See `chrome-extension/icons/README.md` for more details.

## Usage

### Using the Chrome Extension

1. Navigate to `https://meet.google.com/` and join or start a meeting
2. Click the Deep Shield extension icon in your Chrome toolbar
3. Click **"Capture & Analyze"** to capture a screenshot and analyze it
4. View the results showing:

   * Fake Probability percentage
   * Confidence score
   * Status (Likely Real, Uncertain, or Likely Deepfake)

### Using the Dashboard

1. Open the dashboard at `http://localhost:3001/dashboard`
2. View real-time statistics:

   * Average Deepfake Percentage
   * Total Detections
   * Authentic Detections
   * Recent Activity (last 24 hours)
3. Explore charts and visualizations:

   * Deepfake Detection Trend (line chart)
   * Fake Probability Distribution (bar chart)
4. Review detection history in the table with:

   * Date and time
   * Fake probability and confidence scores
   * Status indicators

## Project Structure

```text
DeepShield/
├── backend/                 # Express.js backend API
│   ├── db/                 # MongoDB models and connection
│   │   ├── connection.js   # Database connection
│   │   └── models.js       # Mongoose schemas
│   ├── routes/             # API routes
│   │   └── deepfake.js     # Deepfake detection endpoints
│   ├── services/           # Business logic
│   │   └── hiveService.js  # NVIDIA Hive API integration
│   ├── server.js           # Express server entry point
│   └── package.json        # Backend dependencies
│
├── frontend/               # Next.js frontend
│   ├── app/               # Next.js app router
│   │   ├── dashboard/     # Dashboard page
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Landing page
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── header.tsx    # Navigation header
│   │   └── hero-content.tsx # Landing page hero
│   ├── lib/              # Utilities
│   │   └── api.ts        # API client functions
│   └── package.json      # Frontend dependencies
│
├── chrome-extension/      # Chrome extension
│   ├── manifest.json     # Extension manifest
│   ├── background.js     # Service worker
│   ├── content.js        # Content script
│   ├── popup.html        # Extension popup UI
│   ├── popup.js          # Popup logic
│   ├── popup.css         # Popup styles
│   └── icons/            # Extension icons
│
└── README.md             # This file
```

## API Endpoints

### Deepfake Detection

#### POST `/api/deepfake`

Analyze an image for deepfake detection.

**Request:**

```json
{
  "image": "<base64_encoded_image>",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Response:**

```json
{
  "success": true,
  "result": {
    "fake_probability": 0.164,
    "confidence": 0.874,
    "bounding_boxes": [...],
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### GET `/api/deepfake/results`

Get detection results from the database.

**Query Parameters:**

* `limit` (optional): Number of results (default: 50)
* `sort` (optional): Sort order - `asc` or `desc` (default: `desc`)
* `startDate` (optional): Filter by start date (ISO string)
* `endDate` (optional): Filter by end date (ISO string)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "deepfakePercentage": 0.164,
      "confidence": 0.874,
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "total": 100,
  "limit": 50
}
```

### Health Check

#### GET `/health`

Check if the server is running.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Database Schema

### DeepfakeDetection Collection

```javascript
{
  _id: ObjectId,
  deepfakePercentage: Number,  // 0-1 (probability of being fake)
  confidence: Number,           // 0-1 (model confidence)
  createdAt: Date,
  updatedAt: Date
}
```

## Configuration

### Backend Configuration

* **PORT**: Server port (default: 3000)
* **MONGODB_URI**: MongoDB connection string
* **NVIDIA_API_KEY**: Your NVIDIA Hive API key

### Frontend Configuration

* **NEXT_PUBLIC_API_URL**: Backend API URL (default: http://localhost:3000)

### Chrome Extension Configuration

* **BACKEND_URL**: Backend API endpoint (configured in `background.js`)

## Troubleshooting

### Backend Issues

**MongoDB Connection Error:**

* Verify your `MONGODB_URI` in `.env` is correct
* Ensure MongoDB is running (local) or your Atlas cluster is accessible
* Check network connectivity

**NVIDIA API Errors:**

* Verify your `NVIDIA_API_KEY` is correct and has proper permissions
* Check API rate limits
* Ensure image size is within limits (< 180KB base64 for direct upload)

### Frontend Issues

**API Connection Errors:**

* Verify `NEXT_PUBLIC_API_URL` matches your backend URL
* Ensure the backend server is running
* Check CORS settings in the backend

**No Data Displayed:**

* Check browser console for errors
* Verify backend API is returning data
* Check network tab for failed requests

### Chrome Extension Issues

**Extension Not Loading:**

* Ensure all required files are present
* Check `manifest.json` for syntax errors
* Verify icons are in the correct location

**Screenshot Not Working:**

* Ensure you're on a Google Meet page
* Check browser permissions for the extension
* Verify the backend URL is correct in `background.js`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch:
   `git push origin feature/AmazingFeature`
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

* **NVIDIA Hive API** for deepfake detection capabilities
* **Next.js** and **React** communities
* **shadcn/ui** for beautiful UI components

## Support

For issues, questions, or contributions, please open an issue on the [GitHub repository](https://github.com/fashton28/DeepShield).

---

**Built for reliable candidate verification**
