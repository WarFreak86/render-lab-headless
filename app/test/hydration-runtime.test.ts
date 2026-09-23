import {version as reactVersion} from 'react';
import {version as reactDomVersion} from 'react-dom';
import {describe, expect, it} from 'vitest';

describe('document hydration runtime', () => {
  it('uses the React 19 hydration engine supported by Hydrogen', () => {
    expect(reactVersion).toMatch(/^19\./);
    expect(reactDomVersion).toBe(reactVersion);
  });
});
