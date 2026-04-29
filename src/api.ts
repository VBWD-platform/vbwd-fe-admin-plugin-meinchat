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

export interface AdminConversationInspectionMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_nickname: string;
  body: string;
  attachment_url: string | null;
  attachment_thumb_url: string | null;
  sent_at: string | null;
  read_at: string | null;
  system_kind: string | null;
}

export interface AdminConversationInspection {
  conversation: {
    id: string;
    participant_low_id: string;
    participant_high_id: string;
    participant_low_nickname: string | null;
    participant_high_nickname: string | null;
    last_message_at: string | null;
    last_message_preview: string | null;
    unread_low_count: number;
    unread_high_count: number;
  };
  messages: AdminConversationInspectionMessage[];
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

// ── conversations ───────────────────────────────────────────────────────────

export async function inspectConversation(
  conversationId: string,
): Promise<AdminConversationInspection> {
  const res = await fetch(
    `/api/v1/admin/meinchat/conversations/${conversationId}`,
    { headers: authHeaders() },
  );
  return jsonOrThrow<AdminConversationInspection>(res);
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
