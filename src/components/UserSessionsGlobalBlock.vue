<template>
  <div
    class="mc-sessions-card"
    data-testid="meinchat-user-sessions-global"
  >
    <h4 class="mc-sessions-card__title">
      {{ $t('meinchatAdmin.sessions.title') }}
    </h4>
    <p class="mc-sessions-card__desc">
      {{ $t('meinchatAdmin.sessions.description') }}
    </p>

    <div class="mc-sessions-card__actions">
      <button
        type="button"
        class="btn btn--danger"
        data-testid="clear-all-guest-sessions"
        :disabled="busy"
        @click="onClearAllGuestSessions"
      >
        {{ $t('meinchatAdmin.sessions.clearAllGuests') }}
      </button>
      <button
        type="button"
        class="btn"
        data-testid="reset-all-guest-tokens"
        :disabled="busy"
        @click="onResetAllGuestTokens"
      >
        {{ $t('meinchatAdmin.sessions.resetAllTokens') }}
      </button>
    </div>

    <p
      v-if="clearResult"
      class="mc-sessions-card__result"
      data-testid="clear-guests-result"
    >
      {{
        $t('meinchatAdmin.sessions.clearAllGuestsResult', {
          guests: clearResult.guests,
          conversations: clearResult.conversations,
          rooms: clearResult.rooms,
          sessions: clearResult.sessions,
        })
      }}
    </p>
    <p
      v-if="resetAffected !== null"
      class="mc-sessions-card__result"
      data-testid="reset-tokens-result"
    >
      {{ $t('meinchatAdmin.sessions.resetAllTokensResult', { affected: resetAffected }) }}
    </p>
    <p
      v-if="errorMessage"
      class="mc-sessions-card__error"
      data-testid="user-sessions-error"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  type ClearGuestSessionsResult,
  clearAllGuestSessions,
  setAllGuestTokens,
} from '../api';

const { t } = useI18n();

const busy = ref(false);
const clearResult = ref<ClearGuestSessionsResult | null>(null);
const resetAffected = ref<number | null>(null);
const errorMessage = ref<string | null>(null);

function readError(err: unknown): string {
  if (err && typeof err === 'object' && 'error' in err) {
    return String((err as { error: unknown }).error);
  }
  return t('meinchatAdmin.sessions.failed');
}

async function onClearAllGuestSessions() {
  if (!window.confirm(t('meinchatAdmin.sessions.clearAllGuestsConfirm'))) return;
  busy.value = true;
  errorMessage.value = null;
  try {
    clearResult.value = await clearAllGuestSessions();
  } catch (err: unknown) {
    errorMessage.value = readError(err);
  } finally {
    busy.value = false;
  }
}

async function onResetAllGuestTokens() {
  if (!window.confirm(t('meinchatAdmin.sessions.resetAllTokensConfirm'))) return;
  busy.value = true;
  errorMessage.value = null;
  try {
    const result = await setAllGuestTokens({ mode: 'reset' });
    resetAffected.value = result.affected;
  } catch (err: unknown) {
    errorMessage.value = readError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.mc-sessions-card {
  border: 1px solid var(--admin-border-light, #eee);
  border-radius: 6px;
  padding: 16px 18px;
  margin-bottom: 16px;
  background: var(--admin-card-bg, #fff);
}
.mc-sessions-card__title { margin: 0 0 6px; font-size: 1rem; color: var(--admin-heading, #2c3e50); }
.mc-sessions-card__desc { margin: 0 0 14px; color: var(--admin-text-muted, #666); font-size: 0.85rem; }
.mc-sessions-card__actions { display: flex; gap: 10px; flex-wrap: wrap; }
.mc-sessions-card__result { margin: 12px 0 0; color: var(--admin-text, #333); font-size: 0.85rem; }
.mc-sessions-card__error { margin: 12px 0 0; color: var(--admin-danger, #c0392b); font-size: 0.85rem; }
.btn { padding: 8px 16px; border: 1px solid var(--admin-border, #e0e0e0); border-radius: 4px; background: var(--admin-card-bg, #fff); color: var(--admin-text, #333); cursor: pointer; font-size: 14px; }
.btn--danger { border-color: var(--admin-danger, #c0392b); color: var(--admin-danger, #c0392b); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
