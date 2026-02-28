import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  fetchChildren,
  getChild,
  createChild,
  updateChild,
  deleteChild,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '@/services/children';
import { toKidView } from '@/types/children';
import type { KidView } from '@/types/children';
import { useAuth } from '@/contexts/auth';

function ageToAgeGroup(age: number): string {
  if (age <= 8) return '6-8';
  if (age <= 12) return '9-12';
  return '13-15';
}

const DEFAULT_SCHEDULE = {
  intervalMinutes: 30,
  activeDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as string[],
  activeStartTime: '08:00',
  activeEndTime: '21:00',
};

interface KidsContextType {
  kids: KidView[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addKid: (name: string, age: number) => Promise<KidView>;
  updateKidInterval: (childId: string, minutes: number) => Promise<void>;
  updateKidTopics: (childId: string, topics: string[]) => Promise<void>;
  toggleKidActive: (childId: string) => Promise<void>;
  removeKid: (childId: string) => Promise<void>;
}

const KidsContext = createContext<KidsContextType | null>(null);

export function KidsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [kids, setKids] = useState<KidView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadKids = useCallback(async () => {
    if (!isAuthenticated) {
      setKids([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const profiles = await fetchChildren();
      const kidsWithSchedules = await Promise.all(
        profiles.map(async (profile) => {
          try {
            const schedule = await getSchedule(profile.childId);
            return toKidView(profile, schedule);
          } catch {
            return toKidView(profile, null);
          }
        })
      );
      setKids(kidsWithSchedules);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load kids';
      setError(message);
      setKids([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadKids();
  }, [loadKids]);

  const addKid = useCallback(
    async (name: string, age: number): Promise<KidView> => {
      const ageGroup = ageToAgeGroup(age);
      const profile = await createChild({
        name,
        ageGroup,
        learningFocus: ['general'],
        interests: ['general'],
      });
      try {
        const schedule = await createSchedule(profile.childId, {
          ...DEFAULT_SCHEDULE,
          intervalMinutes: 30,
        });
        const kidView = toKidView(profile, schedule);
        setKids((prev) => [...prev, kidView]);
        return kidView;
      } catch {
        const kidView = toKidView(profile, null);
        setKids((prev) => [...prev, kidView]);
        return kidView;
      }
    },
    []
  );

  const updateKidInterval = useCallback(
    async (childId: string, minutes: number) => {
      try {
        const schedule = await getSchedule(childId);
        await updateSchedule(childId, { intervalMinutes: minutes });
        setKids((prev) =>
          prev.map((k) =>
            k.childId === childId ? { ...k, intervalMinutes: minutes } : k
          )
        );
      } catch {
        try {
          await createSchedule(childId, {
            ...DEFAULT_SCHEDULE,
            intervalMinutes: minutes,
          });
          setKids((prev) =>
            prev.map((k) =>
              k.childId === childId ? { ...k, intervalMinutes: minutes } : k
            )
          );
        } catch (err) {
          throw err;
        }
      }
    },
    []
  );

  const updateKidTopics = useCallback(
    async (childId: string, topics: string[]) => {
      await updateChild(childId, {
        learningFocus: topics.length > 0 ? topics : ['general'],
      });
      setKids((prev) =>
        prev.map((k) =>
          k.childId === childId ? { ...k, learningFocus: topics } : k
        )
      );
    },
    []
  );

  const toggleKidActive = useCallback(async (childId: string) => {
    const kid = kids.find((k) => k.childId === childId);
    if (!kid) return;
    const newActive = !kid.isActive;
    await updateChild(childId, { isActive: newActive });
    setKids((prev) =>
      prev.map((k) =>
        k.childId === childId ? { ...k, isActive: newActive } : k
      )
    );
  }, [kids]);

  const removeKid = useCallback(async (childId: string) => {
    try {
      await deleteSchedule(childId);
    } catch {
      // No schedule, ignore
    }
    await deleteChild(childId);
    setKids((prev) => prev.filter((k) => k.childId !== childId));
  }, []);

  return (
    <KidsContext.Provider
      value={{
        kids,
        isLoading,
        error,
        refetch: loadKids,
        addKid,
        updateKidInterval,
        updateKidTopics,
        toggleKidActive,
        removeKid,
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
