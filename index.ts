/**
 * meinchat Admin Plugin
 *
 * Moderation views in the admin backoffice:
 * - Nicknames table with ban/unban toggles
 * - Token-transfer audit log
 *
 * NOTE: there is intentionally NO conversation-content inspector — admins must
 * not read conversation content or history (privacy / product strategy).
 */
import type { IPlugin, IPlatformSDK } from 'vbwd-view-component';
import { extensionRegistry } from '../../vue/src/plugins/extensionRegistry';
import en from './locales/en.json';
import de from './locales/de.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import ru from './locales/ru.json';
import th from './locales/th.json';
import zh from './locales/zh.json';

const NAV_SECTIONS = [
  {
    id: 'meinchat',
    label: 'Meinchat',
    items: [
      {
        label: 'Nicknames',
        to: '/admin/meinchat/nicknames',
        requiredPermission: 'meinchat.nicknames.moderate',
      },
      {
        label: 'Transfers',
        to: '/admin/meinchat/transfers',
        requiredPermission: 'meinchat.transfers.view',
      },
    ],
  },
];

export const meinchatAdminPlugin: IPlugin = {
  name: 'meinchat-admin',
  version: '1.0.0',
  description: 'Admin moderation: nickname ban/unban, transfer audit log.',

  install(sdk: IPlatformSDK) {
    sdk.addTranslations('en', { meinchatAdmin: (en as any).meinchatAdmin });
    sdk.addTranslations('de', { meinchatAdmin: (de as any).meinchatAdmin });
    sdk.addTranslations('es', { meinchatAdmin: (es as any).meinchatAdmin });
    sdk.addTranslations('fr', { meinchatAdmin: (fr as any).meinchatAdmin });
    sdk.addTranslations('ja', { meinchatAdmin: (ja as any).meinchatAdmin });
    sdk.addTranslations('ru', { meinchatAdmin: (ru as any).meinchatAdmin });
    sdk.addTranslations('th', { meinchatAdmin: (th as any).meinchatAdmin });
    sdk.addTranslations('zh', { meinchatAdmin: (zh as any).meinchatAdmin });

    extensionRegistry.register('meinchat-admin', { navSections: NAV_SECTIONS });

    sdk.addRoute({
      path: 'meinchat/nicknames',
      name: 'meinchat-admin-nicknames',
      component: () => import('./src/views/MeinchatNicknamesList.vue'),
      meta: { requiredPermission: 'meinchat.nicknames.moderate' },
    });
    sdk.addRoute({
      path: 'meinchat/transfers',
      name: 'meinchat-admin-transfers',
      component: () => import('./src/views/MeinchatTransfersList.vue'),
      meta: { requiredPermission: 'meinchat.transfers.view' },
    });
  },

  activate() {
    extensionRegistry.register('meinchat-admin', { navSections: NAV_SECTIONS });
  },

  deactivate() {
    extensionRegistry.unregister('meinchat-admin');
  },
};

export default meinchatAdminPlugin;
