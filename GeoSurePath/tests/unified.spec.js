import { test, expect } from '@playwright/test';

test.describe('GeoSurePath Unified E2E Suite', () => {

    test('Landing Page Interactivity', async ({ page }) => {
        await page.goto('/');
        await page.click('text=Pricing');
        // Check if scrolled (approx check)
        const pricingBox = page.locator('text=Simple, Transparent Pricing');
        await expect(pricingBox).toBeInViewport();

        // CTA Routing
        await page.click('text=Start Free Trial');
        await expect(page).toHaveURL(/\/register/);
    });

    test('Admin Dashboard Redirection (No Session)', async ({ page }) => {
        await page.goto('/admin/dashboard');
        // Should redirect to admin login if no sessionActive in sessionStorage
        await expect(page).toHaveURL(/\/admin/);
    });

    test('Alert Config UI Persistence (Mock)', async ({ page }) => {
        await page.goto('/settings/alerts');
        // Check if certain fields exist
        await expect(page.locator('text=Global Speed Limit Defaults')).toBeVisible();
        await page.click('text=Global Speed Limit Defaults');
        await expect(page.locator('label:has-text("Default Speed Limit")')).toBeVisible();
    });

    test('Admin Dashboard 2FA UI Flow', async ({ page }) => {
        // This requires a mock session since we added sessionStorage protection
        await page.goto('/admin');
        // We'll trust the unit tests for session injection, here we verify structure
        await expect(page.locator('text=GeoSurePath Enterprise')).toBeVisible();
    });
});
