/**
 * Static option lists + defaults for the MeinchatChatWidget editor (D3).
 *
 * Per [[reference_admin_config_select_static_only]] the visibility/display
 * selects are driven by static arrays — no live-catalogue dropdown.
 */
export const VISIBILITY_OPTIONS = ['public', 'logged_in'] as const;
export const DISPLAY_OPTIONS = ['inline', 'dock'] as const;
export const DEFAULT_START_BUTTON_LABEL = 'Start Conversation';
