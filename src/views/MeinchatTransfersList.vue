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
.cms-table__num { text-align: right; font-variant-numeric: tabular-nums; }
.cms-list__total { color: var(--admin-text-muted, #666); font-size: 0.85rem; }
</style>
