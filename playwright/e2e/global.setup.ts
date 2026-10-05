import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Ensure the .auth directory exists
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto('/login');

  // We assume default test credentials for the existing auth flow
  // You can set these via environment variables in CI/CD
  const username = process.env.TEST_USERNAME || 'admin';
  const password = process.env.TEST_PASSWORD || 'admin';

  await page.getByPlaceholder('أدخل اسم المستخدم').fill(username);
  await page.getByPlaceholder('أدخل كلمة المرور').fill(password);

  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();

  // Wait for navigation to complete or a known element on the dashboard to appear
  await page.waitForURL('**/admin**');

  // Ensure successful login by checking for the logout button or dashboard text
  await expect(page.getByRole('button', { name: 'تسجيل الخروج' })).toBeVisible({ timeout: 10000 });

  // Save the authentication state
  await page.context().storageState({ path: authFile });
});
