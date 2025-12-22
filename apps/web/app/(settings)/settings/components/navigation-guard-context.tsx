'use client';

import React, { createContext, useContext, ReactNode, useCallback } from 'react';

interface NavigationGuardContextValue {
  shouldBlockNavigation: () => boolean;
  triggerFlash: () => void;
  registerGuard: (guard: NavigationGuardContextValue) => void;
  unregisterGuard: () => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextValue | null>(
  null
);

export function NavigationGuardProvider({
  children,
}: {
  children: ReactNode;
}) {
  const activeGuardRef = React.useRef<NavigationGuardContextValue | null>(null);

  const registerGuard = useCallback((guard: NavigationGuardContextValue) => {
    // Only update if guard actually changed (by reference)
    if (activeGuardRef.current !== guard) {
      activeGuardRef.current = guard;
    }
  }, []);

  const unregisterGuard = useCallback(() => {
    activeGuardRef.current = null;
  }, []);

  const shouldBlockNavigation = useCallback(() => {
    return activeGuardRef.current?.shouldBlockNavigation() ?? false;
  }, []);

  const triggerFlash = useCallback(() => {
    activeGuardRef.current?.triggerFlash();
  }, []);

  const contextValue = React.useMemo(
    () => ({
      shouldBlockNavigation,
      triggerFlash,
      registerGuard,
      unregisterGuard,
    }),
    [shouldBlockNavigation, triggerFlash, registerGuard, unregisterGuard]
  );

  return (
    <NavigationGuardContext.Provider value={contextValue}>
      {children}
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuardContext() {
  const context = useContext(NavigationGuardContext);
  return context;
}

export function useRegisterNavigationGuard(guard: Omit<NavigationGuardContextValue, 'registerGuard' | 'unregisterGuard'>) {
  const context = useNavigationGuardContext();
  const guardRef = React.useRef(guard);
  const guardObjectRef = React.useRef<NavigationGuardContextValue | null>(null);
  
  // Keep ref updated with latest guard functions
  React.useEffect(() => {
    guardRef.current = guard;
  }, [guard]);
  
  // Create stable guard object only once
  React.useEffect(() => {
    if (!context || guardObjectRef.current) return;
    
    guardObjectRef.current = {
      shouldBlockNavigation: () => guardRef.current.shouldBlockNavigation(),
      triggerFlash: () => guardRef.current.triggerFlash(),
      registerGuard: () => {},
      unregisterGuard: () => {},
    };
    
    context.registerGuard(guardObjectRef.current);
    
    return () => {
      context.unregisterGuard();
      guardObjectRef.current = null;
    };
  }, [context]);
}

