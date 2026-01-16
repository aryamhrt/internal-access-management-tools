import { describe, it, expect } from 'vitest';
import { formatDate, capitalize, isValidEmail } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('should format a valid date string', () => {
      const result = formatDate('2023-01-15T10:30:00Z', 'yyyy-MM-dd');
      expect(result).toBe('2023-01-15');
    });

    it('should return original string for invalid date', () => {
      const result = formatDate('invalid-date');
      expect(result).toBe('invalid-date');
    });
  });

  describe('capitalize', () => {
    it('should capitalize the first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('HELLO');
    });
  });

  describe('isValidEmail', () => {
    it('should validate email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });
});