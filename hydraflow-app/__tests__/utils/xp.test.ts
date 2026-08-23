import { calculateXpGain } from '../../utils/xp';

describe('calculateXpGain', () => {
  test('Debería calcular 25 XP para 250ml (contrato backend)', () => {
    expect(calculateXpGain(250)).toBe(25);
  });

  test('Debería calcular 100 XP para 1000ml (contrato backend)', () => {
    expect(calculateXpGain(1000)).toBe(100);
  });

  test('Debería aplicar floor en valores no múltiplos de 10', () => {
    expect(calculateXpGain(249)).toBe(24);
  });

  test('Debería devolver 0 para cantidad cero', () => {
    expect(calculateXpGain(0)).toBe(0);
  });

  test('Debería devolver 0 para cantidad negativa', () => {
    expect(calculateXpGain(-100)).toBe(0);
  });

  test('Debería parsear strings numéricos', () => {
    expect(calculateXpGain('500')).toBe(50);
  });

  test('Debería devolver 0 para NaN', () => {
    expect(calculateXpGain(NaN)).toBe(0);
  });

  test('Debería devolver 0 para strings no numéricos', () => {
    expect(calculateXpGain('abc')).toBe(0);
  });

  test('Debería devolver 0 para Infinity', () => {
    expect(calculateXpGain(Infinity)).toBe(0);
  });
});
