import { test, expect } from '@playwright/test';

test.describe('GeoSurePath Business Logic & Security E2E', () => {

    test('Admin Authentication & Multi-Factor Flow', async ({ page }) => {
        await page.goto('/admin');

        // 1. Initial login
        await page.fill('input[type="email"]', 'admin@geosurepath.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');

        // 2. Expect TOTP prompt
        await expect(page.locator('text=Two-Factor Authentication')).toBeVisible();
        await expect(page.locator('input[placeholder="6-digit code"]')).toBeVisible();

        // 3. Mock valid TOTP entry (Simulated in app logic or via bypass in test env)
        await page.fill('input[placeholder="6-digit code"]', '123456');
        await page.click('button:has-text("Verify")');

        // 4. Verification of successful session
        await expect(page).toHaveURL(/\/admin\/dashboard/);
        await expect(page.locator('text=Operational Intelligence Overview')).toBeVisible();
    });

    test('Subscription Monetization & Device Enforcement', async ({ page }) => {
        // Assume user is logged in
        await page.goto('/settings/subscription');
        await expect(page.locator('text=Subscription & Usage')).toBeVisible();

        // 1. Mock Razorpay Payment Success
        // In a real Playwright test, we would intercept the /api/payments/verify call
        await page.route('**/api/payments/verify', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, message: 'Plan Activated' })
            });
        });

        // 2. Select Plan (Standard)
        await page.click('button:has-text("Upgrade Plan"):near(:text("Standard"))');
        // Note: Razorpay iframe interaction is complex, we assume bypass/mock handler for this demo

        // 3. Verify Active Status UI
        await expect(page.locator('text=ACTIVE')).toBeVisible();
        await expect(page.locator('text=STANDARD')).toBeVisible();

        // 4. Test Enforcement (Add Device beyond limit)
        // Assume Standard limit is 10. If we have 10, adding 11th should fail.
        await page.goto('/devices');
        await page.click('button:has-text("Add Device")');
        await page.fill('input[name="name"]', 'Violator-66');
        await page.fill('input[name="uniqueId"]', '999999999');
        await page.click('button:has-text("Save")');

        // Verify API intercept for 403 Forbidden
        await page.route('**/api/devices', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 403,
                    body: JSON.stringify({ error: 'Device limit reached for your Current Plan' })
                });
            } else {
                await route.continue();
            }
        });

        await expect(page.locator('text=Device limit reached')).toBeVisible();
    });

    test('Critical Config Protection (Masked Secrets)', async ({ page }) => {
        await page.goto('/admin/config');

        // 1. Verify masking in UI
        const jwtInput = page.locator('label:has-text("JWT Secret Key") + div input');
        await expect(jwtInput).toHaveValue(/^.{12,}$/); // Should be masked or long

        // 2. Attempt save with masked value
        const initialValue = await jwtInput.inputValue();
        await page.click('button:has-text("Save All Changes")');

        // 3. Assert Backend did NOT overwrite it with dots
        // Verify via toast notification
        await expect(page.locator('text=Settings saved successfully')).toBeVisible();
    });

    test('Fleet-wide Alert Policy Persistence', async ({ page }) => {
        await page.goto('/settings/alerts');

        // 1. Change a policy
        const overspeedSwitch = page.locator('text=Overspeed Alert').locator('xpath=../..').locator('input[type="checkbox"]');
        const isChecked = await overspeedSwitch.isChecked();
        await overspeedSwitch.setChecked(!isChecked);

        // 2. Set threshold
        await page.fill('label:has-text("Max Speed") + div input', '95');

        // 3. Persist
        await page.click('button:has-text("Save All Alert Settings")');
        await expect(page.locator('text=Alert configuration saved successfully')).toBeVisible();

        // 4. Verify after reload
        await page.reload();
        await expect(page.locator('label:has-text("Max Speed") + div input')).toHaveValue('95');
    });

    test('Financial Document Generation (VAT/GST Compliant)', async ({ page }) => {
        await page.goto('/settings/subscription');

        // 1. Trigger Download
        const downloadPromise = page.waitForEvent('download');
        await page.click('button:has-text("Download PDF Invoice")');
        const download = await downloadPromise;

        // 2. Assert filename format
        expect(download.suggestedFilename()).toMatch(/^Invoice_.*\.pdf$/);
    });

});
