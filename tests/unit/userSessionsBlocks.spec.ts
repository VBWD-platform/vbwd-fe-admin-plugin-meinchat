/**
 * meinchat-admin User-session cleanup blocks — global + per-user.
 *
 * The GLOBAL block (Settings → User sessions) offers two confirm-guarded
 * actions: clear ALL guest sessions/conversations, and reset all guest token
 * balances. The USER block (UserEdit → Reset user sessions) clears ONE user's
 * sessions and shows the cleared counts + new balance.
 *
 * Engineering requirements (binding, restated): TDD-first (this RED set);
 * DevOps-first (runs under the repo vitest include); SOLID (components depend
 * only on the narrow api wrappers — SRP/ISP/DIP; registered via the
 * extensionRegistry seam — OCP, no core edit); DRY; clean code (full names,
 * confirm-guarded destructive actions, no `any` leaks); no overengineering.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

const clearAllGuestSessions = vi.fn();
const setAllGuestTokens = vi.fn();
const clearUserSessions = vi.fn();

vi.mock('../../src/api', () => ({
  clearAllGuestSessions: (...args: unknown[]) => clearAllGuestSessions(...args),
  setAllGuestTokens: (...args: unknown[]) => setAllGuestTokens(...args),
  clearUserSessions: (...args: unknown[]) => clearUserSessions(...args),
}));

const i18nStub = {
  $t: (key: string, params?: Record<string, unknown>) =>
    params ? `${key} ${Object.values(params).join(' ')}` : key,
};

async function mountGlobalBlock() {
  const { default: UserSessionsGlobalBlock } = await import(
    '../../src/components/UserSessionsGlobalBlock.vue'
  );
  const wrapper = mount(UserSessionsGlobalBlock, { global: { mocks: i18nStub } });
  await flushPromises();
  return wrapper;
}

async function mountUserBlock(userId = 'user-42') {
  const { default: UserSessionsUserBlock } = await import(
    '../../src/components/UserSessionsUserBlock.vue'
  );
  const wrapper = mount(UserSessionsUserBlock, {
    props: { userId, active: true },
    global: { mocks: i18nStub },
  });
  await flushPromises();
  return wrapper;
}

describe('UserSessionsGlobalBlock', () => {
  beforeEach(() => {
    clearAllGuestSessions.mockReset();
    setAllGuestTokens.mockReset();
    clearAllGuestSessions.mockResolvedValue({ guests: 3, conversations: 5, rooms: 4, sessions: 6 });
    setAllGuestTokens.mockResolvedValue({ affected: 3 });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('clears all guest sessions after confirm and shows the result', async () => {
    const wrapper = await mountGlobalBlock();
    await wrapper.find('[data-testid="clear-all-guest-sessions"]').trigger('click');
    await flushPromises();
    expect(clearAllGuestSessions).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[data-testid="clear-guests-result"]').exists()).toBe(true);
  });

  it('does NOT clear when the confirm is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const wrapper = await mountGlobalBlock();
    await wrapper.find('[data-testid="clear-all-guest-sessions"]').trigger('click');
    await flushPromises();
    expect(clearAllGuestSessions).not.toHaveBeenCalled();
  });

  it('resets all guest token balances via setAllGuestTokens(reset)', async () => {
    const wrapper = await mountGlobalBlock();
    await wrapper.find('[data-testid="reset-all-guest-tokens"]').trigger('click');
    await flushPromises();
    expect(setAllGuestTokens).toHaveBeenCalledWith({ mode: 'reset' });
  });

  it('surfaces an error message when the clear fails', async () => {
    clearAllGuestSessions.mockRejectedValue({ error: 'boom' });
    const wrapper = await mountGlobalBlock();
    await wrapper.find('[data-testid="clear-all-guest-sessions"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="user-sessions-error"]').text()).toContain('boom');
  });
});

describe('UserSessionsUserBlock', () => {
  beforeEach(() => {
    clearUserSessions.mockReset();
    clearUserSessions.mockResolvedValue({ conversations: 1, rooms: 1, sessions: 2, balance: 5 });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('clears the given user sessions after confirm and shows counts + balance', async () => {
    const wrapper = await mountUserBlock('user-42');
    await wrapper.find('[data-testid="clear-user-sessions"]').trigger('click');
    await flushPromises();
    expect(clearUserSessions).toHaveBeenCalledWith('user-42');
    const result = wrapper.find('[data-testid="clear-user-result"]');
    expect(result.exists()).toBe(true);
    expect(result.text()).toContain('5');
  });

  it('does NOT clear when the confirm is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const wrapper = await mountUserBlock();
    await wrapper.find('[data-testid="clear-user-sessions"]').trigger('click');
    await flushPromises();
    expect(clearUserSessions).not.toHaveBeenCalled();
  });
});
