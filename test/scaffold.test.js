// test/scaffold.test.js
import { describe, it, expect } from 'vitest';
import pkg from '../package.json' assert { type: 'json' };

describe('scaffold', () => {
  it('is an ES module project', () => {
    expect(pkg.type).toBe('module');
  });
  it('has break_infinity.js dependency', () => {
    expect(pkg.dependencies['break_infinity.js']).toBeDefined();
  });
});
