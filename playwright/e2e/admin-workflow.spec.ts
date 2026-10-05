import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Admin Workflow E2E', () => {

  test('Complete flow: Section -> Service -> Post', async ({ page }) => {
    // 1. Login is handled by global setup. We should already be authenticated.
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'الإحصائيات' })).toBeVisible({ timeout: 10000 });

    const timestamp = Date.now();
    const sectionName = `E2E Section ${timestamp}`;
    const serviceName = `E2E Service ${timestamp}`;
    const postName = `E2E Post ${timestamp}`;

    // 2. Navigate to Sections dashboard and create a new Section
    await page.goto('/admin/sections');
    await page.getByRole('button', { name: 'إضافة قسم' }).click();
    await page.waitForURL('**/admin/sections/create');
    
    await page.getByRole('textbox', { name: 'عنوان القسم' }).fill(sectionName);
    
    // Upload a dummy image for section (optional but good)
    const dummyImage = path.join(__dirname, 'dummy.png');
    if (!fs.existsSync(dummyImage)) {
      // Create a 1x1 transparent png
      const dummyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
      fs.writeFileSync(dummyImage, Buffer.from(dummyPngBase64, 'base64'));
    }
    
    // The section image input is absolute in a div
    await page.locator('input[type="file"]').setInputFiles(dummyImage);
    // wait for upload to finish (spinner to disappear)
    await expect(page.locator('.spinner-border.text-primary')).toBeHidden({ timeout: 10000 });

    await page.getByRole('button', { name: 'إنشاء القسم' }).click();
    
    // Wait to be redirected back to sections
    await page.waitForURL('**/admin/sections');
    await expect(page.getByText(sectionName)).toBeVisible({ timeout: 10000 });

    // 3. Create a new Service under that Section
    await page.goto('/admin/services/create');
    
    // Select the newly created section from the tree picker
    await page.locator('select[name="sectionId"]').selectOption({ label: sectionName });
    await page.getByRole('textbox', { name: 'اسم الخدمة' }).fill(serviceName);
    
    // Upload service icon
    await page.locator('input[type="file"]').setInputFiles(dummyImage);
    // There is a toast for upload, just wait a bit or wait for spinner
    await page.waitForTimeout(1000); 

    await page.getByRole('button', { name: 'حفظ وإنشاء الخدمة' }).click();
    
    // Wait for redirect to services
    await page.waitForURL('**/admin/services');
    await expect(page.getByText(serviceName)).toBeVisible({ timeout: 10000 });

    // 4. Add a post/item to that service
    // Generate the expected slug (E2E-Service-timestamp)
    const serviceSlug = serviceName.toLowerCase().replace(/\s+/g, '-');
    await page.goto(`/admin/services/${serviceSlug}/posts/create`);

    await page.getByRole('textbox', { name: 'عنوان البوست' }).fill(postName);
    
    // Main image
    await page.locator('.card:has-text("الصورة الرئيسية") input[type="file"]').setInputFiles(dummyImage);
    await page.waitForTimeout(1000); // Wait for upload

    // Map Coordinates
    await page.getByRole('button', { name: 'تحديد على الخريطة' }).click();
    await page.waitForSelector('.leaflet-container', { state: 'visible' });
    // Click in the middle of the map
    const mapLocator = page.locator('.leaflet-container');
    const box = await mapLocator.boundingBox();
    if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    await page.getByRole('button', { name: 'تأكيد الموقع' }).click();

    // Submit post
    await page.getByRole('button', { name: 'نشر البوست' }).click();

    // Wait for redirect to posts page
    await page.waitForURL(`**/admin/posts/${serviceSlug}`);
    await expect(page.getByText(postName)).toBeVisible({ timeout: 10000 });
  });

});
