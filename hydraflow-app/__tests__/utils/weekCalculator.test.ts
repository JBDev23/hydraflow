import { getCurrentMonthWeeks, getWeekDays, getWeeksForMonth } from '../../utils/weekCalculator';

describe('getWeeksForMonth', () => {
  test('Debería generar semanas con inicio en lunes para agosto 2026', () => {
    const weeks = getWeeksForMonth(7, 2026);

    expect(weeks.length).toBeGreaterThan(0);
    weeks.forEach((week) => {
      const day = week.start.getDay();
      expect(day === 1 || day === 0).toBe(true);
      expect(week.label).toMatch(/^\d+-\d+$/);
    });
  });

  test('Debería incluir semanas que cubren el primer día del mes', () => {
    const weeks = getWeeksForMonth(0, 2026);
    const firstDayCovered = weeks.some(
      (week) => week.start <= new Date(2026, 0, 1) && week.end >= new Date(2026, 0, 1),
    );

    expect(firstDayCovered).toBe(true);
  });
});

describe('getWeekDays', () => {
  test('Debería devolver 7 días empezando en lunes', () => {
    const wednesday = new Date(2026, 7, 19);
    const days = getWeekDays(wednesday);

    expect(days).toHaveLength(7);
    expect(days[0].getDay()).toBe(1);
    expect(days[6].getDay()).toBe(0);
  });

  test('Debería manejar domingo como último día de la semana', () => {
    const sunday = new Date(2026, 7, 23);
    const days = getWeekDays(sunday);

    expect(days[0].getDay()).toBe(1);
    expect(days[6].getDay()).toBe(0);
    expect(days[6].getDate()).toBe(23);
  });

  test('Debería normalizar horas a medianoche', () => {
    const date = new Date(2026, 7, 19, 15, 30, 45);
    const days = getWeekDays(date);

    days.forEach((day) => {
      expect(day.getHours()).toBe(0);
      expect(day.getMinutes()).toBe(0);
      expect(day.getSeconds()).toBe(0);
    });
  });
});

describe('getCurrentMonthWeeks', () => {
  test('Debería devolver semanas del mes actual', () => {
    const now = new Date();
    const weeks = getCurrentMonthWeeks();
    const expected = getWeeksForMonth(now.getMonth(), now.getFullYear());

    expect(weeks).toEqual(expected);
  });
});
