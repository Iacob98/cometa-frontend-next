import { test, expect } from '@playwright/test';

// Use admin authentication
test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Admin Complete Flow', () => {
  test('project creation and management flow', async ({ page }) => {
    await page.goto('/dashboard/projects');

    // Verify projects page loads
    await expect(page.getByText('Projects')).toBeVisible();

    // Create new project
    await page.click('[data-testid=create-project-button]');

    // Fill project form
    await page.fill('[data-testid=project-name]', 'E2E Test Project Admin');
    await page.fill('[data-testid=customer-name]', 'E2E Test Customer Corp');
    await page.fill('[data-testid=city-name]', 'Munich');
    await page.fill('[data-testid=total-length]', '2500');
    await page.fill('[data-testid=rate-per-meter]', '30');
    await page.fill('[data-testid=start-date]', '2024-06-01');
    await page.fill('[data-testid=end-date]', '2024-12-31');

    // Select project manager
    await page.selectOption('[data-testid=pm-select]', 'pm-user-id');

    // Submit form
    await page.click('[data-testid=create-project-submit]');

    // Verify success message
    await expect(page.getByText('Project created successfully')).toBeVisible();

    // Verify project appears in list
    await expect(page.getByText('E2E Test Project Admin')).toBeVisible();
    await expect(page.getByText('E2E Test Customer Corp')).toBeVisible();
    await expect(page.getByText('Munich')).toBeVisible();

    // Click project to view details
    await page.click('[data-testid=project-card]:has-text("E2E Test Project Admin")');

    // Should navigate to project details
    await page.waitForURL(/\/dashboard\/projects\/.*$/);
    await expect(page.getByText('Project Details')).toBeVisible();
    await expect(page.getByText('2,500 m')).toBeVisible();
    await expect(page.getByText('€30/m')).toBeVisible();
  });

  test('team management and assignment', async ({ page }) => {
    await page.goto('/dashboard/teams');

    // Create new team
    await page.click('[data-testid=create-team-button]');

    await page.fill('[data-testid=team-name]', 'E2E Admin Test Team');
    await page.selectOption('[data-testid=project-select]', 'e2e-project-id');
    await page.selectOption('[data-testid=foreman-select]', 'foreman-user-id');

    // Add team members
    await page.click('[data-testid=add-member-button]');
    await page.selectOption('[data-testid=member-select-0]', 'worker1-user-id');
    await page.selectOption('[data-testid=role-select-0]', 'crew');

    await page.click('[data-testid=add-member-button]');
    await page.selectOption('[data-testid=member-select-1]', 'worker2-user-id');
    await page.selectOption('[data-testid=role-select-1]', 'crew');

    // Submit team creation
    await page.click('[data-testid=create-team-submit]');

    // Verify team created
    await expect(page.getByText('Team created successfully')).toBeVisible();
    await expect(page.getByText('E2E Admin Test Team')).toBeVisible();

    // Edit team
    await page.click('[data-testid=team-actions-menu]:has-text("E2E Admin Test Team")');
    await page.click('[data-testid=edit-team]');

    // Change team name
    await page.fill('[data-testid=team-name]', 'E2E Admin Test Team Updated');
    await page.click('[data-testid=save-team]');

    // Verify update
    await expect(page.getByText('Team updated successfully')).toBeVisible();
    await expect(page.getByText('E2E Admin Test Team Updated')).toBeVisible();
  });

  test('work entry approval workflow', async ({ page }) => {
    await page.goto('/dashboard/work-entries');

    // Switch to pending tab
    await page.click('[data-testid=pending-tab]');

    // Should see pending work entries
    const pendingEntry = page.locator('[data-testid=work-entry-item][data-status="pending"]').first();
    await expect(pendingEntry).toBeVisible();

    // Click to view details
    await pendingEntry.click();

    // Should open work entry details modal
    await expect(page.getByText('Work Entry Review')).toBeVisible();

    // Verify work entry details
    await expect(page.getByText('Stage:')).toBeVisible();
    await expect(page.getByText('Meters Done:')).toBeVisible();
    await expect(page.getByText('Hours Worked:')).toBeVisible();

    // Check GPS coordinates
    await expect(page.getByText('GPS Location:')).toBeVisible();

    // View attached photo
    await page.click('[data-testid=view-photo]');
    await expect(page.locator('[data-testid=photo-viewer]')).toBeVisible();
    await page.click('[data-testid=close-photo-viewer]');

    // Approve work entry
    await page.click('[data-testid=approve-button]');
    await page.fill('[data-testid=approval-comment]', 'Good work, approved!');
    await page.click('[data-testid=confirm-approval]');

    // Verify approval
    await expect(page.getByText('Work entry approved successfully')).toBeVisible();

    // Check status changed to approved
    await expect(page.getByText('Approved')).toBeVisible();
  });

  test('reject work entry with feedback', async ({ page }) => {
    await page.goto('/dashboard/work-entries');
    await page.click('[data-testid=pending-tab]');

    const pendingEntry = page.locator('[data-testid=work-entry-item][data-status="pending"]').first();
    await pendingEntry.click();

    // Reject work entry
    await page.click('[data-testid=reject-button]');
    await page.fill('[data-testid=rejection-reason]', 'Photos are not clear enough. Please retake.');
    await page.click('[data-testid=confirm-rejection]');

    // Verify rejection
    await expect(page.getByText('Work entry rejected')).toBeVisible();

    // Check status changed to rejected
    await expect(page.getByText('Rejected')).toBeVisible();

    // Verify feedback was recorded
    await expect(page.getByText('Photos are not clear enough')).toBeVisible();
  });

  test('material management', async ({ page }) => {
    await page.goto('/dashboard/materials');

    // Create new material
    await page.click('[data-testid=add-material-button]');

    await page.fill('[data-testid=material-name]', 'Fiber Optic Cable Type A');
    await page.fill('[data-testid=material-description]', 'Single-mode fiber optic cable');
    await page.selectOption('[data-testid=material-unit]', 'meter');
    await page.fill('[data-testid=unit-price]', '5.50');
    await page.fill('[data-testid=current-stock]', '10000');
    await page.fill('[data-testid=minimum-stock]', '1000');

    await page.click('[data-testid=save-material]');

    // Verify material created
    await expect(page.getByText('Material added successfully')).toBeVisible();
    await expect(page.getByText('Fiber Optic Cable Type A')).toBeVisible();

    // Allocate material to project
    await page.click('[data-testid=allocate-material-button]');
    await page.selectOption('[data-testid=project-select]', 'e2e-project-id');
    await page.selectOption('[data-testid=material-select]', 'fiber-cable-a');
    await page.fill('[data-testid=allocation-quantity]', '500');

    await page.click('[data-testid=confirm-allocation]');

    // Verify allocation
    await expect(page.getByText('Material allocated successfully')).toBeVisible();
    await expect(page.getByText('500 m allocated')).toBeVisible();

    // Check stock was deducted
    await expect(page.getByText('9,500 m available')).toBeVisible();
  });

  test('equipment tracking', async ({ page }) => {
    await page.goto('/dashboard/equipment');

    // Add new equipment
    await page.click('[data-testid=add-equipment-button]');

    await page.fill('[data-testid=equipment-name]', 'Fiber Splicer Model X');
    await page.selectOption('[data-testid=equipment-type]', 'tool');
    await page.fill('[data-testid=equipment-serial]', 'FS-2024-001');
    await page.selectOption('[data-testid=equipment-status]', 'available');
    await page.fill('[data-testid=daily-rate]', '45.00');

    await page.click('[data-testid=save-equipment]');

    // Verify equipment added
    await expect(page.getByText('Equipment added successfully')).toBeVisible();
    await expect(page.getByText('Fiber Splicer Model X')).toBeVisible();

    // Assign equipment to project
    await page.click('[data-testid=assign-equipment-button]');
    await page.selectOption('[data-testid=project-select]', 'e2e-project-id');
    await page.selectOption('[data-testid=team-select]', 'e2e-team-id');
    await page.fill('[data-testid=assignment-start-date]', '2024-06-01');
    await page.fill('[data-testid=assignment-end-date]', '2024-06-30');

    await page.click('[data-testid=confirm-assignment]');

    // Verify assignment
    await expect(page.getByText('Equipment assigned successfully')).toBeVisible();
    await expect(page.getByText('Assigned to E2E Test Project')).toBeVisible();
  });

  test('financial reporting and analytics', async ({ page }) => {
    await page.goto('/dashboard/reports');

    // Test financial overview
    await page.click('[data-testid=financial-tab]');

    // Should see financial metrics
    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page.getByText('Material Costs')).toBeVisible();
    await expect(page.getByText('Labor Costs')).toBeVisible();
    await expect(page.getByText('Equipment Costs')).toBeVisible();

    // Test date range filter
    await page.click('[data-testid=date-range-picker]');
    await page.fill('[data-testid=start-date]', '2024-01-01');
    await page.fill('[data-testid=end-date]', '2024-06-30');
    await page.click('[data-testid=apply-date-filter]');

    // Should update financial data
    await expect(page.locator('[data-testid=revenue-chart]')).toBeVisible();

    // Test project breakdown
    await page.click('[data-testid=project-breakdown-tab]');
    await expect(page.getByText('Project Profitability')).toBeVisible();

    // Export report
    await page.click('[data-testid=export-financial-report]');
    await page.selectOption('[data-testid=export-format]', 'excel');
    await page.click('[data-testid=confirm-export]');

    // Verify export started
    await expect(page.getByText('Report export started')).toBeVisible();
  });

  test('user management', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.click('[data-testid=users-tab]');

    // Create new user
    await page.click('[data-testid=add-user-button]');

    await page.fill('[data-testid=user-name]', 'Test Worker User');
    await page.fill('[data-testid=user-email]', 'testworker@example.com');
    await page.selectOption('[data-testid=user-role]', 'worker');
    await page.selectOption('[data-testid=user-language]', 'en');

    // Generate PIN
    await page.click('[data-testid=generate-pin]');
    await expect(page.getByText('PIN generated:')).toBeVisible();

    await page.click('[data-testid=save-user]');

    // Verify user created
    await expect(page.getByText('User created successfully')).toBeVisible();
    await expect(page.getByText('Test Worker User')).toBeVisible();

    // Edit user
    await page.click('[data-testid=user-actions]:has-text("Test Worker User")');
    await page.click('[data-testid=edit-user]');

    await page.selectOption('[data-testid=user-role]', 'foreman');
    await page.click('[data-testid=save-user]');

    // Verify update
    await expect(page.getByText('User updated successfully')).toBeVisible();
    await expect(page.getByText('Foreman')).toBeVisible();

    // Deactivate user
    await page.click('[data-testid=user-actions]:has-text("Test Worker User")');
    await page.click('[data-testid=deactivate-user]');
    await page.click('[data-testid=confirm-deactivation]');

    // Verify deactivation
    await expect(page.getByText('User deactivated')).toBeVisible();
    await expect(page.getByText('Inactive')).toBeVisible();
  });

  test('bulk operations', async ({ page }) => {
    await page.goto('/dashboard/work-entries');

    // Select multiple work entries
    await page.check('[data-testid=select-work-entry-1]');
    await page.check('[data-testid=select-work-entry-2]');
    await page.check('[data-testid=select-work-entry-3]');

    // Verify bulk actions become available
    await expect(page.getByText('3 items selected')).toBeVisible();
    await expect(page.locator('[data-testid=bulk-actions]')).toBeVisible();

    // Bulk approve
    await page.click('[data-testid=bulk-approve]');
    await page.fill('[data-testid=bulk-approval-comment]', 'Bulk approval for reviewed entries');
    await page.click('[data-testid=confirm-bulk-approval]');

    // Verify bulk approval
    await expect(page.getByText('3 work entries approved')).toBeVisible();

    // Test bulk export
    await page.check('[data-testid=select-all-work-entries]');
    await page.click('[data-testid=bulk-export]');
    await page.selectOption('[data-testid=export-format]', 'excel');
    await page.click('[data-testid=confirm-bulk-export]');

    await expect(page.getByText('Export started')).toBeVisible();
  });

  test('advanced search and filtering', async ({ page }) => {
    await page.goto('/dashboard/projects');

    // Open advanced search
    await page.click('[data-testid=advanced-search]');

    // Fill advanced search criteria
    await page.fill('[data-testid=project-name-search]', 'Test');
    await page.selectOption('[data-testid=status-filter]', 'active');
    await page.fill('[data-testid=customer-search]', 'ACME');
    await page.fill('[data-testid=min-length]', '1000');
    await page.fill('[data-testid=max-length]', '5000');
    await page.fill('[data-testid=date-from]', '2024-01-01');
    await page.fill('[data-testid=date-to]', '2024-12-31');

    await page.click('[data-testid=apply-advanced-search]');

    // Verify filtered results
    await expect(page.getByText('Filtered Results')).toBeVisible();
    await expect(page.locator('[data-testid=project-card]')).toHaveCount(1);

    // Save search
    await page.click('[data-testid=save-search]');
    await page.fill('[data-testid=search-name]', 'Active Projects 2024');
    await page.click('[data-testid=confirm-save-search]');

    // Verify search saved
    await expect(page.getByText('Search saved successfully')).toBeVisible();

    // Test loading saved search
    await page.click('[data-testid=saved-searches]');
    await page.click('[data-testid=load-search]:has-text("Active Projects 2024")');

    // Verify search criteria loaded
    await expect(page.locator('[data-testid=project-name-search]')).toHaveValue('Test');
  });

  test('real-time dashboard updates', async ({ page, context }) => {
    await page.goto('/dashboard');

    // Check initial dashboard state
    await expect(page.getByText('Dashboard Overview')).toBeVisible();

    // Simulate real-time update (new work entry submitted)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('websocket-message', {
        detail: {
          type: 'work_entry_submitted',
          data: {
            id: 'new-work-entry-id',
            projectName: 'Test Project',
            workerName: 'John Doe',
            stage: 'excavation'
          }
        }
      }));
    });

    // Should show real-time notification
    await expect(page.getByText('New work entry submitted')).toBeVisible();

    // Dashboard metrics should update
    await expect(page.locator('[data-testid=pending-count]')).toContainText(/\d+/);

    // Test WebSocket reconnection
    await page.evaluate(() => {
      // Simulate connection loss
      window.dispatchEvent(new CustomEvent('websocket-disconnect'));
    });

    await expect(page.getByText('Connection lost')).toBeVisible();

    // Simulate reconnection
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('websocket-reconnect'));
    });

    await expect(page.getByText('Connected')).toBeVisible();
  });
});