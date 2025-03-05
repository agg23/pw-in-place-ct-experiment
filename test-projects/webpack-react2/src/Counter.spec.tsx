import { expect } from '@playwright/test';
import { test } from 'pw-ct';
import { Counter } from './Counter';

test.beforeEach(async ({ page }) => {
  // await page.goto('http://localhost:5173/');
});

test('render', async ({ page, mount }) => {
  await mount(() => <Counter />);

  await expect(page.locator('[data-testid="count"]')).toHaveText('0', {timeout: 100000});
});

test('initial value', async ({ page, mount }) => {
  await mount(() => <Counter initial={314} />);

  await expect(page.locator('[data-testid="count"]')).toHaveText('314');
});

test('increment', async ({ page, mount }) => {
  await mount(() => <Counter />);

  await page.getByText('Increment').click();
  await expect(page.locator('[data-testid="count"]')).toHaveText('1');
});

test('decrement', async ({ page, mount }) => {
  await mount(() => <Counter />);

  await page.getByText('Decrement').click();
  await expect(page.locator('[data-testid="count"]')).toHaveText('-1');
});