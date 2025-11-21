# Deepfake Detection Backend

Express.js backend API for processing deepfake detection requests from the Chrome extension using NVIDIA Hive API.

## Project Structure

```
backend/
├── server.js              # Express server entry point
├── package.json           # Dependencies and scripts
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore file
├── db/
│   ├── connection.js     # MongoDB connection logic
│   └── models.js         # MongoDB models/schemas (placeholder)
├── routes/
│   └── deepfake.js       # Deepfake detection API route
├── services/
│   └── hiveService.js    # NVIDIA Hive API integration
└── README.md             # This file
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env`:
- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `NVIDIA_API_KEY`: Your NVIDIA API key (already set in example)

### 3. Start MongoDB

Make sure MongoDB is running locally, or update `MONGODB_URI` to point to your MongoDB instance/Atlas cluster.

### 4. Run the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## API Endpoints

### POST /api/deepfake

Receives base64 image from Chrome extension and processes it through NVIDIA Hive API.

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
    "fake_probability": 0.85,
    "confidence": 0.92,
    "timestamp": "2024-01-01T12:00:00.000Z",
    "raw_response": { ... }
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## How It Works

1. **Extension sends request** → POST to `/api/deepfake` with base64 image
2. **Backend validates** → Checks for required fields and valid format
3. **NVIDIA Hive API call**:
   - Small images (< 180KB base64): Sent directly
   - Large images: Uploaded to asset storage first, then referenced
4. **Process response** → Extracts fake probability and confidence
5. **Save to MongoDB** → Stores detection result with metadata
6. **Return result** → Sends formatted response back to extension

## NVIDIA Hive API Integration

The service automatically handles:
- Small images: Direct base64 transmission
- Large images: Asset upload to NVIDIA storage, then asset_id reference
- Error handling and retries
- API authentication with Bearer token

## MongoDB Schema

The MongoDB schema is a placeholder in `db/models.js`. You'll need to:

1. Define your collection structure
2. Implement the `saveDetectionResult()` function with your schema
3. Adjust `extractFakeProbability()` and `extractConfidence()` based on actual NVIDIA API response format

Suggested schema fields:
- `timestamp`: Date of detection
- `image_size`: Size of base64 image
- `fake_probability`: Probability that image is fake (0-1)
- `confidence`: Confidence score (0-1)
- `raw_response`: Full API response
- `created_at`: Document creation timestamp
- `updated_at`: Document update timestamp

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/deepfake-detection` |
| `NVIDIA_API_KEY` | NVIDIA Hive API key | (required) |

## Dependencies

- **express**: Web framework
- **mongodb**: MongoDB driver
- **dotenv**: Environment variable management
- **cors**: CORS middleware
- **node-fetch**: HTTP client (built-in fetch in Node.js 18+)

## Troubleshooting

- **MongoDB connection failed**: Check `MONGODB_URI` and ensure MongoDB is running
- **NVIDIA API errors**: Verify `NVIDIA_API_KEY` is correct and has proper permissions
- **Large image upload fails**: Check network connectivity and NVIDIA API limits
- **CORS errors**: Ensure CORS middleware is properly configured

## Next Steps

1. ✅ Create backend structure
2. ⏳ Test API endpoint with sample requests
3. ⏳ Verify NVIDIA Hive API response format
4. ⏳ Implement actual MongoDB schema
5. ⏳ Adjust result extraction based on actual API response
6. ⏳ Add request validation and rate limiting
7. ⏳ Add logging and monitoring

