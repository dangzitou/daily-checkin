import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { useAuthStore } from './auth';

vi.mock('../api', () => ({
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public readonly status: number
    ) {
      super(message);
    }
  },
  api: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(api.post).mockReset();
  });

  it('registers with username and password only', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ user: { id: 3, username: 'xiaomei', email: null } });
    const auth = useAuthStore();

    await auth.register('xiaomei', 'secret123');

    expect(api.post).toHaveBeenNthCalledWith(1, '/auth/register', {
      username: 'xiaomei',
      password: 'secret123'
    });
    expect(api.post).toHaveBeenNthCalledWith(2, '/auth/login', {
      identifier: 'xiaomei',
      password: 'secret123'
    });
    expect(auth.user).toEqual({ id: 3, username: 'xiaomei', email: null });
  });
});
