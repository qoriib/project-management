import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';

interface NavContextType {
  activeNav: string;
  setActiveNav: (nav: string) => void;
}

const NavContext = createContext<NavContextType | undefined>(undefined);

export function NavProvider({ children }: { children: ReactNode }) {
  const [activeNav, setActiveNav] = useState<string>('/');
  
  const location = useLocation();

  // Sync state initially with current route if it exists, to support direct URL hits
  useEffect(() => {
    setActiveNav(location.pathname);
  }, [location.pathname]);

  return (
    <NavContext.Provider value={{ activeNav, setActiveNav }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const context = useContext(NavContext);
  if (!context) {
    throw new Error('useNav must be used within a NavProvider');
  }
  return context;
}
