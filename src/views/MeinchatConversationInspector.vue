<template>
  <div
    class="cms-view"
    data-testid="meinchat-admin-conv-inspector"
  >
    <div class="cms-list__header">
      <h1>{{ $t('meinchatAdmin.conversation.title') }}</h1>
    </div>

    <div class="meinchat-admin-search">
      <input
        v-model="convId"
        type="text"
        :placeholder="$t('meinchatAdmin.conversation.idPlaceholder')"
        data-testid="conv-id-input"
        @keydown.enter="onLoad"
      >
      <button
        type="button"
        class="btn btn--primary"
        data-testid="conv-load"
        @click="onLoad"
      >
        {{ $t('meinchatAdmin.conversation.load') }}
      </button>
    </div>

    <p
      v-if="error"
      class="cms-error"
    >
      {{ error }}
    </p>

    <div
      v-if="data"
      class="meinchat-admin-conv"
    >
      <header class="meinchat-admin-conv__header">
        <strong>@{{ data.conversation.participant_low_nickname || '?' }}</strong>
        ↔
        <strong>@{{ data.conversation.participant_high_nickname || '?' }}</strong>
        <span class="meinchat-admin-conv__meta">
          {{ data.messages.length }} {{ $t('meinchatAdmin.conversation.messages') }} ·
          {{ $t('meinchatAdmin.conversation.lastAt') }}: {{ fmt(data.conversation.last_message_at) }}
        </span>
      </header>
      <ol
        class="meinchat-admin-conv__list"
        data-testid="conv-messages"
      >
        <li
          v-for="msg in data.messages"
          :key="msg.id"
          :class="{ 'is-system': msg.system_kind }"
          data-testid="conv-message-row"
        >
          <div class="meinchat-admin-conv__row">
            <span class="meinchat-admin-conv__sender">@{{ msg.sender_nickname }}</span>
            <span class="meinchat-admin-conv__time">{{ fmt(msg.sent_at) }}</span>
            <span
              v-if="msg.system_kind"
              class="meinchat-admin-conv__kind"
            >[{{ msg.system_kind }}]</span>
          </div>
          <div
            v-if="msg.attachment_url"
            class="meinchat-admin-conv__attach"
          >
            <a
              :href="msg.attachment_url"
              target="_blank"
              rel="noopener"
            >
              <img
                :src="msg.attachment_thumb_url || msg.attachment_url"
                alt="attachment"
              >
            </a>
          </div>
          <pre class="meinchat-admin-conv__body">{{ msg.body }}</pre>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { type AdminConversationInspection, inspectConversation } from '../api';

const route = useRoute();
const convId = ref('');
const data = ref<AdminConversationInspection | null>(null);
const error = ref('');

watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string' && id.length > 0) {
      convId.value = id;
      onLoad();
    }
  },
  { immediate: true },
);

async function onLoad() {
  error.value = '';
  data.value = null;
  if (!convId.value.trim()) return;
  try {
    data.value = await inspectConversation(convId.value.trim());
  } catch (err: any) {
    error.value = err?.error ?? 'Failed to load conversation';
  }
}

function fmt(s: string | null) {
  return s ? new Date(s).toLocaleString() : '';
}
</script>

<style scoped>
.meinchat-admin-search {
  display: flex; gap: 0.5rem; padding: 1rem 0;
}
.meinchat-admin-search input {
  flex: 1; padding: 0.5rem 0.7rem;
  border: 1px solid var(--admin-input-border, #ddd);
  border-radius: 4px;
  font-family: 'SF Mono', ui-monospace, monospace;
}
.meinchat-admin-conv__header {
  display: flex; gap: 0.5rem; align-items: baseline; flex-wrap: wrap;
  padding: 0.5rem 0; border-bottom: 1px solid var(--admin-border-light, #eee);
  margin-bottom: 0.6rem;
}
.meinchat-admin-conv__meta { color: var(--admin-text-muted, #666); font-size: 0.85rem; }
.meinchat-admin-conv__list { list-style: none; margin: 0; padding: 0; }
.meinchat-admin-conv__list li {
  border-bottom: 1px solid var(--admin-border-light, #eee);
  padding: 0.7rem 0;
}
.meinchat-admin-conv__list li.is-system { background: rgba(0, 0, 0, 0.02); }
.meinchat-admin-conv__row {
  display: flex; gap: 0.5rem; font-size: 0.85rem; color: var(--admin-text-muted, #666);
}
.meinchat-admin-conv__sender { font-weight: 600; color: var(--admin-text, #333); }
.meinchat-admin-conv__kind { font-style: italic; }
.meinchat-admin-conv__body {
  white-space: pre-wrap; margin: 0.3rem 0 0;
  font-family: inherit; color: var(--admin-text, #333);
}
.meinchat-admin-conv__attach img { max-width: 220px; border-radius: 6px; margin: 0.3rem 0; }
.cms-error { color: var(--admin-danger, #e74c3c); padding: 0.6rem; }
</style>
