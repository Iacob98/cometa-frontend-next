import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate as admin', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Fill login form
  await page.fill('[data-testid=email-input]', 'admin@fiber.com');
  await page.fill('[data-testid=pin-input]', '1234');

  // Submit form
  await page.click('[data-testid=login-button]');

  // Wait for successful login and redirect to dashboard
  await page.waitForURL('/dashboard');
  await expect(page.getByText('Welcome back')).toBeVisible();

  // Save authentication state
  await page.context().storageState({ path: authFile });
});

setup('authenticate as worker', async ({ page }) => {
  const workerAuthFile = 'playwright/.auth/worker.json';

  await page.goto('/login');

  await page.fill('[data-testid=email-input]', 'worker1@fiber.com');
  await page.fill('[data-testid=pin-input]', '7086');

  await page.click('[data-testid=login-button]');

  await page.waitForURL('/dashboard');
  await expect(page.getByText('My Tasks')).toBeVisible();

  await page.context().storageState({ path: workerAuthFile });
});

setup('setup test data', async ({ request }) => {
  // Create test project
  const projectResponse = await request.post('/api/projects', {
    data: {
      name: 'E2E Test Project',
      customer: 'E2E Test Customer',
      city: 'Berlin',
      totalLength: 1000,
      ratePerMeter: 25,
      startDate: '2024-01-01',
      pmUserId: 'admin-user-id',
    },
  });

  expect(projectResponse.ok()).toBeTruthy();

  // Create test team
  const teamResponse = await request.post('/api/teams', {
    data: {
      name: 'E2E Test Team',
      projectId: 'e2e-project-id',
      foremanId: 'foreman-user-id',
    },
  });

  expect(teamResponse.ok()).toBeTruthy();
});