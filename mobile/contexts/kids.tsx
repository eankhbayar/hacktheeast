import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import api from '@/services/api';
import { useAuth } from '@/hooks/use-auth';
import type { ChildProfile, Schedule, KidView } from '@/types/children';

const AVATAR_OPTIONS: { emoji: string; color: string }[] = [
  { emoji: '👧', color: '#F8BBD0' },
  { emoji: '👦', color: '#B3E5FC' },
  { emoji: '👶', color: '#C8E6C9' },
  { emoji: '🧒', color: '#FFE0B2' },
  { emoji: '👱', color: '#D1C4E9' },
  { emoji: '🧒', color: '#FFCCBC' },
];

const DEFAULT_SCHEDULE = {
  intervalMinutes: 30,
  activeDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const,
  activeStartTime: '09:00',
  activeEndTime: '21:00',
};

function toKidView(
  profile: ChildProfile,
  schedule: Pick<Schedule, 'intervalMinutes'> | null,
  index: number
): KidView {
  const avatar = AVATAR_OPTIONS[index % AVATAR_OPTIONS.length];
  return {
    ...profile,
    intervalMinutes: schedule?.intervalMinutes ?? 30,
    avatarEmoji: avatar.emoji,
    avatarColor: avatar.color,
  };
}

interface KidsContextType {
  kids: KidView[];
  loading: boolean;
  error: string | null;
  activeChildId: string | null;
  setActiveChildId: (childId: string | null) => void;
  addKid: (name: string, ageGroup: string) => Promise<KidView>;
  updateKidInterval: (childId: string, minutes: number) => Promise<void>;
  updateKidTopics: (childId: string, topics: string[]) => Promise<void>;
  removeKid: (childId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const KidsContext = createContext<KidsContextType | null>(null);

export function KidsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [kids, setKids] = useState<KidView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const hasSetInitialChild = useRef(false);

  const fetchChildren = useCallback(async () => {
    if (!user) {
      setKids([]);
      setLoading(false);
      hasSetInitialChild.current = false;
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const childrenRes = await api.get<ChildProfile[]>('/children');
      const profiles = childrenRes.data ?? [];
      const views: KidView[] = [];
      for (let i = 0; i < profiles.length; i++) {
        const profile = profiles[i];
        let schedule: Schedule | null = null;
        try {
          const schedRes = await api.get<Schedule>(`/children/${profile.childId}/schedule`);
          schedule = schedRes.data;
        } catch {
          // No schedule yet
        }
        views.push(toKidView(profile, schedule, i));
      }
      setKids(views);
      if (views.length > 0 && !hasSetInitialChild.current) {
        setActiveChildId(views[0].childId);
        hasSetInitialChild.current = true;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load children';
      setError(msg);
      setKids([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const addKid = useCallback(
    async (name: string, ageGroup: string): Promise<KidView> => {
      const res = await api.post<ChildProfile>('/children', {
        name: name.trim(),
        ageGroup,
        learningFocus: ['general'],
        interests: ['general'],
      });
      const profile = res.data;
      const childId = profile.childId;

      try {
        await api.post(`/children/${childId}/schedule`, {
          intervalMinutes: DEFAULT_SCHEDULE.intervalMinutes,
          activeDays: [...DEFAULT_SCHEDULE.activeDays],
          activeStartTime: DEFAULT_SCHEDULE.activeStartTime,
          activeEndTime: DEFAULT_SCHEDULE.activeEndTime,
        });
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          await new Promise((r) => setTimeout(r, 300));
          try {
            await api.post(`/children/${childId}/schedule`, {
              intervalMinutes: DEFAULT_SCHEDULE.intervalMinutes,
              activeDays: [...DEFAULT_SCHEDULE.activeDays],
              activeStartTime: DEFAULT_SCHEDULE.activeStartTime,
              activeEndTime: DEFAULT_SCHEDULE.activeEndTime,
            });
          } catch {
            // Continue with profile only
          }
        }
        // 409 = schedule exists; continue with profile only
      }

      const newView = toKidView(profile, { intervalMinutes: DEFAULT_SCHEDULE.intervalMinutes }, kids.length);
      setKids((prev) => [...prev, newView]);
      if (!activeChildId) setActiveChildId(childId);
      return newView;
    },
    [kids.length, activeChildId]
  );

  const updateKidInterval = useCallback(async (childId: string, minutes: number) => {
    await api.put(`/children/${childId}/schedule`, { intervalMinutes: minutes });
    setKids((prev) =>
      prev.map((k) => (k.childId === childId ? { ...k, intervalMinutes: minutes } : k))
    );
  }, []);

  const updateKidTopics = useCallback(async (childId: string, topics: string[]) => {
    await api.put(`/children/${childId}`, { learningFocus: topics });
    setKids((prev) =>
      prev.map((k) => (k.childId === childId ? { ...k, learningFocus: topics } : k))
    );
  }, []);

  const removeKid = useCallback(async (childId: string) => {
    await api.delete(`/children/${childId}`);
    setKids((prev) => {
      const remaining = prev.filter((k) => k.childId !== childId);
      if (activeChildId === childId) {
        setActiveChildId(remaining[0]?.childId ?? null);
      }
      return remaining;
    });
  }, [activeChildId]);

  const refetch = useCallback(() => fetchChildren(), [fetchChildren]);

  return (
    <KidsContext.Provider
      value={{
        kids,
        loading,
        error,
        activeChildId,
        setActiveChildId,
        addKid,
        updateKidInterval,
        updateKidTopics,
        removeKid,
        refetch,
      }}
    >
      {children}
    </KidsContext.Provider>
  );
}

export function useKids() {
  const ctx = useContext(KidsContext);
  if (!ctx) throw new Error('useKids must be used within KidsProvider');
  return ctx;
}
