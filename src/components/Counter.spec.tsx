import { expect } from '@playwright/test';
import { test } from './pwInternals.ts';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173/');
});

test('render', async ({ page, mount }) => {
  await mount('/src/components/Counter', ({ Counter }) => <Counter />);

  await expect(page.locator('[data-testid="count"]')).toHaveText('0');
});

test('initial value', async ({ page, mount }) => {
  await mount('/src/components/Counter', ({ Counter }) => <Counter initial={314} />);

  await expect(page.locator('[data-testid="count"]')).toHaveText('314');
});

test('increment', async ({ page, mount }) => {
  await mount('/src/components/Counter', ({ Counter }) => <Counter />);

  await page.getByText('Increment').click();
  await expect(page.locator('[data-testid="count"]')).toHaveText('1');
});

test('decrement', async ({ page, mount }) => {
  await mount('/src/components/Counter', ({ Counter }) => <Counter />);

  await page.getByText('Decrement').click();
  await expect(page.locator('[data-testid="count"]')).toHaveText('-1');
});