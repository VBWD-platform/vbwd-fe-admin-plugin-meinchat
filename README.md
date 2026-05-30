# meinchat-admin — fe-admin plugin

Admin moderation surface for the meinchat backend bundle.

## Routes

Mounted as children of the admin layout, so paths are relative:

- `meinchat/nicknames` — paged table of every nickname (banned + active).
  Filter by substring; ban / unban buttons inline.
- `meinchat/transfers` — paged audit log of every peer-to-peer token
  transfer with sender + recipient nicknames resolved.

> **No conversation inspector.** Admins must not read conversation content or
> history (privacy / product strategy); there is intentionally no per-message
> admin view.

## Permissions

| Route | Permission key |
|---|---|
| `meinchat/nicknames` | `meinchat.nicknames.moderate` |
| `meinchat/transfers` | `meinchat.transfers.view` |

The backend plugin (`vbwd-plugin-meinchat`) declares these in its
`admin_permissions` property; the admin role assignment must include
them.

## Backend dependency

`vbwd-plugin-meinchat` exposing `/api/v1/admin/meinchat/*` routes:

- `GET /admin/meinchat/nicknames`
- `POST /admin/meinchat/nicknames/:id/ban`
- `POST /admin/meinchat/nicknames/:id/unban`
- `GET /admin/meinchat/transfers`

## Tests

```
npx vitest run plugins/meinchat-admin/
```
