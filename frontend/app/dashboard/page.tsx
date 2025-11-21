"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  fetchDetectionResults,
  calculateStats,
  formatDetectionResult,
  getStatusColor,
  type DetectionResult,
} from "@/lib/api"
import { format } from "date-fns"

export default function Dashboard() {
  const [data, setData] = useState<DetectionResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    averageFakeProbability: 0,
    averageConfidence: 0,
    recentCount: 0,
  })

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchDetectionResults({
          limit: 100,
          sort: 'desc',
        })
        
        if (response.success && response.data) {
          setData(response.data)
          setStats(calculateStats(response.data))
        } else {
          setError('Failed to load data')
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Prepare chart data
  const chartData = data.map((item) => ({
    date: format(new Date(item.createdAt), 'MMM dd'),
    fullDate: format(new Date(item.createdAt), 'yyyy-MM-dd'),
    deepfakePercentage: Number((item.deepfakePercentage * 100).toFixed(2)),
    confidence: Number((item.confidence * 100).toFixed(2)),
  }))

  // Prepare distribution data for bar chart
  const distributionData = [
    { range: '0-20%', count: data.filter((d) => d.deepfakePercentage < 0.2).length },
    { range: '20-40%', count: data.filter((d) => d.deepfakePercentage >= 0.2 && d.deepfakePercentage < 0.4).length },
    { range: '40-60%', count: data.filter((d) => d.deepfakePercentage >= 0.4 && d.deepfakePercentage < 0.6).length },
    { range: '60-80%', count: data.filter((d) => d.deepfakePercentage >= 0.6 && d.deepfakePercentage < 0.8).length },
    { range: '80-100%', count: data.filter((d) => d.deepfakePercentage >= 0.8).length },
  ]

  const averageDeepfakePercentage = Math.round(stats.averageFakeProbability * 100)
  const authenticCount = data.filter((d) => d.deepfakePercentage < 0.4).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-600 text-lg font-semibold mb-2">Error loading data</p>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-blue-200 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-900">Deepfake Detection Dashboard</h1>
          <Link href="/">
            <button className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium transition-colors">
              ← Back to Home
            </button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-medium">Average Deepfake %</p>
            <p className="text-4xl font-bold text-blue-600 mt-2">{averageDeepfakePercentage}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-medium">Total Detections</p>
            <p className="text-4xl font-bold text-green-600 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <p className="text-gray-600 text-sm font-medium">Authentic Detections</p>
            <p className="text-4xl font-bold text-orange-600 mt-2">{authenticCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm font-medium">Last 24 Hours</p>
            <p className="text-4xl font-bold text-purple-600 mt-2">{stats.recentCount}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deepfake Percentage Trend */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Deepfake Detection Trend</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="deepfakePercentage" stroke="#3b82f6" name="Deepfake %" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Distribution Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Fake Probability Distribution</h2>
            {distributionData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#2196f3" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Detections Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Detection Results</h2>
          <div className="overflow-x-auto">
            {data.length > 0 ? (
              <table className="w-full">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fake Probability</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Confidence</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 20).map((item) => {
                    const formatted = formatDetectionResult(item)
                    return (
                      <tr key={item._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">{formatted.formattedDate}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatted.formattedTime}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                          {formatted.fakeProbabilityPercent}%
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatted.confidencePercent}%</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.deepfakePercentage)}`}
                          >
                            {formatted.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No detection results available yet.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
