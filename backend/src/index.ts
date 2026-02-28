import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import questionsRoutes from './routes/questions';
import childrenRoutes from './routes/children';
import schedulesRoutes from './routes/schedules';
import sessionsRoutes from './routes/sessions';
import dashboardRoutes from './routes/dashboard';
import notificationsRoutes from './routes/notifications';
import agentRoutes from './routes/agent';
import { ensureTablesExist } from './config/dynamodb';

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
app.use('/children', childrenRoutes);
app.use('/sessions', sessionsRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/agent', agentRoutes);

async function start() {
  await ensureTablesExist();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
