import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('registers with username and password only', async () => {
    const prisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 7, username: 'xiaomei', email: null })
      }
    };
    const service = new AuthService(prisma as never, {} as never, {} as never);

    const user = await service.register({ username: ' xiaomei ', password: 'secret123' });

    expect(user).toEqual({ id: 7, username: 'xiaomei', email: null });
    expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { username: 'xiaomei' } });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        username: 'xiaomei',
        email: null,
        passwordHash: expect.any(String)
      },
      select: { id: true, username: true, email: true }
    });
  });
});
