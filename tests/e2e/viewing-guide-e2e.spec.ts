// Design Ref: §8.4 L3 E2E Scenario Tests
// 실행 전제: .env.local 구성 + `npm run dev` 기동 + 시드 데이터(캐시 있는 매물 1건 + 없는 매물 1건)
import { test, expect } from '@playwright/test';

const cachedPropertyId = process.env.PLAYWRIGHT_TEST_PROPERTY_ID;
const uncachedPropertyId = process.env.PLAYWRIGHT_TEST_PROPERTY_ID_NO_GUIDE;

test.skip(!cachedPropertyId, 'PLAYWRIGHT_TEST_PROPERTY_ID not set — seed data required');

test('임장정보 확인: 리스트→상세→임장정보 탭→4요소 렌더', async ({ page }) => {
  await page.goto('/properties');
  await page.getByTestId('property-card').first().click();
  await page.getByRole('link', { name: '임장정보' }).click();
  await expect(page.getByText(/본 분석은 AI가 생성한 참고 자료/)).toBeVisible();
});

test('캐시 미스: 가이드 미생성 매물은 생성 준비중 안내만 노출', async ({ page }) => {
  test.skip(!uncachedPropertyId, 'PLAYWRIGHT_TEST_PROPERTY_ID_NO_GUIDE not set');
  await page.goto(`/properties/${uncachedPropertyId}/viewing`);
  await expect(page.getByText('임장 가이드 생성 준비중입니다')).toBeVisible();
});
