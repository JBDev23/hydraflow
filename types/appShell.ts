import type { CatalogAchievement } from './api';

export type LevelUpModalConfig = {
  level: number;
  drops: number;
};

export type TutorialStep = {
  title: string;
  description: string;
  icon: string;
  tab?: number;
};

export type AppShellContextValue = {
  changeTab: (index: number) => void;
  startTutorial: () => void;
  levelUp: (newLevel: number, dropsEarned: number) => void;
  newAch: (newAchs: CatalogAchievement[]) => void;
};
