import React, { createContext, useContext, useState, useCallback } from 'react';
import type { KidProfile } from '@/data/kids';

type AppMode = 'parent' | 'child';

interface AppModeContextType {
  mode: AppMode;
  childModeKid: KidProfile | null;
  enterChildMode: (kid: KidProfile) => void;
  exitChildMode: () => void;
}

const AppModeContext = createContext<AppModeContextType | null>(null);

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppMode>('parent');
  const [childModeKid, setChildModeKid] = useState<KidProfile | null>(null);

  const enterChildMode = useCallback((kid: KidProfile) => {
    setChildModeKid(kid);
    setMode('child');
  }, []);

  const exitChildMode = useCallback(() => {
    setMode('parent');
    setChildModeKid(null);
  }, []);

  return (
    <AppModeContext.Provider value={{ mode, childModeKid, enterChildMode, exitChildMode }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error('useAppMode must be used within AppModeProvider');
  return ctx;
}
