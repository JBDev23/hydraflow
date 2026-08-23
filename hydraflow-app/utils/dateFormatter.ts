import { getTranslatedDaysArray, getTranslatedShortMonthsArray } from './i18nHelpers';

export const getFormattedDate = (date: Date = new Date()): string => {
  const days = getTranslatedDaysArray();
  const months = getTranslatedShortMonthsArray();

  const dayName = days[date.getDay()];
  const dayNumber = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName} ${dayNumber} ${monthName} ${year}`;
};

export const formatDateForBackend = (dateObj: Date): string | null => {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return null;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
