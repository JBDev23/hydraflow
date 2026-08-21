import { getTranslatedDaysArray, getTranslatedShortMonthsArray } from "./i18nHelpers";

export const getFormattedDate = (date = new Date()) => {
  const days = getTranslatedDaysArray()
  const months = getTranslatedShortMonthsArray()

  const dayName = days[date.getDay()];
  const dayNumber = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName} ${dayNumber} ${monthName} ${year}`;
};

export const formatDateForBackend = (dateObj) => {
  if (!(dateObj instanceof Date) || isNaN(dateObj)) return null;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};