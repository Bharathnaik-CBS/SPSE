const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const contactRoutes = require('./routes/contactRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { sendSuccess } = require('./utils/response');

const app = express();

/**
 * CORS Configuration
 * Allows:
 * - Local development frontend
 * - Your deployed Vercel frontend
 * - Any Vercel preview deployment ending with .vercel.app
 * - Any extra origins added through CORS_ORIGIN env variable
 */
const configuredCorsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',

  // Your current Vercel frontend URL
  'https://spse-j5akehk9y-bharathnaik-cbs-projects.vercel.app',

  ...configuredCorsOrigins,
];

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests like Postman, Render health checks, etc.
      if (!origin) {
        return callback(null, true);
      }

      // Allow listed origins and Vercel preview URLs
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.options('*', cors());

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/health', (_req, res) => {
  sendSuccess(res, 200, 'Smart Phonebook API is healthy.', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Main API routes
 */
app.use('/api/contacts', contactRoutes);
app.use('/api/dashboard', dashboardRoutes);

/**
 * Backward-compatible routes
 * Your deployed frontend is currently calling:
 * /contacts/recents
 * /dashboard/stats
 *
 * So these aliases prevent broken frontend requests.
 */
app.use('/contacts', contactRoutes);
app.use('/dashboard', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;