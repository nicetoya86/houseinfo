// Design Ref: §8.3 L2 UI Action Tests
// 실행 전제: .env.local 구성 + `npm run dev` 기동 + PLAYWRIGHT_TEST_PROPERTY_ID(seed 매물 id) 환경변수
import { test, expect } from '@playwright/test';

const propertyId = process.env.PLAYWRIGHT_TEST_PROPERTY_ID;
test.skip(!propertyId, 'PLAYWRIGHT_TEST_PROPERTY_ID not set — seed data required');

test('매물 상세에서 임장정보 탭 클릭 시 /viewing으로 이동', async ({ page }) => {
  await page.goto(`/properties/${propertyId}`);
  await page.getByRole('link', { name: '임장정보' }).click();
  await expect(page).toHaveURL(`/properties/${propertyId}/viewing`);
});

test('임장 체크리스트 항목 클릭 시 체크 상태 토글', async ({ page }) => {
  await page.goto(`/properties/${propertyId}/viewing`);
  const firstItem = page.getByTestId('viewing-checklist').locator('input[type="checkbox"]').first();
  await expect(firstItem).not.toBeChecked();
  await firstItem.check();
  await expect(firstItem).toBeChecked();
});
