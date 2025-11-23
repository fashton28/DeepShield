// Express.js Server for Deepfake Detection Backend
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase } from './db/connection.js';
import { deepfakeRouter } from './routes/deepfake.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/deepfake', deepfakeRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Server instance (null until started)
let server = null;

// Start server
async function startServer(port = PORT) {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    console.log('Connected to MongoDB');

    // Start Express server
    return new Promise((resolve, reject) => {
      server = app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
        console.log(`Health check: http://localhost:${port}/health`);
        resolve(server);
      });

      server.on('error', (error) => {
        console.error('Failed to start server:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    throw error;
  }
}

// Graceful shutdown
async function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('Server stopped');
        server = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Export for use in Electron
export { app, startServer, stopServer };

// Auto-start if running directly (not imported)
// For ES modules, check if this is the main module
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1] === __filename);

if (isMainModule) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

