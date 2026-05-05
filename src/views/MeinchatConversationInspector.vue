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
      <table
        class="cms-table"
        data-testid="conv-messages"
      >
        <thead>
          <tr>
            <th>{{ $t('meinchatAdmin.conversation.col.sender', 'Sender') }}</th>
            <th>{{ $t('meinchatAdmin.conversation.col.time', 'Time') }}</th>
            <th>{{ $t('meinchatAdmin.conversation.col.kind', 'Kind') }}</th>
            <th>{{ $t('meinchatAdmin.conversation.col.message', 'Message') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="msg in data.messages"
            :key="msg.id"
            :class="{ 'is-system': msg.system_kind }"
            data-testid="conv-message-row"
          >
            <td class="meinchat-admin-conv__sender">
              @{{ msg.sender_nickname }}
            </td>
            <td class="cms-table__mono">
              {{ fmt(msg.sent_at) }}
            </td>
            <td>
              <span
                v-if="msg.system_kind"
                class="badge"
              >{{ msg.system_kind }}</span>
            </td>
            <td>
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
            </td>
          </tr>
          <tr v-if="!data.messages.length">
            <td
              colspan="4"
              class="cms-table__empty"
            >
              {{ $t('meinchatAdmin.conversation.empty', 'No messages.') }}
            </td>
          </tr>
        </tbody>
      </table>
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
.cms-list__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 0.75rem; }
.cms-list__header h1 { margin: 0; font-size: 1.25rem; color: var(--admin-heading, #2c3e50); }

.cms-table { width: 100%; border-collapse: collapse; }
.cms-table th, .cms-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid var(--admin-border-light, #eee); font-size: 14px; color: var(--admin-text, #333); vertical-align: top; }
.cms-table th { background: var(--admin-th-bg, #f8f9fa); font-weight: 600; color: var(--admin-heading, #2c3e50); }
.cms-table__empty { text-align: center; color: var(--admin-muted, #666); padding: 40px; }
.cms-table__mono { font-family: 'SF Mono', ui-monospace, monospace; font-size: 0.8rem; color: var(--admin-text-muted, #666); white-space: nowrap; }

.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background: var(--admin-card-bg, #f3f4f6);
  color: var(--admin-text, #333);
  font-style: italic;
}

.btn { padding: 8px 16px; border: 1px solid var(--admin-border, #e0e0e0); border-radius: 4px; background: var(--admin-card-bg, #fff); color: var(--admin-text, #333); cursor: pointer; font-size: 14px; }
.btn--primary { background: var(--admin-success, #27ae60); color: #fff; border-color: var(--admin-success, #27ae60); }
.btn--primary:hover { background: var(--admin-success-hover, #1e8449); }

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
.meinchat-admin-conv__sender { font-weight: 600; color: var(--admin-text, #333); white-space: nowrap; }
.meinchat-admin-conv__body {
  white-space: pre-wrap; margin: 0;
  font-family: inherit; color: var(--admin-text, #333);
}
.meinchat-admin-conv__attach img { max-width: 220px; border-radius: 6px; margin: 0 0 0.3rem; display: block; }
.is-system td { background: rgba(0, 0, 0, 0.02); }
.cms-error { color: var(--admin-danger, #e74c3c); padding: 0.6rem; }
</style>
