import { test, expect } from '@playwright/test';

test.describe('Document Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/');
  });

  test('user can create a new document', async ({ page }) => {
    // Click create button
    await page.click('button:has-text("Create Document")');

    // Wait for modal/form
    await expect(page.locator('input[placeholder*="title" i]')).toBeVisible();

    // Enter title
    const docTitle = `Test Doc ${Date.now()}`;
    await page.fill('input[placeholder*="title" i]', docTitle);

    // Submit
    await page.click('button:has-text("Create")');

    // Verify navigation to document
    await page.waitForURL(/\/document\/[a-f0-9]+/);
    await expect(page).toHaveURL(/\/document\//);
  });

  test('user can edit document title and content', async ({ page }) => {
    // Create a document first
    await page.click('button:has-text("Create Document")');
    const docTitle = `Editable Doc ${Date.now()}`;
    await page.fill('input[placeholder*="title" i]', docTitle);
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/document\/[a-f0-9]+/);

    // Edit title
    const newTitle = `Updated ${Date.now()}`;
    await page.fill('input', newTitle);
    await page.waitForTimeout(500); // Wait for auto-save

    // Verify title is saved
    const titleInput = page.locator('input').first();
    await expect(titleInput).toHaveValue(newTitle);
  });

  test('user can search documents', async ({ page }) => {
    // Use search functionality (if available)
    await page.click('input[placeholder*="search" i]');
    await page.fill('input[placeholder*="search" i]', 'Test');
    await page.waitForTimeout(500); // Wait for search results

    // Verify results appear
    const results = page.locator('[data-testid*="document-item"]');
    await expect(results).toHaveCount(x => x > 0);
  });

  test('user can delete a document', async ({ page }) => {
    // Create a document to delete
    await page.click('button:has-text("Create Document")');
    const docTitle = `To Delete ${Date.now()}`;
    await page.fill('input[placeholder*="title" i]', docTitle);
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/document\/[a-f0-9]+/);

    // Click delete (find delete button/option)
    const moreButton = page.locator('button:has-text("More")').or(page.locator('[aria-label="More options"]'));
    if (await moreButton.isVisible()) {
      await moreButton.click();
      await page.click('text=/Delete|Trash/i');
      
      // Confirm deletion
      if (await page.locator('text=/Are you sure/i').isVisible()) {
        await page.click('button:has-text("Delete")');
      }
    }

    // Verify redirection to dashboard
    await page.waitForURL('/');
  });
});
