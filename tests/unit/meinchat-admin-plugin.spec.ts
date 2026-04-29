import { describe, it, expect, beforeEach } from 'vitest';
import { PluginRegistry, PlatformSDK } from 'vbwd-view-component';
import meinchatAdminPlugin from '../../index';

describe('Meinchat Admin Plugin', () => {
  let registry: PluginRegistry;
  let sdk: PlatformSDK;

  beforeEach(() => {
    registry = new PluginRegistry();
    sdk = new PlatformSDK();
  });

  it('declares correct metadata', () => {
    expect(meinchatAdminPlugin.name).toBe('meinchat-admin');
    expect(meinchatAdminPlugin.version).toBe('1.0.0');
  });

  it('registers all four moderation routes on install', async () => {
    registry.register(meinchatAdminPlugin);
    await registry.installAll(sdk);

    const paths = sdk.getRoutes().map((r) => r.path);
    expect(paths).toContain('meinchat/nicknames');
    expect(paths).toContain('meinchat/conversations');
    expect(paths).toContain('meinchat/conversations/:id');
    expect(paths).toContain('meinchat/transfers');
  });

  it('every route requires its declared permission', async () => {
    registry.register(meinchatAdminPlugin);
    await registry.installAll(sdk);

    const expected: Record<string, string> = {
      'meinchat/nicknames': 'meinchat.nicknames.moderate',
      'meinchat/conversations': 'meinchat.conversations.inspect',
      'meinchat/conversations/:id': 'meinchat.conversations.inspect',
      'meinchat/transfers': 'meinchat.transfers.view',
    };
    for (const route of sdk.getRoutes()) {
      expect(route.meta?.requiredPermission).toBe(expected[route.path]);
    }
  });

  it('loads all 8 locales', async () => {
    registry.register(meinchatAdminPlugin);
    await registry.installAll(sdk);

    const translations = sdk.getTranslations() as Record<string, any>;
    for (const locale of ['en', 'de', 'es', 'fr', 'ja', 'ru', 'th', 'zh']) {
      expect(translations[locale]?.meinchatAdmin?.nicknames?.title).toBeDefined();
    }
  });
});
