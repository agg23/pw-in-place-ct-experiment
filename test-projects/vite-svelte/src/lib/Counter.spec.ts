import { expect } from '@playwright/test';
import { test } from 'pw-ct';
import Counter from './Counter.svelte';

test('render', async ({ page, mount }) => {
  await mount.svelte(() => ({ component: Counter }));

  await expect(page.locator('[data-testid="count"]')).toHaveText('0');
});

test('initial value', async ({ page, mount }) => {
  await mount.svelte(() => ({ component: Counter, props: { props: { initial: 314 } }}));

  await expect(page.locator('[data-testid="count"]')).toHaveText('314');
});

test('increment', async ({ page, mount }) => {
  await mount.svelte(() => ({ component: Counter }));

  await page.getByText('Increment').click();
  await expect(page.locator('[data-testid="count"]')).toHaveText('1');
});

test('decrement', async ({ page, mount }) => {
  await mount.svelte(() => ({ component: Counter }));

  await page.getByText('Decrement').click();
  await expect(page.locator('[data-testid="count"]')).toHaveText('-1');
});
