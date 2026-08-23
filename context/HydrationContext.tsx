import React, {
  createContext,
  useState,
  useContext,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { api } from '../services/api';
import { syncNotifications } from '../services/syncNotifications';
import { useUser } from './UserContext';
import type { HydrationApi } from './hydrationApi';

export type HydrationContextValue = {
  dailyWater: number;
  updateDailyWater: (newAmount: number) => void;
  refreshDailyWater: () => Promise<number>;
  selectedDay: Date;
  setSelectedDay: Dispatch<SetStateAction<Date>>;
  hydrationEpoch: number;
  bumpHydrationEpoch: () => void;
};

const HydrationContext = createContext<HydrationContextValue | null>(null);

type HydrationProviderProps = {
  children: ReactNode;
  hydrationApiRef: MutableRefObject<Partial<HydrationApi>>;
};

export const HydrationProvider = ({
  children,
  hydrationApiRef,
}: HydrationProviderProps) => {
  const { userProfile } = useUser();
  const [dailyWater, setDailyWater] = useState(0);
  const [hydrationEpoch, setHydrationEpoch] = useState(0);
  const [selectedDay, setSelectedDay] = useState(() => new Date());

  const dailyWaterRef = useRef(0);
  dailyWaterRef.current = dailyWater;

  const userProfileRef = useRef(userProfile);
  userProfileRef.current = userProfile;

  const refreshDailyWater = async (): Promise<number> => {
    try {
      const total = await api.getDailyMetrics();
      if (total === null) return dailyWaterRef.current;
      setDailyWater(total);
      dailyWaterRef.current = total;
      return total;
    } catch {
      return dailyWaterRef.current;
    }
  };

  const bumpHydrationEpoch = () => {
    setHydrationEpoch((prev) => prev + 1);
  };

  const resetDailyWater = () => {
    setDailyWater(0);
    dailyWaterRef.current = 0;
  };

  hydrationApiRef.current = {
    refreshDailyWater,
    bumpHydrationEpoch,
    resetDailyWater,
    getDailyWater: () => dailyWaterRef.current,
  };

  const updateDailyWater = (newAmount: number) => {
    setDailyWater(newAmount);
    dailyWaterRef.current = newAmount;
    const profile = userProfileRef.current;
    if (profile?.notifications?.frequency === 'smart') {
      void syncNotifications(profile, newAmount);
    }
  };

  return (
    <HydrationContext.Provider
      value={{
        dailyWater,
        updateDailyWater,
        refreshDailyWater,
        selectedDay,
        setSelectedDay,
        hydrationEpoch,
        bumpHydrationEpoch,
      }}
    >
      {children}
    </HydrationContext.Provider>
  );
};

export const useHydration = (): HydrationContextValue => {
  const ctx = useContext(HydrationContext);
  if (!ctx) {
    throw new Error('useHydration must be used within HydrationProvider');
  }
  return ctx;
};
