/**
 * Thin admin-API wrappers for meinchat moderation.
 *
 * All endpoints under `/api/v1/admin/meinchat/*` require admin role
 * AND one of the `meinchat.*` permissions declared by the backend
 * plugin's `admin_permissions` property.
 */

export interface AdminNicknameRow {
  id: string;
  user_id: string;
  nickname: string;
  banned: boolean;
  search_hidden: boolean;
  set_at: string | null;
  banned_at: string | null;
}

export interface AdminTransferRow {
  id: string;
  sender_user_id: string;
  recipient_user_id: string;
  amount: number;
  note: string | null;
  executed_at: string | null;
  sender_nickname: string | null;
  recipient_nickname: string | null;
}

export interface AdminGuestRow {
  guest_user_id: string;
  display_name: string;
  widget_slug: string;
  balance: number;
  last_seen: string | null;
}

/** Token mutation mode: top-up ADDS N tokens, reset SETS the balance to N. */
export type GuestTokenMode = 'topup' | 'reset';

export interface GuestTokenChange {
  mode: GuestTokenMode;
  /** Omit (undefined) to use the configured guest_initial_tokens default. */
  amount?: number;
}

export interface GuestTokenResult {
  guest_user_id: string;
  balance: number;
}

export interface BulkGuestTokenResult {
  affected: number;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  per_page: number;
  total: number;
}


function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('admin_token') ?? ''}`,
  };
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw body;
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

// ── nicknames ───────────────────────────────────────────────────────────────

export async function listNicknames(opts: {
  page?: number;
  per_page?: number;
  q?: string;
} = {}): Promise<PagedResponse<AdminNicknameRow>> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.per_page) params.set('per_page', String(opts.per_page));
  if (opts.q) params.set('q', opts.q);
  const qs = params.toString();
  const res = await fetch(
    `/api/v1/admin/meinchat/nicknames${qs ? `?${qs}` : ''}`,
    { headers: authHeaders() },
  );
  return jsonOrThrow<PagedResponse<AdminNicknameRow>>(res);
}

export async function banNickname(userId: string): Promise<AdminNicknameRow> {
  const res = await fetch(
    `/api/v1/admin/meinchat/nicknames/${userId}/ban`,
    { method: 'POST', headers: authHeaders() },
  );
  return jsonOrThrow<AdminNicknameRow>(res);
}

export async function unbanNickname(userId: string): Promise<AdminNicknameRow> {
  const res = await fetch(
    `/api/v1/admin/meinchat/nicknames/${userId}/unban`,
    { method: 'POST', headers: authHeaders() },
  );
  return jsonOrThrow<AdminNicknameRow>(res);
}

// ── transfers ───────────────────────────────────────────────────────────────

export async function listTransfers(opts: {
  page?: number;
  per_page?: number;
} = {}): Promise<PagedResponse<AdminTransferRow>> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.per_page) params.set('per_page', String(opts.per_page));
  const qs = params.toString();
  const res = await fetch(
    `/api/v1/admin/meinchat/transfers${qs ? `?${qs}` : ''}`,
    { headers: authHeaders() },
  );
  return jsonOrThrow<PagedResponse<AdminTransferRow>>(res);
}

// ── guests ──────────────────────────────────────────────────────────────────

/**
 * Build the token-change request body. A missing `amount` is left OUT of the
 * payload entirely so the backend falls back to the configured
 * `guest_initial_tokens` default.
 */
function guestTokenBody(change: GuestTokenChange): Record<string, unknown> {
  const body: Record<string, unknown> = { mode: change.mode };
  if (change.amount !== undefined) {
    body.amount = change.amount;
  }
  return body;
}

export async function listGuests(opts: {
  page?: number;
  per_page?: number;
  q?: string;
} = {}): Promise<PagedResponse<AdminGuestRow>> {
  const params = new URLSearchParams();
  if (opts.page) params.set('page', String(opts.page));
  if (opts.per_page) params.set('per_page', String(opts.per_page));
  if (opts.q) params.set('q', opts.q);
  const qs = params.toString();
  const res = await fetch(
    `/api/v1/admin/meinchat/guests${qs ? `?${qs}` : ''}`,
    { headers: authHeaders() },
  );
  return jsonOrThrow<PagedResponse<AdminGuestRow>>(res);
}

export async function setGuestTokens(
  guestUserId: string,
  change: GuestTokenChange,
): Promise<GuestTokenResult> {
  const res = await fetch(
    `/api/v1/admin/meinchat/guests/${guestUserId}/tokens`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(guestTokenBody(change)),
    },
  );
  return jsonOrThrow<GuestTokenResult>(res);
}

export async function setAllGuestTokens(
  change: GuestTokenChange,
): Promise<BulkGuestTokenResult> {
  const res = await fetch(
    '/api/v1/admin/meinchat/guests/tokens',
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(guestTokenBody(change)),
    },
  );
  return jsonOrThrow<BulkGuestTokenResult>(res);
}
