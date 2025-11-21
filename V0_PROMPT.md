# v0 Prompt for Deepfake Detection Dashboard

## Project Overview
Create a Next.js dashboard application that displays deepfake detection results from a MongoDB database. The backend API is already built and running on Express.js.

## Backend API Information

### Base URL
- **Local Development**: `http://localhost:3000`
- The backend runs on port 3000 by default

### API Endpoints

#### 1. Health Check
- **GET** `/health`
- Returns: `{ status: "ok", timestamp: "ISO_string" }`

#### 2. Get Detection Results
- **GET** `/api/deepfake/results`
- **Query Parameters** (optional):
  - `limit`: Number of results to return (default: 50)
  - `sort`: Sort order (`asc` or `desc`, default: `desc`)
  - `startDate`: Filter by start date (ISO string)
  - `endDate`: Filter by end date (ISO string)
- **Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "object_id",
      "deepfakePercentage": 0.164052769541740,
      "confidence": 0.8744686245918274,
      "createdAt": "2024-11-21T12:42:07.000Z",
      "updatedAt": "2024-11-21T12:42:07.000Z"
    }
  ],
  "total": 100
}
```

## MongoDB Schema

### Collection: `deepfakedetections` (Mongoose model name: `DeepfakeDetection`)

Each document has the following structure:
```typescript
{
  _id: ObjectId,
  deepfakePercentage: number,  // 0-1 (e.g., 0.164 = 16.4% fake probability)
  confidence: number,           // 0-1 (e.g., 0.874 = 87.4% confidence)
  createdAt: Date,              // Auto-generated timestamp
  updatedAt: Date               // Auto-generated timestamp (from timestamps option)
}
```

### Field Details:
- **deepfakePercentage**: Number between 0-1, represents probability that image is a deepfake
  - 0 = Definitely real
  - 1 = Definitely fake
  - Example: 0.164 = 16.4% chance it's a deepfake
- **confidence**: Number between 0-1, represents model's confidence in the detection
  - 0 = No confidence
  - 1 = Complete confidence
  - Example: 0.874 = 87.4% confidence
- **createdAt**: ISO date string when the detection was performed
- **updatedAt**: ISO date string when the document was last updated

## Required Features

### 1. Dashboard Overview Page
- **Statistics Cards**:
  - Total detections count
  - Average fake probability percentage
  - Average confidence percentage
  - Recent detections (last 24 hours count)
- **Visual Indicators**:
  - Color-coded cards (green for low fake probability, red for high)
  - Trend indicators (up/down arrows if comparing to previous period)

### 2. Detection Results Table
- **Columns**:
  - Date/Time (formatted: "Nov 21, 2024 12:42 PM")
  - Fake Probability (display as percentage: "16.40%")
  - Confidence (display as percentage: "87.45%")
  - Status Badge:
    - "Likely Real" (green) if fakeProbability < 0.4
    - "Uncertain" (yellow) if 0.4 <= fakeProbability <= 0.7
    - "Likely Deepfake" (red) if fakeProbability > 0.7
- **Features**:
  - Sortable columns (by date, fake probability, confidence)
  - Pagination (10, 25, 50, 100 per page)
  - Search/filter by date range
  - Export to CSV functionality

### 3. Charts & Visualizations
- **Line Chart**: Fake probability over time (time series)
- **Bar Chart**: Distribution of fake probabilities (buckets: 0-20%, 20-40%, 40-60%, 60-80%, 80-100%)
- **Confidence Distribution**: Histogram showing confidence scores
- **Trend Analysis**: Compare current period vs previous period

### 4. Individual Detection Detail View
- Show full details of a single detection
- Display formatted values with proper percentages
- Show timestamp in readable format
- Navigation back to list

## Design Requirements

### Color Scheme
- **Primary**: Blue (#2196F3 or similar)
- **Success/Low Risk**: Green (#4CAF50)
- **Warning/Medium Risk**: Yellow/Orange (#FF9800)
- **Danger/High Risk**: Red (#F44336)
- **Background**: Light gray (#F5F5F5)
- **Cards**: White with subtle shadows

### UI/UX Guidelines
- Modern, clean design with good spacing
- Responsive layout (mobile, tablet, desktop)
- Loading states for async operations
- Error handling with user-friendly messages
- Smooth transitions and animations
- Accessible (proper contrast, keyboard navigation)

### Component Structure
- Use Next.js 14+ with App Router
- Server components for data fetching where possible
- Client components for interactive elements
- Use a UI library like shadcn/ui, Tailwind CSS, or similar
- TypeScript for type safety

## Technical Requirements

### Data Fetching
- Use Next.js API routes or Server Actions to fetch from backend
- Handle CORS (backend already has CORS enabled)
- Implement proper error handling
- Add loading states
- Cache data appropriately

### State Management
- Use React hooks for local state
- Consider Zustand or Context API for global state if needed
- Handle pagination state
- Manage filter/search state

### Environment Variables
- Create `.env.local` for Next.js:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:3000
  ```

## Example Data Structure

```typescript
interface DetectionResult {
  _id: string;
  deepfakePercentage: number;  // 0-1
  confidence: number;           // 0-1
  createdAt: string;            // ISO date string
  updatedAt: string;            // ISO date string
}

interface ApiResponse {
  success: boolean;
  data: DetectionResult[];
  total?: number;
}
```

## Additional Notes

1. **Backend Endpoint**: The GET endpoint at `/api/deepfake/results` is already created and available. It supports query parameters for filtering and pagination.

2. **Date Formatting**: Use a library like `date-fns` or `dayjs` for date formatting

3. **Charts**: Consider using `recharts`, `chart.js`, or `visx` for visualizations

4. **Tables**: Use a library like `@tanstack/react-table` for advanced table features

5. **Styling**: Tailwind CSS is recommended for rapid development

## Sample API Call

```typescript
// Fetch detection results
const response = await fetch('http://localhost:3000/api/deepfake/results?limit=50&sort=desc');
const data = await response.json();
// data.data contains array of DetectionResult objects
```

---

**Note**: The backend GET endpoint for retrieving results needs to be created. The backend currently only has a POST endpoint for creating detections. You'll need to add a GET route that uses `getDetectionResults()` from the models.

