"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  loadFacility,
  refreshFacility,
  changeAlertStatus,
} from "@/services/facility-service";
import type { FacilitySnapshot, AlertStatus } from "@/types/domain";

const FacilityContext = createContext<{
  data: FacilitySnapshot;
  paused: boolean;
  setPaused: (value: boolean) => void;
  updateAlert: (id: string, status: AlertStatus) => void;
} | null>(null);
export function FacilityProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(loadFacility);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => {
      if (!paused && !document.hidden) setData(refreshFacility);
    }, 12000);
    return () => clearInterval(timer);
  }, [paused]);
  return (
    <FacilityContext.Provider
      value={{
        data,
        paused,
        setPaused,
        updateAlert: (id, status) =>
          setData((current) => changeAlertStatus(current, id, status)),
      }}
    >
      {children}
    </FacilityContext.Provider>
  );
}
export function useFacility() {
  const context = useContext(FacilityContext);
  if (!context) throw new Error("FacilityProvider is required");
  return context;
}
