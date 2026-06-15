<template>
  <div class="field-group">
    <label class="field-label">{{ t('meinchatAdmin.widget.title') }}</label>
    <input
      :value="cfg.title"
      class="field-input"
      type="text"
      :placeholder="t('meinchatAdmin.widget.titlePlaceholder')"
      @input="set('title', ($event.target as HTMLInputElement).value)"
    >
  </div>

  <div class="field-group">
    <label class="field-label">{{ t('meinchatAdmin.widget.memberNicknames') }}</label>
    <input
      data-test="member-nicknames"
      :value="memberNicknamesText"
      class="field-input"
      type="text"
      :placeholder="t('meinchatAdmin.widget.memberNicknamesPlaceholder')"
      @input="setMemberNicknames(($event.target as HTMLInputElement).value)"
    >
    <p class="field-hint">
      {{ t('meinchatAdmin.widget.memberNicknamesHint') }}
    </p>
  </div>

  <div class="field-group">
    <label class="field-label">{{ t('meinchatAdmin.widget.visibility') }}</label>
    <select
      data-test="visibility"
      :value="cfg.visibility"
      class="field-input"
      @change="set('visibility', ($event.target as HTMLSelectElement).value)"
    >
      <option
        v-for="visibilityOption in VISIBILITY_OPTIONS"
        :key="visibilityOption"
        :value="visibilityOption"
      >
        {{ t(`meinchatAdmin.widget.visibilityOption.${visibilityOption}`) }}
      </option>
    </select>
  </div>

  <div class="field-group">
    <label class="field-label">{{ t('meinchatAdmin.widget.welcomeMessage') }}</label>
    <input
      :value="cfg.welcome_message"
      class="field-input"
      type="text"
      :placeholder="t('meinchatAdmin.widget.welcomeMessagePlaceholder')"
      @input="set('welcome_message', ($event.target as HTMLInputElement).value)"
    >
  </div>

  <div class="field-group">
    <label class="field-label">{{ t('meinchatAdmin.widget.composerPlaceholder') }}</label>
    <input
      :value="cfg.composer_placeholder"
      class="field-input"
      type="text"
      :placeholder="t('meinchatAdmin.widget.composerPlaceholderPlaceholder')"
      @input="set('composer_placeholder', ($event.target as HTMLInputElement).value)"
    >
  </div>

  <div class="field-group">
    <label class="field-label">{{ t('meinchatAdmin.widget.startButtonLabel') }}</label>
    <input
      :value="cfg.start_button_label"
      class="field-input"
      type="text"
      :placeholder="DEFAULT_START_BUTTON_LABEL"
      @input="set('start_button_label', ($event.target as HTMLInputElement).value)"
    >
  </div>

  <div class="field-group">
    <label class="field-label">{{ t('meinchatAdmin.widget.display') }}</label>
    <select
      data-test="display"
      :value="cfg.display"
      class="field-input"
      @change="set('display', ($event.target as HTMLSelectElement).value)"
    >
      <option
        v-for="displayOption in DISPLAY_OPTIONS"
        :key="displayOption"
        :value="displayOption"
      >
        {{ t(`meinchatAdmin.widget.displayOption.${displayOption}`) }}
      </option>
    </select>
  </div>

  <div class="field-group">
    <label class="field-label">
      <input
        :checked="cfg.open_by_default === true"
        type="checkbox"
        @change="set('open_by_default', ($event.target as HTMLInputElement).checked)"
      >
      {{ t('meinchatAdmin.widget.openByDefault') }}
    </label>
  </div>

  <div class="field-group">
    <label class="field-label">{{ t('meinchatAdmin.widget.initialTokens') }}</label>
    <input
      data-test="initial-tokens"
      :value="cfg.guest_initial_tokens"
      class="field-input"
      type="number"
      min="0"
      @input="setNumber('guest_initial_tokens', ($event.target as HTMLInputElement).value)"
    >
    <p class="field-hint">
      {{ t('meinchatAdmin.widget.initialTokensHint') }}
    </p>
  </div>

  <div class="field-group">
    <label class="field-label">{{ t('meinchatAdmin.widget.costPerWord') }}</label>
    <input
      data-test="cost-per-word"
      :value="cfg.guest_token_cost_per_word"
      class="field-input"
      type="number"
      min="0"
      @input="setNumber('guest_token_cost_per_word', ($event.target as HTMLInputElement).value)"
    >
    <p class="field-hint">
      {{ t('meinchatAdmin.widget.costPerWordHint') }}
    </p>
  </div>

  <div class="field-group">
    <label class="field-label">{{ t('meinchatAdmin.widget.buyTokensHref') }}</label>
    <input
      data-test="buy-tokens-href"
      :value="cfg.buy_tokens_href"
      class="field-input"
      type="text"
      :placeholder="t('meinchatAdmin.widget.buyTokensHrefPlaceholder')"
      @input="set('buy_tokens_href', ($event.target as HTMLInputElement).value)"
    >
    <p class="field-hint">
      {{ t('meinchatAdmin.widget.buyTokensHrefHint') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { VISIBILITY_OPTIONS, DISPLAY_OPTIONS, DEFAULT_START_BUTTON_LABEL } from './meinchatChatWidgetOptions';

const props = defineProps<{ config: Record<string, unknown> }>();
const emit = defineEmits<{ (e: 'update:config', val: Record<string, unknown>): void }>();

const { t } = useI18n();

const cfg = computed(() => props.config);

const memberNicknamesText = computed<string>(() => {
  const value = props.config.member_nicknames;
  return Array.isArray(value) ? (value as string[]).join(', ') : '';
});

function set(key: string, value: unknown) {
  emit('update:config', { ...props.config, [key]: value });
}

function setNumber(key: string, rawValue: string) {
  const parsed = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsed)) {
    return;
  }
  set(key, Math.max(0, parsed));
}

function setMemberNicknames(rawText: string) {
  const nicknames = rawText
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  set('member_nicknames', nicknames);
}
</script>

<style scoped>
.field-hint {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: var(--vbwd-text-muted, #6b7280);
}
</style>
