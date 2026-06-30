/**
 * meinchat-admin "Guest tokens" admin action — view + api + registration oracle.
 *
 * The guests page lists chat guests (paged) and lets an admin top-up (ADD N
 * tokens) or reset (SET balance to exactly N) the tokens of a single guest, or
 * of ALL guests at once. Leaving the amount field blank uses the configured
 * initial-grant default (the amount is omitted from the request body so the
 * backend fills it in).
 *
 * Engineering requirements (binding, restated): TDD-first (this RED set);
 * DevOps-first (runs under the repo vitest include `plugins/&#42;/tests/unit`);
 * SOLID (the view depends only on the narrow api wrappers — SRP/ISP/DIP; the
 * route/nav register through the SDK + extensionRegistry seams — OCP, no core
 * edit); DRY (one `fetch()` refreshes after every mutation); clean code (full
 * names, no magic numbers); no overengineering. Quality guard: `npm run test`
 * + `npm run lint`.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { PluginRegistry, PlatformSDK } from 'vbwd-view-component';

const listGuests = vi.fn();
const setGuestTokens = vi.fn();
const setAllGuestTokens = vi.fn();

vi.mock('../../src/api', () => ({
  listGuests: (...args: unknown[]) => listGuests(...args),
  setGuestTokens: (...args: unknown[]) => setGuestTokens(...args),
  setAllGuestTokens: (...args: unknown[]) => setAllGuestTokens(...args),
}));

const guestRow = {
  guest_user_id: 'guest-0001-aaaa-bbbb-cccc',
  display_name: 'Anonymous Fox',
  widget_slug: 'support-chat',
  balance: 12,
  last_seen: '2026-06-14T10:00:00Z',
};

function pagedGuests(items: typeof guestRow[]) {
  return { items, page: 1, per_page: 50, total: items.length };
}

async function mountGuestsView() {
  // i18n + the api mock must be in place before the view module loads.
  const { default: MeinchatGuestsList } = await import(
    '../../src/views/MeinchatGuestsList.vue'
  );
  const wrapper = mount(MeinchatGuestsList, {
    global: {
      mocks: {
        // Faithful-enough i18n stub: returns the key with any {param}
        // placeholders interpolated (so `affected` surfaces its count).
        $t: (key: string, params?: Record<string, unknown>) =>
          params
            ? `${key} ${Object.values(params).join(' ')}`
            : key,
      },
    },
  });
  await flushPromises();
  return wrapper;
}

describe('MeinchatGuestsList view', () => {
  beforeEach(() => {
    listGuests.mockReset();
    setGuestTokens.mockReset();
    setAllGuestTokens.mockReset();
    listGuests.mockResolvedValue(pagedGuests([guestRow]));
    setGuestTokens.mockResolvedValue({
      guest_user_id: guestRow.guest_user_id,
      balance: 32,
    });
    setAllGuestTokens.mockResolvedValue({ affected: 7 });
    vi.stubGlobal('confirm', () => true);
    vi.stubGlobal('alert', () => undefined);
  });

  it('renders a row per guest from the api', async () => {
    const wrapper = await mountGuestsView();
    expect(listGuests).toHaveBeenCalled();
    const rows = wrapper.findAll('[data-testid="meinchat-admin-guest-row"]');
    expect(rows).toHaveLength(1);
    const text = rows[0].text();
    expect(text).toContain('Anonymous Fox');
    expect(text).toContain('support-chat');
    expect(text).toContain('12');
  });

  it('per-guest top-up calls setGuestTokens with mode topup + the typed amount', async () => {
    const wrapper = await mountGuestsView();
    const row = wrapper.find('[data-testid="meinchat-admin-guest-row"]');
    await row.find('[data-testid="guest-mode"]').setValue('topup');
    await row.find('[data-testid="guest-amount"]').setValue('5');
    await row.find('[data-testid="guest-apply"]').trigger('click');
    await flushPromises();
    expect(setGuestTokens).toHaveBeenCalledWith(guestRow.guest_user_id, {
      mode: 'topup',
      amount: 5,
    });
  });

  it('per-guest reset with a blank amount omits amount so the backend defaults', async () => {
    const wrapper = await mountGuestsView();
    const row = wrapper.find('[data-testid="meinchat-admin-guest-row"]');
    await row.find('[data-testid="guest-mode"]').setValue('reset');
    await row.find('[data-testid="guest-amount"]').setValue('');
    await row.find('[data-testid="guest-apply"]').trigger('click');
    await flushPromises();
    expect(setGuestTokens).toHaveBeenCalledWith(guestRow.guest_user_id, {
      mode: 'reset',
      amount: undefined,
    });
  });

  it('refreshes the list after a per-guest mutation', async () => {
    const wrapper = await mountGuestsView();
    listGuests.mockClear();
    const row = wrapper.find('[data-testid="meinchat-admin-guest-row"]');
    await row.find('[data-testid="guest-apply"]').trigger('click');
    await flushPromises();
    expect(listGuests).toHaveBeenCalledTimes(1);
  });

  it('bulk action calls the bulk endpoint and surfaces the affected count', async () => {
    const wrapper = await mountGuestsView();
    await wrapper.find('[data-testid="bulk-mode"]').setValue('topup');
    await wrapper.find('[data-testid="bulk-amount"]').setValue('10');
    await wrapper.find('[data-testid="bulk-apply"]').trigger('click');
    await flushPromises();
    expect(setAllGuestTokens).toHaveBeenCalledWith({ mode: 'topup', amount: 10 });
    expect(wrapper.find('[data-testid="bulk-result"]').text()).toContain('7');
  });

  it('bulk action with a blank amount omits amount so the backend defaults', async () => {
    const wrapper = await mountGuestsView();
    await wrapper.find('[data-testid="bulk-mode"]').setValue('reset');
    await wrapper.find('[data-testid="bulk-amount"]').setValue('');
    await wrapper.find('[data-testid="bulk-apply"]').trigger('click');
    await flushPromises();
    expect(setAllGuestTokens).toHaveBeenCalledWith({
      mode: 'reset',
      amount: undefined,
    });
  });
});

describe('meinchat-admin plugin registers the guests action', () => {
  let registry: PluginRegistry;
  let sdk: PlatformSDK;

  beforeEach(async () => {
    listGuests.mockReset();
    const mod = await import('../../index');
    registry = new PluginRegistry();
    sdk = new PlatformSDK();
    // cms-admin is a declared dependency; register a no-op stub so the registry can resolve it.
    registry.register({ name: 'cms-admin', version: '26.6.1', install() {} });
    registry.register(mod.default);
    await registry.installAll(sdk);
  });

  it('registers the guests route gated on meinchat.guests.manage', () => {
    const route = sdk.getRoutes().find((r) => r.path === 'meinchat/guests');
    expect(route).toBeDefined();
    expect(route?.meta?.requiredPermission).toBe('meinchat.guests.manage');
  });

  it('adds a Guests nav item gated on meinchat.guests.manage', async () => {
    const { extensionRegistry } = await import(
      '../../../../vue/src/plugins/extensionRegistry'
    );
    const meinchatSection = extensionRegistry
      .getNavSections()
      .find((section) => section.id === 'meinchat') as
      | { items: { to: string; requiredPermission?: string }[] }
      | undefined;
    expect(meinchatSection).toBeDefined();
    const guestsItem = meinchatSection!.items.find(
      (item) => item.to === '/admin/meinchat/guests',
    );
    expect(guestsItem).toBeDefined();
    expect(guestsItem!.requiredPermission).toBe('meinchat.guests.manage');
  });

  it('still loads all 8 locales with a guests title', () => {
    const translations = sdk.getTranslations() as Record<string, any>;
    for (const locale of ['en', 'de', 'es', 'fr', 'ja', 'ru', 'th', 'zh']) {
      expect(translations[locale]?.meinchatAdmin?.guests?.title).toBeDefined();
    }
  });
});
