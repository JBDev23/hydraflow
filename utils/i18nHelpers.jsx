import i18n from '../app/i18n';

export const getLocalizedText = (textObj) => {
  if (!textObj) return "";
  if (typeof textObj === 'string') return textObj;

  const currentLang = i18n.language; // 'es' o 'en'  
  // 1. Intentar idioma actual
  // 2. Intentar inglés (fallback)
  // 3. Devolver el primer valor disponible
  return textObj[currentLang] || textObj['es'] || Object.values(textObj)[0] || "";
};

export const getTranslatedShortMonthsArray = () => {
  return [
    i18n.t('months.short.jan'),
    i18n.t('months.short.feb'),
    i18n.t('months.short.mar'),
    i18n.t('months.short.apr'),
    i18n.t('months.short.may'),
    i18n.t('months.short.jun'),
    i18n.t('months.short.jul'),
    i18n.t('months.short.aug'),
    i18n.t('months.short.sep'),
    i18n.t('months.short.oct'),
    i18n.t('months.short.nov'),
    i18n.t('months.short.dec')
  ];
};


export const getTranslatedLongMonthsArray = () => {
  return [
    i18n.t('months.long.jan'),
    i18n.t('months.long.feb'),
    i18n.t('months.long.mar'),
    i18n.t('months.long.apr'),
    i18n.t('months.long.may'),
    i18n.t('months.long.jun'),
    i18n.t('months.long.jul'),
    i18n.t('months.long.aug'),
    i18n.t('months.long.sep'),
    i18n.t('months.long.oct'),
    i18n.t('months.long.nov'),
    i18n.t('months.long.dec')
  ];
};

export const getTranslatedDaysArray = () => {
  const sun = i18n.t('days.short.sun');
  const mon = i18n.t('days.short.mon');
  const tue = i18n.t('days.short.tue');
  const wed = i18n.t('days.short.wed');
  const thu = i18n.t('days.short.thu');
  const fri = i18n.t('days.short.fri');
  const sat = i18n.t('days.short.sat');

  return [sun, mon, tue, wed, thu, fri, sat];
};