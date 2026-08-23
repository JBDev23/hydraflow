import { formatDateForBackend, getFormattedDate } from '../../utils/dateFormatter';

jest.mock('../../utils/i18nHelpers', () => ({
  getTranslatedDaysArray: () => ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  getTranslatedShortMonthsArray: () => [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ],
}));

describe('formatDateForBackend', () => {
  test('Debería formatear fecha válida como YYYY-MM-DD', () => {
    const date = new Date(2026, 0, 5);
    expect(formatDateForBackend(date)).toBe('2026-01-05');
  });

  test('Debería zero-pad mes y día', () => {
    const date = new Date(2026, 2, 9);
    expect(formatDateForBackend(date)).toBe('2026-03-09');
  });

  test('Debería devolver null para fecha inválida', () => {
    expect(formatDateForBackend(new Date('invalid'))).toBeNull();
  });

  test('Debería devolver null para no-Date', () => {
    expect(formatDateForBackend('2026-01-01' as unknown as Date)).toBeNull();
  });
});

describe('getFormattedDate', () => {
  test('Debería formatear fecha con día, número, mes y año', () => {
    const date = new Date(2026, 7, 23);
    expect(getFormattedDate(date)).toBe('Dom 23 Ago 2026');
  });
});
