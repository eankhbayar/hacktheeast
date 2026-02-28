import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import questionsRoutes from './routes/questions';
import { ensureTableExists } from './config/dynamodb';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/questions', questionsRoutes);

async function start() {
  await ensureTableExists();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();