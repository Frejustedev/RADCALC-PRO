import React, { createContext, useContext, useEffect, useState } from 'react';
import { CenterConfig } from '../types';
import { subscribeConfig } from './db';
import { useAuth } from './AuthContext';

const ConfigCtx = createContext<CenterConfig>({});

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [config, setConfig] = useState<CenterConfig>({});

  useEffect(() => {
    // Config is readable only by an active user (rules) → subscribe once authenticated.
    if (!profile?.active) {
      setConfig({});
      return;
    }
    return subscribeConfig(setConfig, () => setConfig({}));
  }, [profile?.active]);

  return <ConfigCtx.Provider value={config}>{children}</ConfigCtx.Provider>;
};

export const useConfig = (): CenterConfig => useContext(ConfigCtx);
