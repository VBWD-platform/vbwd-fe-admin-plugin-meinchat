<template>
  <div
    class="cms-view cms-list"
    data-testid="meinchat-admin-guests"
  >
    <div class="cms-list__header">
      <h1>{{ $t('meinchatAdmin.guests.title') }}</h1>
      <div class="cms-list__actions">
        <input
          v-model="filter"
          type="search"
          :placeholder="$t('meinchatAdmin.guests.search')"
          class="cms-list__search"
          @input="onFilterInput"
        >
      </div>
    </div>

    <div
      class="cms-bulk"
      data-testid="meinchat-admin-guests-bulk"
    >
      <span class="cms-bulk__label">{{ $t('meinchatAdmin.guests.bulkTitle') }}</span>
      <select
        v-model="bulkMode"
        class="cms-bulk__mode"
        data-testid="bulk-mode"
      >
        <option value="topup">
          {{ $t('meinchatAdmin.guests.mode.topup') }}
        </option>
        <option value="reset">
          {{ $t('meinchatAdmin.guests.mode.reset') }}
        </option>
      </select>
      <input
        v-model="bulkAmount"
        type="number"
        min="0"
        class="cms-bulk__amount"
        :placeholder="$t('meinchatAdmin.guests.amountDefault')"
        data-testid="bulk-amount"
      >
      <button
        type="button"
        class="btn btn--sm"
        data-testid="bulk-apply"
        @click="onBulkApply"
      >
        {{ $t('meinchatAdmin.guests.applyAll') }}
      </button>
      <span
        v-if="bulkResult !== null"
        class="cms-bulk__result"
        data-testid="bulk-result"
      >
        {{ $t('meinchatAdmin.guests.affected', { count: bulkResult }) }}
      </span>
    </div>
    <p class="cms-list__hint">
      {{ $t('meinchatAdmin.guests.hint') }}
    </p>

    <table class="cms-table">
      <thead>
        <tr>
          <th>{{ $t('meinchatAdmin.guests.col.displayName') }}</th>
          <th>{{ $t('meinchatAdmin.guests.col.widget') }}</th>
          <th class="cms-table__num">
            {{ $t('meinchatAdmin.guests.col.balance') }}
          </th>
          <th>{{ $t('meinchatAdmin.guests.col.lastSeen') }}</th>
          <th>{{ $t('meinchatAdmin.guests.col.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in items"
          :key="row.guest_user_id"
          data-testid="meinchat-admin-guest-row"
        >
          <td>{{ row.display_name }}</td>
          <td>{{ row.widget_slug }}</td>
          <td class="cms-table__num">
            {{ row.balance }}
          </td>
          <td>{{ fmtDate(row.last_seen) }}</td>
          <td>
            <div class="cms-row-action">
              <select
                v-model="rowMode[row.guest_user_id]"
                class="cms-row-action__mode"
                data-testid="guest-mode"
              >
                <option value="topup">
                  {{ $t('meinchatAdmin.guests.mode.topup') }}
                </option>
                <option value="reset">
                  {{ $t('meinchatAdmin.guests.mode.reset') }}
                </option>
              </select>
              <input
                v-model="rowAmount[row.guest_user_id]"
                type="number"
                min="0"
                class="cms-row-action__amount"
                :placeholder="$t('meinchatAdmin.guests.amountDefault')"
                data-testid="guest-amount"
              >
              <button
                type="button"
                class="btn btn--sm"
                data-testid="guest-apply"
                @click="onGuestApply(row)"
              >
                {{ $t('meinchatAdmin.guests.apply') }}
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!items.length && !loading">
          <td
            colspan="5"
            class="cms-table__empty"
          >
            {{ $t('meinchatAdmin.guests.empty') }}
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
import { computed, onMounted, reactive, ref } from 'vue';
import {
  type AdminGuestRow,
  type GuestTokenMode,
  listGuests,
  setAllGuestTokens,
  setGuestTokens,
} from '../api';

const items = ref<AdminGuestRow[]>([]);
const total = ref(0);
const page = ref(1);
const perPage = ref(50);
const loading = ref(false);
const filter = ref('');

// Per-row token-change controls, keyed by guest id. A blank amount string means
// "use the configured initial-grant default".
const rowMode = reactive<Record<string, GuestTokenMode>>({});
const rowAmount = reactive<Record<string, string | number>>({});

const bulkMode = ref<GuestTokenMode>('topup');
const bulkAmount = ref<string | number>('');
const bulkResult = ref<number | null>(null);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / perPage.value)),
);

/** Convert a blank amount field to undefined so the backend uses its default. */
function parseAmount(raw: string | number): number | undefined {
  const trimmed = String(raw ?? '').trim();
  if (trimmed === '') return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

let debounceTimer: ReturnType<typeof setTimeout>;
function onFilterInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    page.value = 1;
    fetch();
  }, 300);
}

async function fetch() {
  loading.value = true;
  try {
    const result = await listGuests({
      page: page.value,
      per_page: perPage.value,
      q: filter.value.trim() || undefined,
    });
    items.value = result.items;
    total.value = result.total;
    for (const guest of result.items) {
      if (rowMode[guest.guest_user_id] === undefined) {
        rowMode[guest.guest_user_id] = 'topup';
      }
      if (rowAmount[guest.guest_user_id] === undefined) {
        rowAmount[guest.guest_user_id] = '';
      }
    }
  } finally {
    loading.value = false;
  }
}

async function onGuestApply(row: AdminGuestRow) {
  try {
    await setGuestTokens(row.guest_user_id, {
      mode: rowMode[row.guest_user_id] ?? 'topup',
      amount: parseAmount(rowAmount[row.guest_user_id] ?? ''),
    });
    await fetch();
  } catch (err: any) {
    alert(err?.error ?? 'Token change failed');
  }
}

async function onBulkApply() {
  try {
    const result = await setAllGuestTokens({
      mode: bulkMode.value,
      amount: parseAmount(bulkAmount.value),
    });
    bulkResult.value = result.affected;
    await fetch();
  } catch (err: any) {
    alert(err?.error ?? 'Bulk token change failed');
  }
}

function fmtDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : '';
}

onMounted(fetch);
</script>

<style scoped>
.cms-list__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 0.75rem; }
.cms-list__header h1 { margin: 0; font-size: 1.25rem; color: var(--admin-heading, #2c3e50); }
.cms-list__actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.cms-list__search { padding: 8px 12px; border: 1px solid var(--admin-input-border, #ddd); border-radius: 4px; font-size: 14px; width: 220px; background: var(--admin-card-bg, #fff); color: var(--admin-text, #333); }
.cms-list__search:focus { outline: none; border-color: var(--admin-focus, #3498db); }
.cms-list__hint { color: var(--admin-text-muted, #666); font-size: 0.8rem; margin: 0 0 16px; }
.cms-list__pagination { display: flex; align-items: center; gap: 12px; justify-content: center; margin-top: 20px; }
.cms-list__pagination button { padding: 8px 14px; border: 1px solid var(--admin-input-border, #ddd); border-radius: 4px; background: var(--admin-card-bg, #fff); color: var(--admin-text, #333); cursor: pointer; font-size: 14px; }
.cms-list__pagination button:disabled { opacity: 0.4; cursor: default; }
.cms-list__pagination button:not(:disabled):hover { background: var(--admin-th-bg, #f8f9fa); }

.cms-bulk { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 12px 15px; margin-bottom: 8px; background: var(--admin-th-bg, #f8f9fa); border: 1px solid var(--admin-border-light, #eee); border-radius: 4px; }
.cms-bulk__label { font-weight: 600; color: var(--admin-heading, #2c3e50); font-size: 0.9rem; }
.cms-bulk__result { color: var(--admin-text-muted, #666); font-size: 0.85rem; }

.cms-row-action { display: flex; align-items: center; gap: 6px; }
.cms-bulk__mode, .cms-bulk__amount, .cms-row-action__mode, .cms-row-action__amount {
  padding: 0.3rem 0.5rem; border: 1px solid var(--admin-input-border, #ddd); border-radius: 4px; font-size: 0.85rem; background: var(--admin-card-bg, #fff); color: var(--admin-text, #333);
}
.cms-bulk__amount, .cms-row-action__amount { width: 90px; }

.cms-table { width: 100%; border-collapse: collapse; }
.cms-table th, .cms-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid var(--admin-border-light, #eee); font-size: 14px; color: var(--admin-text, #333); }
.cms-table th { background: var(--admin-th-bg, #f8f9fa); font-weight: 600; color: var(--admin-heading, #2c3e50); }
.cms-table__empty { text-align: center; color: var(--admin-muted, #666); padding: 40px; }
.cms-table th.cms-table__num,
.cms-table td.cms-table__num { text-align: right; font-variant-numeric: tabular-nums; }

.btn { padding: 8px 16px; border: 1px solid var(--admin-border, #e0e0e0); border-radius: 4px; background: var(--admin-card-bg, #fff); color: var(--admin-text, #333); cursor: pointer; font-size: 14px; }
.btn--sm { padding: 0.3rem 0.7rem; font-size: 0.8rem; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
