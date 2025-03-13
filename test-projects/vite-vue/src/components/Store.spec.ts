import { expect } from '@playwright/test';
import { createTestingPinia } from '@pinia/testing';
import { test } from 'pw-ct';
import Store from './Store.vue';

test('render', async ({ page, mount }) => {
  await mount.vue(() => ({ component: Store, plugins: [createTestingPinia({ createSpy: () => () => {} })] }));

  await expect(page.locator('[data-testid="count"]')).toHaveText('0');
});

test('increment', async ({ page, mount }) => {
  await mount.vue(() => ({ component: Store, plugins: [createTestingPinia({ createSpy: () => () => {} })] }));

  await page.getByText('Increment').click();

  await expect(page.locator('[data-testid="count"]')).toHaveText('0');
});