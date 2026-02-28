export interface KidProfile {
  id: string;
  name: string;
  age: number;
  avatarEmoji: string;
  avatarColor: string;
  lastActivity: string;
  peakInterests: string[];
  currentTopicSet: string[];
  intervalMinutes: number;
}

export const KIDS: KidProfile[] = [
  {
    id: 'kid-1',
    name: 'Emily',
    age: 8,
    avatarEmoji: '👧',
    avatarColor: '#F8BBD0',
    lastActivity: '2 hours ago — Quadratic Equations quiz (scored 4/5)',
    peakInterests: ['Math', 'Science', 'Art'],
    currentTopicSet: ['Quadratic Equations', 'Fractions', 'Reading Comprehension'],
    intervalMinutes: 30,
  },
  {
    id: 'kid-2',
    name: 'Brian',
    age: 11,
    avatarEmoji: '👦',
    avatarColor: '#B3E5FC',
    lastActivity: '45 min ago — Grammar Basics quiz (scored 3/5)',
    peakInterests: ['History', 'Geography', 'Sports'],
    currentTopicSet: ['Grammar Basics', 'World Capitals', 'Ancient Civilizations'],
    intervalMinutes: 15,
  },
  {
    id: 'kid-3',
    name: 'Sophie',
    age: 6,
    avatarEmoji: '👶',
    avatarColor: '#C8E6C9',
    lastActivity: 'Yesterday — Counting Numbers quiz (scored 5/5)',
    peakInterests: ['Animals', 'Colors', 'Music'],
    currentTopicSet: ['Counting Numbers', 'Animal Names', 'Basic Shapes'],
    intervalMinutes: 45,
  },
];
