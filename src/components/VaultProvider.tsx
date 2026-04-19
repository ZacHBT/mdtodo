"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { VaultConfig } from "@/lib/types";
import { GitHubService } from "@/lib/github";

interface VaultContextType {
  config: VaultConfig | null;
  service: GitHubService | null;
  isLoading: boolean;
  saveConfig: (config: VaultConfig) => void;
  logout: () => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<VaultConfig | null>(null);
  const [service, setService] = useState<GitHubService | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("obsidian_vault_config");
    if (saved) {
      const parsedConfig = JSON.parse(saved);
      setConfig(parsedConfig);
      setService(new GitHubService(parsedConfig));
    }
    setIsLoading(false);
  }, []);

  const saveConfig = (newConfig: VaultConfig) => {
    localStorage.setItem("obsidian_vault_config", JSON.stringify(newConfig));
    setConfig(newConfig);
    setService(new GitHubService(newConfig));
  };

  const logout = () => {
    localStorage.removeItem("obsidian_vault_config");
    setConfig(null);
    setService(null);
  };

  return (
    <VaultContext.Provider value={{ config, service, isLoading, saveConfig, logout }}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
};
