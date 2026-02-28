import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const DEFAULT_QUESTIONS = [
  { question: 'What is the capital of France?', answer: 'Paris' },
  { question: 'How many days are in a week?', answer: '7' },
  { question: 'What color is the sky on a clear day?', answer: 'Blue' },
  { question: 'How many legs does a spider have?', answer: '8' },
  { question: 'What is 2 + 2?', answer: '4' },
  { question: 'What planet do we live on?', answer: 'Earth' },
  { question: 'How many months are in a year?', answer: '12' },
  { question: 'What is the opposite of hot?', answer: 'Cold' },
];

const router = Router();

router.get('/custom', authMiddleware, (req: AuthRequest, res: Response) => {
  const q = DEFAULT_QUESTIONS[Math.floor(Math.random() * DEFAULT_QUESTIONS.length)];
  res.json(q);
});

export default router;
