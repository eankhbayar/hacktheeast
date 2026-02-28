import React, { createContext, useContext, useState, useCallback } from 'react';
import type { KidView } from '@/types/children';

type AppMode = 'parent' | 'child';

interface AppModeContextType {
  mode: AppMode;
  childModeKid: KidView | null;
  enterChildMode: (kid: KidView) => void;
  exitChildMode: () => void;
}

const AppModeContext = createContext<AppModeContextType | null>(null);

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppMode>('parent');
  const [childModeKid, setChildModeKid] = useState<KidView | null>(null);

  const enterChildMode = useCallback((kid: KidView) => {
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
