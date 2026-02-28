export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type QuestionType = 'short_answer' | 'multiple_choice';

export interface Question {
  question: string;
  answer: string;
  /** When present, render as multiple choice instead of text input. */
  options?: string[];
  type?: QuestionType;
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

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const DEFAULT_CUSTOM_QUESTIONS: Question[] = [
  { question: 'What is the capital of France?', answer: 'Paris', options: ['London', 'Berlin', 'Paris', 'Madrid'] },
  { question: 'How many days are in a week?', answer: '7', options: ['5', '6', '7', '8'] },
  { question: 'What color is the sky on a clear day?', answer: 'Blue', options: ['Green', 'Blue', 'Red', 'Yellow'] },
  { question: 'How many legs does a spider have?', answer: '8', options: ['6', '8', '10', '4'] },
  { question: 'What is 2 + 2?', answer: '4', options: ['3', '4', '5', '6'] },
  { question: 'What planet do we live on?', answer: 'Earth', options: ['Mars', 'Earth', 'Jupiter', 'Venus'] },
  { question: 'How many months are in a year?', answer: '12', options: ['10', '11', '12', '13'] },
  { question: 'What is the opposite of hot?', answer: 'Cold', options: ['Warm', 'Cold', 'Cool', 'Mild'] },
  { question: 'What does "Bonjour" mean?', answer: 'Hello', options: ['Goodbye', 'Hello', 'Thank you', 'Please'] },
  { question: 'How do you say "cat" in Spanish?', answer: 'Gato', options: ['Perro', 'Gato', 'Pájaro', 'Pez'] },
];

let customQuestionIndex = 0;

export function getCustomQuestion(): Question {
  const q = DEFAULT_CUSTOM_QUESTIONS[customQuestionIndex % DEFAULT_CUSTOM_QUESTIONS.length];
  customQuestionIndex++;
  if (q.options) {
    return { ...q, options: shuffle(q.options) };
  }
  return q;
}

export async function fetchCustomQuestion(): Promise<Question | null> {
  try {
    const api = (await import('@/services/api')).default;
    const res = await api.get<{ question: string; answer: string; options?: string[] }>('/questions/custom');
    const data = res.data;
    if (data.options) {
      return { ...data, options: shuffle(data.options) };
    }
    return data;
  } catch {
    return getCustomQuestion();
  }
}

export function getRandomQuestion(difficulty: QuestionDifficulty = 'medium'): Question {
  const useMath = Math.random() > 0.3;
  return useMath ? generateMathQuestion(difficulty) : getCustomQuestion();
}
