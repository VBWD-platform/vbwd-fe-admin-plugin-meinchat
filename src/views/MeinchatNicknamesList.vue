<template>
  <div
    class="cms-view cms-list"
    data-testid="meinchat-admin-nicknames"
  >
    <div class="cms-list__header">
      <h1>{{ $t('meinchatAdmin.nicknames.title') }}</h1>
      <div class="cms-list__actions">
        <input
          v-model="filter"
          type="search"
          :placeholder="$t('meinchatAdmin.nicknames.search')"
          class="cms-list__search"
          @input="onFilterInput"
        >
      </div>
    </div>

    <table class="cms-table">
      <thead>
        <tr>
          <th>{{ $t('meinchatAdmin.nicknames.col.nickname') }}</th>
          <th>{{ $t('meinchatAdmin.nicknames.col.userId') }}</th>
          <th>{{ $t('meinchatAdmin.nicknames.col.status') }}</th>
          <th>{{ $t('meinchatAdmin.nicknames.col.set') }}</th>
          <th>{{ $t('meinchatAdmin.nicknames.col.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in items"
          :key="row.id"
          data-testid="meinchat-admin-nickname-row"
        >
          <td>@{{ row.nickname }}</td>
          <td class="cms-table__mono">
            {{ row.user_id.slice(0, 8) }}…
          </td>
          <td>
            <span
              v-if="row.banned"
              class="badge badge--danger"
              data-testid="status-banned"
            >{{ $t('meinchatAdmin.nicknames.banned') }}</span>
            <span
              v-else
              class="badge"
              data-testid="status-active"
            >{{ $t('meinchatAdmin.nicknames.active') }}</span>
          </td>
          <td>{{ fmtDate(row.set_at) }}</td>
          <td>
            <button
              v-if="!row.banned"
              type="button"
              class="btn btn--danger btn--sm"
              data-testid="btn-ban"
              @click="onBan(row)"
            >
              {{ $t('meinchatAdmin.nicknames.ban') }}
            </button>
            <button
              v-else
              type="button"
              class="btn btn--sm"
              data-testid="btn-unban"
              @click="onUnban(row)"
            >
              {{ $t('meinchatAdmin.nicknames.unban') }}
            </button>
          </td>
        </tr>
        <tr v-if="!items.length && !loading">
          <td
            colspan="5"
            class="cms-table__empty"
          >
            {{ $t('meinchatAdmin.nicknames.empty') }}
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
import {
  type AdminNicknameRow,
  banNickname,
  listNicknames,
  unbanNickname,
} from '../api';

const items = ref<AdminNicknameRow[]>([]);
const total = ref(0);
const page = ref(1);
const perPage = ref(50);
const loading = ref(false);
const filter = ref('');

const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / perPage.value)),
);

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
    const result = await listNicknames({
      page: page.value,
      per_page: perPage.value,
      q: filter.value.trim() || undefined,
    });
    items.value = result.items;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

async function onBan(row: AdminNicknameRow) {
  if (!confirm(`Ban @${row.nickname}?`)) return;
  try {
    const updated = await banNickname(row.user_id);
    Object.assign(row, updated);
  } catch (err: any) {
    alert(err?.error ?? 'Ban failed');
  }
}

async function onUnban(row: AdminNicknameRow) {
  try {
    const updated = await unbanNickname(row.user_id);
    Object.assign(row, updated);
  } catch (err: any) {
    alert(err?.error ?? 'Unban failed');
  }
}

function fmtDate(s: string | null) {
  return s ? new Date(s).toLocaleDateString() : '';
}

onMounted(fetch);
</script>

<style scoped>
.cms-list__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 0.75rem; }
.cms-list__header h1 { margin: 0; font-size: 1.25rem; color: var(--admin-heading, #2c3e50); }
.cms-list__actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.cms-list__search { padding: 8px 12px; border: 1px solid var(--admin-input-border, #ddd); border-radius: 4px; font-size: 14px; width: 220px; background: var(--admin-card-bg, #fff); color: var(--admin-text, #333); }
.cms-list__search:focus { outline: none; border-color: var(--admin-focus, #3498db); }
.cms-list__pagination { display: flex; align-items: center; gap: 12px; justify-content: center; margin-top: 20px; }
.cms-list__pagination button { padding: 8px 14px; border: 1px solid var(--admin-input-border, #ddd); border-radius: 4px; background: var(--admin-card-bg, #fff); color: var(--admin-text, #333); cursor: pointer; font-size: 14px; }
.cms-list__pagination button:disabled { opacity: 0.4; cursor: default; }
.cms-list__pagination button:not(:disabled):hover { background: var(--admin-th-bg, #f8f9fa); }

.cms-table { width: 100%; border-collapse: collapse; }
.cms-table th, .cms-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid var(--admin-border-light, #eee); font-size: 14px; color: var(--admin-text, #333); }
.cms-table th { background: var(--admin-th-bg, #f8f9fa); font-weight: 600; color: var(--admin-heading, #2c3e50); }
.cms-table__empty { text-align: center; color: var(--admin-muted, #666); padding: 40px; }
.cms-table__mono { font-family: 'SF Mono', ui-monospace, monospace; font-size: 0.8rem; color: var(--admin-text-muted, #666); }

.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background: var(--admin-card-bg, #f3f4f6);
  color: var(--admin-text, #333);
}
.badge--danger {
  background: var(--admin-danger, #fee2e2);
  color: var(--admin-danger-fg, #991b1b);
}

.btn { padding: 8px 16px; border: 1px solid var(--admin-border, #e0e0e0); border-radius: 4px; background: var(--admin-card-bg, #fff); color: var(--admin-text, #333); cursor: pointer; font-size: 14px; }
.btn--sm { padding: 0.3rem 0.7rem; font-size: 0.8rem; }
.btn--danger { background: var(--admin-danger, #e74c3c); color: #fff; border-color: var(--admin-danger, #e74c3c); }
button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
