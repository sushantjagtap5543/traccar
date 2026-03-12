import { test, expect } from '@playwright/test';

test.describe('GeoSurePath Auth Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should load the landing page and navigate to login', async ({ page }) => {
        await expect(page).toHaveTitle(/GeoSurePath/);
        const signInBtn = page.getByRole('button', { name: /Sign In/i });
        await expect(signInBtn).toBeVisible();
        await signInBtn.click();
        await expect(page).toHaveURL(/\/login/);
    });

    test('should show validation error on invalid login', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'wrong@geosurepath.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Invalid email or password')).toBeVisible();
    });
});
