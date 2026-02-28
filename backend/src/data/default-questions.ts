/**
 * Default question bank by age group and topic.
 * Seeded on child create so first sessions work instantly.
 */

export type AgeGroup = '6-8' | '9-12' | '13-15';

export interface QuestionTemplate {
  q: string;
  options: string[];
  answer: string;
}

export const DEFAULT_QUESTIONS: Record<
  AgeGroup,
  Record<string, QuestionTemplate[]>
> = {
  '6-8': {
    math: [
      { q: 'What is 2 + 3?', options: ['4', '5', '6', '7'], answer: '5' },
      { q: 'What is 4 + 4?', options: ['6', '7', '8', '9'], answer: '8' },
      { q: 'What is 3 + 4?', options: ['5', '6', '7', '8'], answer: '7' },
      { q: 'What is 5 + 2?', options: ['6', '7', '8', '9'], answer: '7' },
      { q: 'What is 6 + 3?', options: ['8', '9', '10', '11'], answer: '9' },
      { q: 'What is 10 - 4?', options: ['4', '5', '6', '7'], answer: '6' },
      { q: 'What is 8 - 3?', options: ['4', '5', '6', '7'], answer: '5' },
      { q: 'What is 2 x 3?', options: ['4', '5', '6', '7'], answer: '6' },
      { q: 'What is 4 x 2?', options: ['6', '7', '8', '9'], answer: '8' },
      { q: 'What is 6 / 2?', options: ['2', '3', '4', '5'], answer: '3' },
    ],
    phonetics: [
      {
        q: 'What sound does the letter "B" make?',
        options: ['/b/', '/d/', '/p/', '/t/'],
        answer: '/b/',
      },
      {
        q: 'Which word starts with a "ch" sound?',
        options: ['Ship', 'Chair', 'Think', 'Jump'],
        answer: 'Chair',
      },
      {
        q: 'How many syllables in "elephant"?',
        options: ['2', '3', '4', '1'],
        answer: '3',
      },
      {
        q: 'Which word rhymes with "cat"?',
        options: ['Dog', 'Bat', 'Fish', 'Run'],
        answer: 'Bat',
      },
      {
        q: 'What letter does "apple" start with?',
        options: ['B', 'A', 'C', 'D'],
        answer: 'A',
      },
    ],
    general: [
      {
        q: 'How many days are in a week?',
        options: ['5', '6', '7', '8'],
        answer: '7',
      },
      {
        q: 'What planet do we live on?',
        options: ['Mars', 'Earth', 'Jupiter', 'Venus'],
        answer: 'Earth',
      },
      {
        q: 'How many legs does a spider have?',
        options: ['6', '8', '10', '4'],
        answer: '8',
      },
      {
        q: 'What is the opposite of hot?',
        options: ['Warm', 'Cold', 'Cool', 'Mild'],
        answer: 'Cold',
      },
      {
        q: 'What color is the sky on a sunny day?',
        options: ['Green', 'Blue', 'Red', 'Yellow'],
        answer: 'Blue',
      },
      {
        q: 'How many months are in a year?',
        options: ['10', '11', '12', '13'],
        answer: '12',
      },
    ],
  },
  '9-12': {
    math: [
      { q: 'What is 7 + 5?', options: ['10', '11', '12', '13'], answer: '12' },
      { q: 'What is 3 x 4?', options: ['7', '10', '12', '14'], answer: '12' },
      { q: 'What is 15 - 8?', options: ['5', '6', '7', '8'], answer: '7' },
      { q: 'What is 20 / 4?', options: ['4', '5', '6', '8'], answer: '5' },
      { q: 'What is 9 + 6?', options: ['13', '14', '15', '16'], answer: '15' },
      { q: 'What is 12 x 8?', options: ['86', '96', '106', '84'], answer: '96' },
      { q: 'What is 144 / 12?', options: ['10', '11', '12', '13'], answer: '12' },
      { q: 'What is 7 x 7?', options: ['42', '49', '56', '63'], answer: '49' },
      { q: 'What is 100 - 37?', options: ['61', '62', '63', '64'], answer: '63' },
      { q: 'What is 15% of 80?', options: ['10', '12', '14', '16'], answer: '12' },
    ],
    languages: [
      {
        q: 'What does "Bonjour" mean?',
        options: ['Goodbye', 'Hello', 'Thank you', 'Please'],
        answer: 'Hello',
      },
      {
        q: 'How do you say "cat" in Spanish?',
        options: ['Perro', 'Gato', 'Pájaro', 'Pez'],
        answer: 'Gato',
      },
      {
        q: 'What is "Thank you" in Japanese?',
        options: ['Konnichiwa', 'Sayonara', 'Arigatou', 'Sumimasen'],
        answer: 'Arigatou',
      },
      {
        q: 'What does "Hola" mean in Spanish?',
        options: ['Goodbye', 'Hello', 'Please', 'Thanks'],
        answer: 'Hello',
      },
      {
        q: 'How do you say "water" in French?',
        options: ['Lait', 'Eau', 'Pain', 'Fromage'],
        answer: 'Eau',
      },
    ],
    general: [
      {
        q: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        answer: 'Paris',
      },
      {
        q: 'What is the largest ocean?',
        options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'],
        answer: 'Pacific',
      },
      {
        q: 'How many continents are there?',
        options: ['5', '6', '7', '8'],
        answer: '7',
      },
      {
        q: 'What year did World War II end?',
        options: ['1943', '1944', '1945', '1946'],
        answer: '1945',
      },
      {
        q: 'What is the chemical symbol for gold?',
        options: ['Go', 'Gd', 'Au', 'Ag'],
        answer: 'Au',
      },
    ],
  },
  '13-15': {
    math: [
      {
        q: 'Simplify: 3x + 2x',
        options: ['5x', '6x', '5x²', '6'],
        answer: '5x',
      },
      {
        q: 'What is 2³?',
        options: ['4', '6', '8', '10'],
        answer: '8',
      },
      {
        q: 'Solve: 2x + 5 = 15',
        options: ['x = 3', 'x = 5', 'x = 7', 'x = 10'],
        answer: 'x = 5',
      },
      {
        q: 'What is √144?',
        options: ['10', '11', '12', '13'],
        answer: '12',
      },
      {
        q: 'What is 15% of 200?',
        options: ['25', '30', '35', '40'],
        answer: '30',
      },
      {
        q: 'Factor: x² - 9',
        options: ['(x-3)(x+3)', '(x-9)(x+1)', '(x-3)²', '(x+3)²'],
        answer: '(x-3)(x+3)',
      },
      {
        q: 'What is (-3) x (-4)?',
        options: ['-12', '12', '-7', '7'],
        answer: '12',
      },
    ],
    languages: [
      {
        q: 'What is the past tense of "go" in English?',
        options: ['Goed', 'Went', 'Gone', 'Going'],
        answer: 'Went',
      },
      {
        q: 'Which language uses "kanji" characters?',
        options: ['Chinese', 'Korean', 'Japanese', 'Vietnamese'],
        answer: 'Japanese',
      },
      {
        q: 'What does "carpe diem" mean in Latin?',
        options: [
          'Peace be with you',
          'Seize the day',
          'Hello',
          'Goodbye',
        ],
        answer: 'Seize the day',
      },
    ],
    general: [
      {
        q: 'What is the speed of light in vacuum (approx)?',
        options: [
          '300,000 km/s',
          '150,000 km/s',
          '500,000 km/s',
          '100,000 km/s',
        ],
        answer: '300,000 km/s',
      },
      {
        q: 'Who wrote "Romeo and Juliet"?',
        options: ['Dickens', 'Shakespeare', 'Austen', 'Twain'],
        answer: 'Shakespeare',
      },
      {
        q: 'What is the powerhouse of the cell?',
        options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi'],
        answer: 'Mitochondria',
      },
    ],
  },
};
