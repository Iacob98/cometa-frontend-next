import { test, expect } from '@playwright/test';

// Use worker authentication
test.use({ storageState: 'playwright/.auth/worker.json' });

test.describe('Worker Complete Flow', () => {
  test('complete work entry creation and submission flow', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Verify worker dashboard loads correctly
    await expect(page.getByText('My Tasks')).toBeVisible();
    await expect(page.getByText('Today&apos;s Progress')).toBeVisible();

    // Navigate to work entries
    await page.click('[data-testid=nav-work-entries]');
    await page.waitForURL('/dashboard/work-entries');

    // Verify work entries page loads
    await expect(page.getByText('Work Entries')).toBeVisible();

    // Click create new work entry
    await page.click('[data-testid=create-work-entry-button]');

    // Fill work entry form
    await page.selectOption('[data-testid=project-select]', 'e2e-project-id');
    await page.selectOption('[data-testid=cut-select]', 'test-cut-id');
    await page.selectOption('[data-testid=stage-select]', 'stage_2_excavation');

    await page.fill('[data-testid=meters-done-input]', '150');
    await page.fill('[data-testid=hours-worked-input]', '8');
    await page.fill('[data-testid=description-input]', 'Completed excavation work for 150 meters');

    // Set GPS coordinates (mock GPS)
    await page.click('[data-testid=set-gps-button]');
    await expect(page.getByText('GPS coordinates captured')).toBeVisible();

    // Upload work photo
    const fileInput = page.locator('[data-testid=photo-upload]');
    await fileInput.setInputFiles({
      name: 'work-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });

    // Verify photo preview appears
    await expect(page.getByText('work-photo.jpg')).toBeVisible();

    // Submit work entry
    await page.click('[data-testid=submit-work-entry]');

    // Verify success message
    await expect(page.getByText('Work entry submitted successfully')).toBeVisible();

    // Verify work entry appears in list with pending status
    await expect(page.getByText('Pending')).toBeVisible();
    await expect(page.getByText('150 m')).toBeVisible();
    await expect(page.getByText('stage_2_excavation')).toBeVisible();
  });

  test('view and filter work entries', async ({ page }) => {
    await page.goto('/dashboard/work-entries');

    // Test search functionality
    await page.fill('[data-testid=search-input]', 'excavation');
    await page.waitForTimeout(500); // Debounce

    // Should show filtered results
    await expect(page.getByText('Completed excavation work')).toBeVisible();

    // Clear search
    await page.fill('[data-testid=search-input]', '');

    // Test status filter
    await page.selectOption('[data-testid=status-filter]', 'pending');
    await expect(page.getByText('Pending')).toBeVisible();

    // Test date range filter
    await page.click('[data-testid=date-filter-button]');
    await page.fill('[data-testid=start-date]', '2024-01-01');
    await page.fill('[data-testid=end-date]', '2024-12-31');
    await page.click('[data-testid=apply-date-filter]');

    // Verify results are filtered
    await expect(page.locator('[data-testid=work-entry-item]').first()).toBeVisible();
  });

  test('edit pending work entry', async ({ page }) => {
    await page.goto('/dashboard/work-entries');

    // Find pending work entry and edit it
    const workEntryCard = page.locator('[data-testid=work-entry-item]').first();
    await workEntryCard.click();

    // Should open work entry details
    await expect(page.getByText('Work Entry Details')).toBeVisible();

    // Click edit button (should be available for pending entries)
    await page.click('[data-testid=edit-work-entry]');

    // Modify some fields
    await page.fill('[data-testid=meters-done-input]', '175');
    await page.fill('[data-testid=description-input]', 'Updated: Completed excavation work for 175 meters');

    // Save changes
    await page.click('[data-testid=save-work-entry]');

    // Verify success message
    await expect(page.getByText('Work entry updated successfully')).toBeVisible();

    // Verify updated values are displayed
    await expect(page.getByText('175 m')).toBeVisible();
    await expect(page.getByText('Updated: Completed excavation work')).toBeVisible();
  });

  test('view work history and statistics', async ({ page }) => {
    await page.goto('/dashboard');

    // Check today's statistics card
    const todayStatsCard = page.locator('[data-testid=today-stats-card]');
    await expect(todayStatsCard).toBeVisible();
    await expect(todayStatsCard.getByText('Today&apos;s Progress')).toBeVisible();

    // Check meters completed today
    await expect(todayStatsCard.getByText(/\d+ m/)).toBeVisible();

    // Check hours worked today
    await expect(todayStatsCard.getByText(/\d+ hrs/)).toBeVisible();

    // Navigate to detailed statistics
    await page.click('[data-testid=view-detailed-stats]');

    // Should show weekly/monthly statistics
    await expect(page.getByText('Weekly Performance')).toBeVisible();
    await expect(page.getByText('Monthly Summary')).toBeVisible();

    // Test chart interactions
    await page.click('[data-testid=weekly-chart]');
    await expect(page.getByText('Week Details')).toBeVisible();
  });

  test('notification handling', async ({ page }) => {
    await page.goto('/dashboard');

    // Check notification bell
    const notificationBell = page.locator('[data-testid=notification-bell]');
    await expect(notificationBell).toBeVisible();

    // Click to open notifications
    await notificationBell.click();

    // Should show notification dropdown
    await expect(page.getByText('Notifications')).toBeVisible();

    // If there are notifications, test marking as read
    const firstNotification = page.locator('[data-testid=notification-item]').first();
    if (await firstNotification.isVisible()) {
      await firstNotification.click();

      // Should mark as read and navigate to related item
      await expect(firstNotification.locator('[data-testid=unread-indicator]')).not.toBeVisible();
    }

    // Test clearing all notifications
    await page.click('[data-testid=clear-all-notifications]');
    await expect(page.getByText('All notifications cleared')).toBeVisible();
  });

  test('offline functionality simulation', async ({ page, context }) => {
    await page.goto('/dashboard/work-entries');

    // Simulate offline by blocking network
    await context.setOffline(true);

    // Try to create work entry while offline
    await page.click('[data-testid=create-work-entry-button]');

    // Fill form
    await page.selectOption('[data-testid=project-select]', 'e2e-project-id');
    await page.selectOption('[data-testid=cut-select]', 'test-cut-id');
    await page.selectOption('[data-testid=stage-select]', 'stage_1_preparation');
    await page.fill('[data-testid=meters-done-input]', '50');
    await page.fill('[data-testid=hours-worked-input]', '4');

    // Submit (should queue for sync)
    await page.click('[data-testid=submit-work-entry]');

    // Should show offline message
    await expect(page.getByText('Saved offline - will sync when connected')).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Trigger sync
    await page.click('[data-testid=sync-offline-data]');

    // Should show sync success
    await expect(page.getByText('Offline data synced successfully')).toBeVisible();
  });

  test('mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/dashboard');

    // Check mobile navigation
    await expect(page.locator('[data-testid=mobile-nav-toggle]')).toBeVisible();

    // Open mobile menu
    await page.click('[data-testid=mobile-nav-toggle]');
    await expect(page.locator('[data-testid=mobile-nav-menu]')).toBeVisible();

    // Navigate to work entries from mobile menu
    await page.click('[data-testid=mobile-nav-work-entries]');
    await page.waitForURL('/dashboard/work-entries');

    // Check mobile work entry card layout
    const workEntryCard = page.locator('[data-testid=work-entry-item]').first();
    await expect(workEntryCard).toBeVisible();

    // Check mobile create button (should be floating action button)
    await expect(page.locator('[data-testid=mobile-create-fab]')).toBeVisible();

    // Test swipe gestures on work entry cards
    await workEntryCard.hover();
    await page.mouse.down();
    await page.mouse.move(100, 0); // Swipe right
    await page.mouse.up();

    // Should show action buttons (edit, delete)
    await expect(page.locator('[data-testid=swipe-actions]')).toBeVisible();
  });

  test('GPS and photo capture integration', async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(['geolocation']);

    await page.goto('/dashboard/work-entries/create');

    // Mock geolocation
    await page.evaluate(() => {
      navigator.geolocation.getCurrentPosition = function(success) {
        success({
          coords: {
            latitude: 52.52,
            longitude: 13.405,
            accuracy: 10
          }
        });
      };
    });

    // Click GPS capture button
    await page.click('[data-testid=capture-gps]');

    // Verify GPS coordinates are captured
    await expect(page.getByText('GPS: 52.52, 13.405')).toBeVisible();
    await expect(page.getByText('Accuracy: ±10m')).toBeVisible();

    // Test photo capture simulation
    await page.click('[data-testid=capture-photo]');

    // Should open camera interface (simulated)
    await expect(page.getByText('Camera')).toBeVisible();

    // Simulate taking photo
    await page.click('[data-testid=take-photo]');

    // Should show photo preview
    await expect(page.locator('[data-testid=photo-preview]')).toBeVisible();

    // Accept photo
    await page.click('[data-testid=accept-photo]');

    // Should return to form with photo attached
    await expect(page.getByText('Photo captured')).toBeVisible();
  });

  test('real-time updates', async ({ page, context }) => {
    // Open two pages to simulate real-time updates
    const page2 = await context.newPage();

    await page.goto('/dashboard/work-entries');
    await page2.goto('/dashboard/work-entries');

    // Admin approves work entry on page2 (simulate)
    await page2.evaluate(() => {
      // Simulate WebSocket message for work entry approval
      window.dispatchEvent(new CustomEvent('websocket-message', {
        detail: {
          type: 'work_entry_approved',
          data: {
            id: 'test-work-entry-id',
            status: 'approved'
          }
        }
      }));
    });

    // Check if page1 receives the real-time update
    await expect(page.getByText('Approved')).toBeVisible({ timeout: 5000 });

    // Check notification appears
    await expect(page.getByText('Your work entry has been approved')).toBeVisible();

    await page2.close();
  });
});