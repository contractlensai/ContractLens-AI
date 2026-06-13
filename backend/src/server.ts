import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { aiRouter } from './routes/ai.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });

const app = express();
const port = Number(process.env.PORT || 5000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
const allowedOrigins = frontendOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);
const isLocalOrigin = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || isLocalOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS policy does not allow this origin'));
  },
}));

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok' });
});

app.use('/api', aiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`ContractLens backend listening on port ${port}`);
});