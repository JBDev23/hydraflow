import {
  getLocalizedText,
  getLocaleTag,
  getTranslatedDaysArray,
  getTranslatedLongMonthsArray,
  getTranslatedShortMonthsArray,
} from '../../utils/i18nHelpers';

describe('getLocalizedText', () => {
  test('Debería devolver string vacío para null/undefined', () => {
    expect(getLocalizedText(null)).toBe('');
    expect(getLocalizedText(undefined)).toBe('');
  });

  test('Debería devolver el string directamente', () => {
    expect(getLocalizedText('Plain text')).toBe('Plain text');
  });

  test('Debería devolver texto en idioma actual (es)', () => {
    expect(getLocalizedText({ es: 'Hola', en: 'Hello', ca: 'Hola' })).toBe('Hola');
  });

  test('Debería hacer fallback a es si falta idioma actual', () => {
    expect(getLocalizedText({ es: 'Fallback', en: 'English' })).toBe('Fallback');
  });

  test('Debería hacer fallback al primer valor disponible', () => {
    expect(getLocalizedText({ en: 'English only' })).toBe('English only');
  });
});

describe('getTranslatedShortMonthsArray', () => {
  test('Debería devolver 12 meses traducidos', () => {
    const months = getTranslatedShortMonthsArray();

    expect(months).toHaveLength(12);
    expect(months[0]).toBe('months.short.jan');
    expect(months[11]).toBe('months.short.dec');
  });
});

describe('getTranslatedLongMonthsArray', () => {
  test('Debería devolver 12 meses largos traducidos', () => {
    const months = getTranslatedLongMonthsArray();

    expect(months).toHaveLength(12);
    expect(months[0]).toBe('months.long.jan');
  });
});

describe('getTranslatedDaysArray', () => {
  test('Debería devolver 7 días con domingo primero', () => {
    const days = getTranslatedDaysArray();

    expect(days).toHaveLength(7);
    expect(days[0]).toBe('days.short.sun');
    expect(days[1]).toBe('days.short.mon');
    expect(days[6]).toBe('days.short.sat');
  });
});

describe('getLocaleTag', () => {
  test('Debería devolver es-ES por defecto', () => {
    expect(getLocaleTag()).toBe('es-ES');
  });
});
