import React, { createContext, useContext, useState, useCallback } from 'react';
import { KIDS, type KidProfile } from '@/data/kids';

const AVATAR_OPTIONS: { emoji: string; color: string }[] = [
  { emoji: '👧', color: '#F8BBD0' },
  { emoji: '👦', color: '#B3E5FC' },
  { emoji: '👶', color: '#C8E6C9' },
  { emoji: '🧒', color: '#FFE0B2' },
  { emoji: '👱', color: '#D1C4E9' },
  { emoji: '🧒', color: '#FFCCBC' },
];

interface KidsContextType {
  kids: KidProfile[];
  addKid: (name: string, age: number) => KidProfile;
  updateKidInterval: (kidId: string, minutes: number) => void;
  updateKidTopics: (kidId: string, topics: string[]) => void;
  toggleKidActive: (kidId: string) => void;
  removeKid: (kidId: string) => void;
}

const KidsContext = createContext<KidsContextType | null>(null);

export function KidsProvider({ children }: { children: React.ReactNode }) {
  const [kids, setKids] = useState<KidProfile[]>(KIDS);

  const addKid = useCallback((name: string, age: number): KidProfile => {
    const avatarIdx = kids.length % AVATAR_OPTIONS.length;
    const avatar = AVATAR_OPTIONS[avatarIdx];
    const newKid: KidProfile = {
      id: `kid-${Date.now()}`,
      name,
      age,
      avatarEmoji: avatar.emoji,
      avatarColor: avatar.color,
      lastActivity: 'No activity yet',
      peakInterests: [],
      currentTopicSet: [],
      intervalMinutes: 30,
      active: false,
    };
    setKids((prev) => [...prev, newKid]);
    return newKid;
  }, [kids.length]);

  const updateKidInterval = useCallback((kidId: string, minutes: number) => {
    setKids((prev) =>
      prev.map((k) => (k.id === kidId ? { ...k, intervalMinutes: minutes } : k)),
    );
  }, []);

  const updateKidTopics = useCallback((kidId: string, topics: string[]) => {
    setKids((prev) =>
      prev.map((k) => (k.id === kidId ? { ...k, currentTopicSet: topics } : k)),
    );
  }, []);

  const toggleKidActive = useCallback((kidId: string) => {
    setKids((prev) =>
      prev.map((k) => (k.id === kidId ? { ...k, active: !k.active } : k)),
    );
  }, []);

  const removeKid = useCallback((kidId: string) => {
    setKids((prev) => prev.filter((k) => k.id !== kidId));
  }, []);

  return (
    <KidsContext.Provider
      value={{ kids, addKid, updateKidInterval, updateKidTopics, toggleKidActive, removeKid }}
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
