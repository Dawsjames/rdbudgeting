// src/server.ts
import { Elysia } from 'elysia';
import cors from '@elysiajs/cors';
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config();

// Import the expense routes
import { expenseRoutes } from './routes/expenses';
import { initDb } from './db';

// Get current directory
const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 6234;

// Initialize the database before starting the server
initDb().then(() => {
  // Create the app
  const app = new Elysia()
    .use(cors({
      origin: process.env.NODE_ENV === 'production' ? [/\.your-domain\.com$/] : '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }))
    // Error handler middleware
    .onError(({ code, error, set }) => {
      console.error(`Error [${code}]:`, error);
      
      if (code === 'NOT_FOUND') {
        set.status = 404;
        return { error: 'Route not found' };
      }
      
      if (code === 'VALIDATION') {
        set.status = 400;
        return { 
          error: 'Validation error', 
          details: error.message
        };
      }
      
      // Generic error handler
      set.status = 500;
      return { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      };
    })
    // Health check endpoint
    .get('/api/health', () => ({ status: 'ok', time: new Date().toISOString() }))
    // Test endpoint
    .get('/api/test', () => ({ message: 'Backend is working!' }))
    // Add the expense routes
    .use(expenseRoutes)
    // Start the server
    .listen(PORT);

  console.log(`Server running at http://localhost:${app.server?.port}`);
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});