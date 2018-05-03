import { normalizePath } from '../utils';

it('can normalize path', () => {
  const path = normalizePath('user');
  expect(path).toBe('/user');
});

it('can normalize path 2', () => {
  const path = normalizePath('user/');
  expect(path).toBe('/user');
});
