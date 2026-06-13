import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { api } from '../api';
import GoalsView from './GoalsView.vue';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock('../lib/date', () => ({
  formatLocalDate: () => '2026-06-08'
}));

describe('GoalsView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.delete).mockReset();
  });

  it('loads goals when the page is mounted', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([]);

    mount(GoalsView, {
      global: {
        stubs: {
          PageShell: {
            template: '<main><slot name="action" /><slot /></main>'
          }
        }
      }
    });
    await nextTick();
    await nextTick();

    expect(api.get).toHaveBeenCalledWith('/goals');
  });

  it('checks today on the resident task bound to a goal', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce([
        {
          id: 5,
          taskId: 12,
          title: '30天运动',
          description: null,
          startDate: '2026-06-08',
          targetDate: '2026-07-07',
          targetCount: 30,
          isActive: true,
          checkedToday: false,
          completedCount: 0,
          percent: 0,
          daysLeft: 29,
          totalDays: 30,
          status: 'active'
        }
      ])
      .mockResolvedValueOnce([]);
    vi.mocked(api.post).mockResolvedValueOnce({});
    const wrapper = mount(GoalsView, {
      global: {
        stubs: {
          PageShell: {
            template: '<main><slot name="action" /><slot /></main>'
          }
        }
      }
    });
    await nextTick();
    await nextTick();

    await wrapper.get('button[aria-label="完成今天打卡 30天运动"]').trigger('click');
    await nextTick();

    expect(api.post).toHaveBeenCalledWith('/tasks/12/checkins?date=2026-06-08');
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
