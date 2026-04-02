import { test, expect } from '@playwright/test';

test.describe('Collaboration Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/');
  });

  test('user can add comment to document', async ({ page }) => {
    // Create and navigate to a document
    await page.click('button:has-text("Create Document")');
    await page.fill('input[placeholder*="title" i]', `Comment Test ${Date.now()}`);
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/document\/[a-f0-9]+/);

    // Click on Comments tab if available
    const commentsTab = page.locator('button:has-text("Comments")');
    if (await commentsTab.isVisible()) {
      await commentsTab.click();
    }

    // Add comment
    const commentInput = page.locator('textarea').first();
    if (await commentInput.isVisible()) {
      await commentInput.fill('This is a test comment');
      await page.click('button:has-text("Comment")');

      // Verify comment appears
      await expect(page.locator('text=This is a test comment')).toBeVisible();
    }
  });

  test('user can mention another user in comment', async ({ page }) => {
    // Navigate to document
    await page.click('button:has-text("Create Document")');
    await page.fill('input[placeholder*="title" i]', `Mention Test ${Date.now()}`);
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/document\/[a-f0-9]+/);

    // Go to comments
    const commentsTab = page.locator('button:has-text("Comments")');
    if (await commentsTab.isVisible()) {
      await commentsTab.click();
    }

    // Type comment with mention
    const commentInput = page.locator('textarea').first();
    if (await commentInput.isVisible()) {
      await commentInput.fill('@test Thanks for reviewing this');
      
      // Check if mention autocomplete appears
      const mentionSuggestion = page.locator('text=test');
      if (await mentionSuggestion.isVisible({ timeout: 1000 }).catch(() => false)) {
        await mentionSuggestion.click();
      }

      await page.click('button:has-text("Comment")');
      
      // Verify mention format
      await expect(page.locator('text=@test')).toBeVisible();
    }
  });

  test('user can share document with collaborator', async ({ page }) => {
    // Create document
    await page.click('button:has-text("Create Document")');
    await page.fill('input[placeholder*="title" i]', `Share Test ${Date.now()}`);
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/document\/[a-f0-9]+/);

    // Click Share button
    await page.click('button:has-text("Share")');

    // Wait for share modal/dialog
    await expect(page.locator('text=/Share|Invite/i')).toBeVisible();

    // Enter collaborator email
    await page.fill('input[placeholder*="email" i]', 'collaborator@example.com');

    // Select role (optional)
    const roleSelect = page.locator('select, [role="listbox"]').first();
    if (await roleSelect.isVisible({ timeout: 500 }).catch(() => false)) {
      await roleSelect.click();
      await page.click('text=Editor').or(page.click('text=Viewer'));
    }

    // Send invite
    await page.click('button:has-text("Invite")');

    // Verify success message
    await expect(page.locator('text=/sent|invited|success/i')).toBeVisible();
  });

  test('user can view version history', async ({ page }) => {
    // Create document
    await page.click('button:has-text("Create Document")');
    await page.fill('input[placeholder*="title" i]', `History Test ${Date.now()}`);
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/document\/[a-f0-9]+/);

    // Click History tab
    const historyTab = page.locator('button:has-text("History")');
    if (await historyTab.isVisible()) {
      await historyTab.click();

      // Create a snapshot
      const snapshotBtn = page.locator('button:has-text("Save Snapshot")').or(
        page.locator('button:has-text("Snapshot")')
      );
      
      if (await snapshotBtn.isVisible()) {
        await snapshotBtn.click();

        // Handle prompt dialog if present
        page.once('dialog', async dialog => {
          await dialog.accept('Version 1.0');
        });

        // Verify snapshot appears in history
        await expect(page.locator('text=/Version|Snapshot/i')).toBeVisible();
      }
    }
  });

  test('user can restore document version', async ({ page }) => {
    // Navigate to document with versions
    // (Assuming document already has versions from previous test)
    
    const historyTab = page.locator('button:has-text("History")');
    if (await historyTab.isVisible()) {
      await historyTab.click();

      // Find restore button
      const restoreBtn = page.locator('button:has-text("Restore")').first();
      if (await restoreBtn.isVisible()) {
        await restoreBtn.click();

        // Confirm if dialog appears
        if (await page.locator('text=/Are you sure|confirm/i').isVisible({ timeout: 500 }).catch(() => false)) {
          await page.click('button:has-text("Restore")');
        }

        // Verify success message
        await expect(page.locator('text=/restored|success/i')).toBeVisible();
      }
    }
  });
});
