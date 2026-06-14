import { describe, it, expect } from 'vitest';
import { getCharCounterClass } from '@/utils/format';

describe('format utils', () => {
  describe('getCharCounterClass', () => {
    it('should return safe-color for length <= 1500', () => {
      expect(getCharCounterClass(1000)).toBe('char-counter safe');
      expect(getCharCounterClass(1500)).toBe('char-counter safe');
    });

    it('should return warning-color for length between 1500 and 1900', () => {
      expect(getCharCounterClass(1600)).toBe('char-counter warning');
      expect(getCharCounterClass(1899)).toBe('char-counter warning');
    });

    it('should return danger-color for length >= 1900', () => {
      expect(getCharCounterClass(1950)).toBe('char-counter danger');
      expect(getCharCounterClass(2000)).toBe('char-counter danger');
    });
  });
});
