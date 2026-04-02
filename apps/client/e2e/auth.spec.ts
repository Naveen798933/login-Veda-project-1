import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can register with valid credentials', async ({ page }) => {
    await page.goto('/register');

    // Fill registration form
    await page.fill('input[placeholder="First Name"]', 'John');
    await page.fill('input[placeholder="Last Name"]', 'Doe');
    await page.fill('input[type="email"]', `john-${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'SecurePassword123!');

    // Submit form
    await page.click('button:has-text("Create Account")');

    // Wait for redirect and verify login
    await page.waitForURL('/');
    await expect(page).toHaveTitle(/Dashboard/i);
  });

  test('user can login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill login form with test user
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');

    // Submit form
    await page.click('button:has-text("Sign In")');

    // Wait for redirect and verify dashboard
    await page.waitForURL('/');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('user sees error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'WrongPassword!');

    await page.click('button:has-text("Sign In")');

    // Verify error message appears
    await expect(page.locator('text=/Invalid credentials|not found/i')).toBeVisible();
  });

  test('user can reset password with valid email', async ({ page }) => {
    await page.goto('/login');

    // Navigate to forgot password
    await page.click('text=Forgot Password');

    // Enter email
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("Send Reset Link")');

    // Verify success message
    await expect(page.locator('text=/reset link sent|check your inbox/i')).toBeVisible();
  });
});
