export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  question: string;
  answer: string;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateMathQuestion(
  difficulty: QuestionDifficulty = 'medium'
): Question {
  switch (difficulty) {
    case 'easy': {
      const a = randomInt(1, 9);
      const b = randomInt(1, 9);
      const op = Math.random() > 0.5 ? '+' : '-';
      const question = op === '+' ? `${a} + ${b}` : `${a} - ${b}`;
      const answer = op === '+' ? String(a + b) : String(Math.max(0, a - b));
      return { question, answer };
    }
    case 'medium': {
      const opRand = Math.random();
      if (opRand < 0.5) {
        const a = randomInt(10, 99);
        const b = randomInt(1, 9);
        const op = Math.random() > 0.5 ? '+' : '-';
        const question = op === '+' ? `${a} + ${b}` : `${a} - ${b}`;
        const answer = op === '+' ? String(a + b) : String(Math.max(0, a - b));
        return { question, answer };
      } else {
        const a = randomInt(2, 9);
        const b = randomInt(2, 9);
        const question = `${a} × ${b}`;
        return { question, answer: String(a * b) };
      }
    }
    case 'hard': {
      const opRand = Math.random();
      if (opRand < 0.5) {
        const a = randomInt(10, 25);
        const b = randomInt(10, 25);
        const question = `${a} × ${b}`;
        return { question, answer: String(a * b) };
      } else {
        const product = randomInt(2, 12) * randomInt(2, 12);
        const divisor = randomInt(2, 12);
        const quotient = Math.floor(product / divisor) * divisor;
        const question = `${quotient} ÷ ${divisor}`;
        return { question, answer: String(quotient / divisor) };
      }
    }
    default:
      return generateMathQuestion('medium');
  }
}

const DEFAULT_CUSTOM_QUESTIONS: Question[] = [
  { question: 'What is the capital of France?', answer: 'Paris' },
  { question: 'How many days are in a week?', answer: '7' },
  { question: 'What color is the sky on a clear day?', answer: 'Blue' },
  { question: 'How many legs does a spider have?', answer: '8' },
  { question: 'What is 2 + 2?', answer: '4' },
  { question: 'What planet do we live on?', answer: 'Earth' },
  { question: 'How many months are in a year?', answer: '12' },
  { question: 'What is the opposite of hot?', answer: 'Cold' },
];

let customQuestionIndex = 0;

export function getCustomQuestion(): Question {
  const q = DEFAULT_CUSTOM_QUESTIONS[customQuestionIndex % DEFAULT_CUSTOM_QUESTIONS.length];
  customQuestionIndex++;
  return q;
}

export async function fetchCustomQuestion(): Promise<Question | null> {
  try {
    const api = (await import('@/services/api')).default;
    const res = await api.get<{ question: string; answer: string }>('/questions/custom');
    return res.data;
  } catch {
    return getCustomQuestion();
  }
}

export function getRandomQuestion(difficulty: QuestionDifficulty = 'medium'): Question {
  const useMath = Math.random() > 0.3;
  return useMath ? generateMathQuestion(difficulty) : getCustomQuestion();
}
