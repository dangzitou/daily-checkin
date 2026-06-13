import { defineStore } from 'pinia';
import { api, ApiError } from '../api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    loading: false
  }),
  actions: {
    async loadMe() {
      this.loading = true;
      try {
        const result = await api.get<{ user: User }>('/auth/me');
        this.user = result.user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          this.user = null;
          return;
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async login(identifier: string, password: string) {
      const result = await api.post<{ user: User }>('/auth/login', { identifier, password });
      this.user = result.user;
    },
    async register(username: string, password: string) {
      await api.post('/auth/register', { username, password });
      await this.login(username, password);
    },
    async logout() {
      await api.post('/auth/logout');
      this.user = null;
    }
  }
});
