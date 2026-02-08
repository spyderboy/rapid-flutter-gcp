// scripts/__tests__/naming.test.mjs
import { validateRepoName } from '../_naming.mjs';

describe('validateRepoName', () => {
  test('rejects uppercase', () => {
    expect(validateRepoName('MyApp').ok).toBe(false);
  });
  
  test('accepts valid names', () => {
    expect(validateRepoName('my-app').ok).toBe(true);
  });

  test('rejects spaces', () => {
    expect(validateRepoName('my app').ok).toBe(false);
  });

  test('rejects underscores', () => {
    expect(validateRepoName('my_app').ok).toBe(false);
  });

  test('rejects double hyphens', () => {
    expect(validateRepoName('my--app').ok).toBe(false);
  });

  test('rejects leading hyphen', () => {
    expect(validateRepoName('-my-app').ok).toBe(false);
  });

  test('rejects trailing hyphen', () => {
    expect(validateRepoName('my-app-').ok).toBe(false);
  });

  test('rejects version tokens like v1, v2', () => {
    expect(validateRepoName('my-app-v1').ok).toBe(false);
    expect(validateRepoName('my-app-v2').ok).toBe(false);
  });

  test('rejects version tokens like final, latest', () => {
    expect(validateRepoName('my-app-final').ok).toBe(false);
    expect(validateRepoName('my-app-latest').ok).toBe(false);
  });

  test('rejects single segment name', () => {
    expect(validateRepoName('myapp').ok).toBe(false);
  });

  test('accepts multi-segment valid name', () => {
    expect(validateRepoName('my-awesome-project').ok).toBe(true);
  });
});
