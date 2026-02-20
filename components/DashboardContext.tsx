"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface DashboardWidget {
  id: string;
  type: "line" | "bar" | "kpi" | "table" | "pie" | "insight" | "gauge" | "comparison" | "map";
  title: string;
  data: any;
  timestamp: number;
}

interface DashboardContextType {
  widgets: DashboardWidget[];
  addWidget: (widget: Omit<DashboardWidget, "id" | "timestamp">) => void;
  removeWidget: (id: string) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);

  const addWidget = useCallback((widget: Omit<DashboardWidget, "id" | "timestamp">) => {
    setWidgets((prev) => [
      ...prev,
      { ...widget, id: Math.random().toString(36).slice(2), timestamp: Date.now() },
    ]);
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return (
    <DashboardContext.Provider value={{ widgets, addWidget, removeWidget }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
