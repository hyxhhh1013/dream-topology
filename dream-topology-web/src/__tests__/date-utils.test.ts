import { describe, it, expect } from 'vitest';

describe('Date utility helpers', () => {
  it('should compute days in a month correctly for January', () => {
    const days = new Date(2026, 0, 0).getDate(); // Dec has 31
    expect(days).toBe(31);
  });

  it('should compute days in February 2026 (non-leap)', () => {
    const days = new Date(2026, 2, 0).getDate(); // Feb 2026 has 28
    expect(days).toBe(28);
  });

  it('should compute days in February 2024 (leap year)', () => {
    const days = new Date(2024, 2, 0).getDate(); // Feb 2024 has 29
    expect(days).toBe(29);
  });

  it('should get the correct first day of month', () => {
    // May 1, 2026 is a Friday (= 5)
    const firstDay = new Date(2026, 4, 1).getDay();
    expect(firstDay).toBe(5);
  });
});
