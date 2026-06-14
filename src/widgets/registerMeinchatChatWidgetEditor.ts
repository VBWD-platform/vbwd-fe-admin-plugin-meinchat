/**
 * Registers the MeinchatChatWidget editor descriptor through the SHARED
 * cms-admin widget-editor seam (D9).
 *
 * The meinchat-admin plugin owns this descriptor — cms-admin carries no
 * meinchat strings (OCP). The registry function is imported from the stable
 * cms-admin plugin path, mirroring how fe-user plugins import
 * registerCmsVueComponent from the cms plugin.
 */
import type { registerWidgetEditor as RegisterWidgetEditor } from '../../../cms-admin/index';
import MeinchatChatWidgetEditorTab from './MeinchatChatWidgetEditorTab.vue';
import { DEFAULT_START_BUTTON_LABEL } from './meinchatChatWidgetOptions';

export function registerMeinchatChatWidgetEditor(
  registerWidgetEditor: typeof RegisterWidgetEditor,
): void {
  registerWidgetEditor({
    componentName: 'MeinchatChatWidget',

    defaultConfig: () => ({
      component_name: 'MeinchatChatWidget',
      member_nicknames: [],
      visibility: 'public',
      start_button_label: DEFAULT_START_BUTTON_LABEL,
      display: 'inline',
      open_by_default: false,
    }),

    generalTabComponent: MeinchatChatWidgetEditorTab,

    cssHint:
      'Target <code>.meinchat-chat-widget</code>, <code>.meinchat-chat-widget__header</code>, <code>.meinchat-chat-widget__start</code>.',

    buildPreview(config) {
      const title = (config.title as string) || 'Chat';
      const welcome = (config.welcome_message as string) || 'Hello! How can we help you today?';
      const placeholder = (config.composer_placeholder as string) || 'Type a message…';
      const startLabel = (config.start_button_label as string) || DEFAULT_START_BUTTON_LABEL;

      const html = `<div class="meinchat-chat-widget" style="max-width:420px;margin:0 auto;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;font-family:inherit">
  <div class="meinchat-chat-widget__header" style="padding:.75rem 1rem;background:#3498db;color:#fff;font-weight:600">${title}</div>
  <div class="meinchat-chat-widget__thread" style="padding:1rem;background:#f8fafc;min-height:120px">
    <div class="meinchat-chat-widget__bubble" style="display:inline-block;max-width:80%;padding:.5rem .75rem;background:#fff;border:1px solid #e2e8f0;border-radius:10px;font-size:.9rem;color:#1f2937">${welcome}</div>
  </div>
  <div class="meinchat-chat-widget__composer" style="display:flex;gap:.5rem;padding:.75rem 1rem;border-top:1px solid #e2e8f0;background:#fff">
    <input type="text" disabled placeholder="${placeholder}" style="flex:1;padding:.5rem .75rem;border:1px solid #cbd5e1;border-radius:6px;font-size:.9rem;background:#f1f5f9">
    <button disabled style="padding:.5rem .9rem;background:#cbd5e1;color:#fff;border:none;border-radius:6px;font-size:.9rem">Send</button>
  </div>
  <div style="padding:.75rem 1rem;border-top:1px solid #e2e8f0;background:#fff;text-align:center">
    <button class="meinchat-chat-widget__start" style="padding:.6rem 1.25rem;background:#3498db;color:#fff;border:none;border-radius:6px;font-size:.95rem;font-weight:600;cursor:pointer">${startLabel}</button>
  </div>
</div>`;
      return { html };
    },
  });
}
