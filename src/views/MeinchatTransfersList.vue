<template>
  <div
    class="cms-view cms-list"
    data-testid="meinchat-admin-transfers"
  >
    <div class="cms-list__header">
      <h1>{{ $t('meinchatAdmin.transfers.title') }}</h1>
      <div class="cms-list__actions">
        <span class="cms-list__total">
          {{ $t('meinchatAdmin.transfers.totalCount', { count: total }) }}
        </span>
      </div>
    </div>

    <table class="cms-table">
      <thead>
        <tr>
          <th>{{ $t('meinchatAdmin.transfers.col.executedAt') }}</th>
          <th>{{ $t('meinchatAdmin.transfers.col.from') }}</th>
          <th>{{ $t('meinchatAdmin.transfers.col.to') }}</th>
          <th class="cms-table__num">
            {{ $t('meinchatAdmin.transfers.col.amount') }}
          </th>
          <th>{{ $t('meinchatAdmin.transfers.col.note') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in items"
          :key="row.id"
          data-testid="transfer-row"
        >
          <td>{{ fmt(row.executed_at) }}</td>
          <td>@{{ row.sender_nickname || '?' }}</td>
          <td>@{{ row.recipient_nickname || '?' }}</td>
          <td class="cms-table__num">
            {{ row.amount }}
          </td>
          <td>{{ row.note || '' }}</td>
        </tr>
        <tr v-if="!items.length">
          <td
            colspan="5"
            class="cms-table__empty"
          >
            {{ $t('meinchatAdmin.transfers.empty') }}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="cms-list__pagination">
      <button
        :disabled="page <= 1"
        @click="page--; fetch()"
      >
        ‹ {{ $t('meinchatAdmin.prev') }}
      </button>
      <span>{{ $t('meinchatAdmin.pageOf', { page, total: totalPages }) }}</span>
      <button
        :disabled="page >= totalPages"
        @click="page++; fetch()"
      >
        {{ $t('meinchatAdmin.next') }} ›
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { type AdminTransferRow, listTransfers } from '../api';

const items = ref<AdminTransferRow[]>([]);
const total = ref(0);
const page = ref(1);
const perPage = ref(50);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / perPage.value)),
);

async function fetch() {
  const result = await listTransfers({ page: page.value, per_page: perPage.value });
  items.value = result.items;
  total.value = result.total;
}

function fmt(s: string | null) {
  return s ? new Date(s).toLocaleString() : '';
}

onMounted(fetch);
</script>

<style scoped>
.cms-list__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 0.75rem; }
.cms-list__header h1 { margin: 0; font-size: 1.25rem; color: var(--admin-heading, #2c3e50); }
.cms-list__actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.cms-list__total { color: var(--admin-text-muted, #666); font-size: 0.85rem; }
.cms-list__pagination { display: flex; align-items: center; gap: 12px; justify-content: center; margin-top: 20px; }
.cms-list__pagination button { padding: 8px 14px; border: 1px solid var(--admin-input-border, #ddd); border-radius: 4px; background: var(--admin-card-bg, #fff); color: var(--admin-text, #333); cursor: pointer; font-size: 14px; }
.cms-list__pagination button:disabled { opacity: 0.4; cursor: default; }
.cms-list__pagination button:not(:disabled):hover { background: var(--admin-th-bg, #f8f9fa); }

.cms-table { width: 100%; border-collapse: collapse; }
.cms-table th, .cms-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid var(--admin-border-light, #eee); font-size: 14px; color: var(--admin-text, #333); }
.cms-table th { background: var(--admin-th-bg, #f8f9fa); font-weight: 600; color: var(--admin-heading, #2c3e50); }
.cms-table__empty { text-align: center; color: var(--admin-muted, #666); padding: 40px; }
.cms-table th.cms-table__num,
.cms-table td.cms-table__num { text-align: right; font-variant-numeric: tabular-nums; }
</style>
