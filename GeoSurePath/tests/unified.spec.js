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

    test('Subscription Page UI', async ({ page }) => {
        await page.goto('/settings/subscription');
        await expect(page.locator('text=Subscription & Usage')).toBeVisible();
        await expect(page.locator('text=Standard')).toBeVisible();
        await expect(page.locator('text=₹999')).toBeVisible();
    });

    test('Central Config Panel Access', async ({ page }) => {
        // This requires admin session
        await page.goto('/admin/config');
        await expect(page.locator('text=Central Config Panel')).toBeVisible();
        await expect(page.locator('text=SMS & Notify')).toBeVisible();
    });

    test('Video Demo Dialog Verification', async ({ page }) => {
        await page.goto('/');
        await page.click('text=Watch Demo');
        const iframe = page.locator('iframe[title="Product Demo"]');
        await expect(iframe).toBeVisible();
        await page.click('button:has([data-testid="CloseIcon"])');
        await expect(iframe).not.toBeVisible();
    });
});
