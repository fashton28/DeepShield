// API utilities for fetching deepfake detection data

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface DetectionResult {
  _id: string;
  deepfakePercentage: number;  // 0-1
  confidence: number;           // 0-1
  createdAt: string;            // ISO date string
  updatedAt: string;            // ISO date string
}

export interface ApiResponse {
  success: boolean;
  data: DetectionResult[];
  total: number;
  limit: number;
}

export interface DetectionStats {
  total: number;
  averageFakeProbability: number;
  averageConfidence: number;
  recentCount: number; // Last 24 hours
}

/**
 * Fetches detection results from the backend API
 */
export async function fetchDetectionResults(params?: {
  limit?: number;
  sort?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sort) queryParams.append('sort', params.sort);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  const url = `${API_BASE_URL}/api/deepfake/results${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Always fetch fresh data for client components
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch detection results: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Calculates statistics from detection results
 */
export function calculateStats(results: DetectionResult[]): DetectionStats {
  if (results.length === 0) {
    return {
      total: 0,
      averageFakeProbability: 0,
      averageConfidence: 0,
      recentCount: 0,
    };
  }

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const recentResults = results.filter((result) => {
    const createdAt = new Date(result.createdAt);
    return createdAt >= oneDayAgo;
  });

  const totalFakeProbability = results.reduce((sum, r) => sum + r.deepfakePercentage, 0);
  const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);

  return {
    total: results.length,
    averageFakeProbability: totalFakeProbability / results.length,
    averageConfidence: totalConfidence / results.length,
    recentCount: recentResults.length,
  };
}

/**
 * Formats a detection result for display
 */
export function formatDetectionResult(result: DetectionResult) {
  return {
    ...result,
    fakeProbabilityPercent: (result.deepfakePercentage * 100).toFixed(2),
    confidencePercent: (result.confidence * 100).toFixed(2),
    status: getStatus(result.deepfakePercentage),
    formattedDate: formatDate(result.createdAt),
    formattedTime: formatTime(result.createdAt),
  };
}

/**
 * Gets status based on fake probability
 */
export function getStatus(fakeProbability: number): 'Authentic' | 'Uncertain' | 'Likely Deepfake' {
  if (fakeProbability < 0.4) return 'Authentic';
  if (fakeProbability <= 0.7) return 'Uncertain';
  return 'Likely Deepfake';
}

/**
 * Gets status color class
 */
export function getStatusColor(fakeProbability: number): string {
  if (fakeProbability < 0.4) return 'text-green-500 bg-green-100';
  if (fakeProbability <= 0.7) return 'text-yellow-500 bg-yellow-100';
  return 'text-red-500 bg-red-100';
}

/**
 * Formats date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats time for display
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

