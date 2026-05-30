/**
 * meinchat-admin — admin dashboard injection
 *
 * The fe-admin `meinchat-admin` plugin must, when enabled, inject:
 *   - a "Meinchat" nav section in the sidebar (registered via
 *     extensionRegistry.register('meinchat-admin', { navSections: [...] })
 *     in plugins/meinchat-admin/index.ts)
 *   - top-level routes under /admin/meinchat/* — Nicknames, Transfers —
 *     each rendering its own view. There is intentionally NO conversation
 *     inspector (privacy: admins must not read conversation content).
 *
 * This test logs in as a real admin against the local backend and verifies
 * the plugin's assets are reachable. Run via:
 *   E2E_BASE_URL=http://localhost:8081 npx playwright test meinchat-admin-assets
 */
import { test, expect, type Page } from '@playwright/test';

// Plugin tests must not depend on host-app test infrastructure (SOLID:
// the plugin owns its own coverage). Credentials are env-overrideable so
// this spec is safe to ship in a public repo. Falls back to the local-dev
// defaults documented in the SDK's CLAUDE.md when no env is supplied.
const ADMIN_EMAIL    = process.env.VBWD_ADMIN_EMAIL    ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.VBWD_ADMIN_PASSWORD ?? 'AdminPass123@';

async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/admin/users');
  await page.waitForLoadState('networkidle');
  const isLogin = await page
    .locator('[data-testid="login-view"], .login-container')
    .isVisible()
    .catch(() => false);
  if (!isLogin) return;
  await page.locator('[data-testid="username-input"], input#username').fill(ADMIN_EMAIL);
  await page.locator('[data-testid="password-input"], input#password').fill(ADMIN_PASSWORD);
  await page.locator('[data-testid="login-button"], button[type="submit"]').click();
  await page.waitForURL(/\/admin\/(dashboard)?$/, { timeout: 15_000 });
}

test.describe('meinchat-admin — admin dashboard assets', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('Meinchat nav section is rendered in the admin sidebar', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('aside, nav, .sidebar, .admin-sidebar').first();
    await expect(sidebar).toContainText(/Meinchat/i, { timeout: 10000 });
  });

  test('Nicknames moderation route resolves and renders its view', async ({ page }) => {
    await page.goto('/admin/meinchat/nicknames');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/admin/meinchat/nicknames');

    // The view must mount — fall through to the plugin's MeinchatNicknamesList.vue.
    // 404 / not-found pages typically render a "Page not found" or login redirect.
    const url = page.url();
    expect(url).not.toContain('/login');
    await expect(page.locator('text=/Page not found|404/i')).toHaveCount(0);
  });

  test('Conversation inspector route is REMOVED (no admin content access)', async ({ page }) => {
    await page.goto('/admin/meinchat/conversations');
    await page.waitForLoadState('networkidle');

    // The route was removed for privacy — it must NOT render an inspector.
    // A removed route resolves to the app's not-found view (or redirects away).
    const onInspector = page.url().includes('/admin/meinchat/conversations');
    const notFound = await page
      .locator('text=/Page not found|404|not found/i')
      .count();
    expect(onInspector && notFound === 0).toBe(false);
  });

  test('Transfers audit route resolves', async ({ page }) => {
    await page.goto('/admin/meinchat/transfers');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/admin/meinchat/transfers');
    expect(page.url()).not.toContain('/login');
    await expect(page.locator('text=/Page not found|404/i')).toHaveCount(0);
  });

  test('Nicknames page renders a styled .cms-table (full width, header bg)', async ({ page }) => {
    await page.goto('/admin/meinchat/nicknames');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table.cms-table');
    await expect(table).toBeVisible({ timeout: 10000 });

    // The standard table style stretches to fill the container — confirms the
    // .cms-table style block is applied (without it the table collapses to
    // intrinsic content width).
    const tableWidth = await table.evaluate((el) => el.getBoundingClientRect().width);
    expect(tableWidth).toBeGreaterThan(400);

    // Header row has the standard light-grey background
    const th = table.locator('thead th').first();
    const headerBg = await th.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(headerBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(headerBg).not.toBe('transparent');

    // Header padding matches the standard 12px 15px
    const headerPaddingTop = await th.evaluate((el) => getComputedStyle(el).paddingTop);
    expect(parseFloat(headerPaddingTop)).toBeGreaterThanOrEqual(10);
  });

  test('Transfers page renders a styled .cms-table with right-aligned amount column', async ({ page }) => {
    await page.goto('/admin/meinchat/transfers');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table.cms-table');
    await expect(table).toBeVisible({ timeout: 10000 });

    const tableWidth = await table.evaluate((el) => el.getBoundingClientRect().width);
    expect(tableWidth).toBeGreaterThan(400);

    const th = table.locator('thead th').first();
    const headerBg = await th.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(headerBg).not.toBe('rgba(0, 0, 0, 0)');
    expect(headerBg).not.toBe('transparent');

    // Amount column uses .cms-table__num — must be right-aligned + tabular nums
    const amountTh = table.locator('thead th.cms-table__num');
    const textAlign = await amountTh.evaluate((el) => getComputedStyle(el).textAlign);
    expect(textAlign).toBe('right');
    const numericVariant = await amountTh.evaluate((el) => getComputedStyle(el).fontVariantNumeric);
    expect(numericVariant).toContain('tabular-nums');
  });
});
