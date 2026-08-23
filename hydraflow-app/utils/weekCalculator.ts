import type { WeekRange } from '../types';

export const getWeeksForMonth = (month: number, year: number): WeekRange[] => {
  const weeks: WeekRange[] = [];

  const firstDayOfMonth = new Date(year, month, 1);

  const lastDayOfMonth = new Date(year, month + 1, 0);

  const dayOfWeek = firstDayOfMonth.getDay();

  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const currentMonday = new Date(firstDayOfMonth);
  currentMonday.setDate(firstDayOfMonth.getDate() - diffToMonday);

  while (currentMonday <= lastDayOfMonth) {
    const currentSunday = new Date(currentMonday);
    currentSunday.setDate(currentMonday.getDate() + 6);

    const startDay = currentMonday.getDate();
    const endDay = currentSunday.getDate();

    weeks.push({
      start: new Date(currentMonday),
      end: new Date(currentSunday),
      label: `${startDay}-${endDay}`,
    });

    currentMonday.setDate(currentMonday.getDate() + 7);
  }

  return weeks;
};

export const getCurrentMonthWeeks = (): WeekRange[] => {
  const now = new Date();
  return getWeeksForMonth(now.getMonth(), now.getFullYear());
};

export const getWeekDays = (baseDate: Date = new Date()): Date[] => {
  const current = new Date(baseDate);
  const tempWeek: Date[] = [];

  const daysOfWeek = current.getDay();

  const distanceToMonday = daysOfWeek === 0 ? 6 : daysOfWeek - 1;

  const monday = new Date(current);

  monday.setDate(current.getDate() - distanceToMonday);

  monday.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    tempWeek.push(day);
  }

  return tempWeek;
};
