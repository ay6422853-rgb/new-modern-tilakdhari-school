import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import routes from './src/routes/index.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300
  })
);

// Root route
app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'school-management-api',
    message: 'School Management Backend is running'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'school-management-api'
  });
});

// API routes
app.use('/api', routes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    message: err.message || 'Server error'
  });
});

export default app;