import { expect } from '@playwright/test';
import { test } from 'pw-ct';
import HelloWorld from './HelloWorld.vue';
import Counter from './Counter.vue';

test('render', async ({ page, mount }) => {
  await mount.vue(() => ({ component: Counter }));

  await expect(page.locator('[data-testid="count"]')).toHaveText('0');
});

test('initial value', async ({ page, mount }) => {
  await mount.vue(() => ({ component: Counter, props: { initial: 314 } }));

  await expect(page.locator('[data-testid="count"]')).toHaveText('314');
});

test('increment', async ({ page, mount }) => {
  await mount.vue(() => ({ component: Counter }));

  await page.getByText('Increment').click();
  await expect(page.locator('[data-testid="count"]')).toHaveText('1');
});

test('intermixed different import', async ({ page, mount }) => {
  await mount.vue(() => ({ component: HelloWorld, props: { msg: "hi" } }));

  await expect(page.locator('body')).toContainText('Learn more about IDE Support');
});

test('decrement', async ({ page, mount }) => {
  await mount.vue(() => ({ component: Counter }));

  await page.getByText('Decrement').click();
  await expect(page.locator('[data-testid="count"]')).toHaveText('-1');
});
