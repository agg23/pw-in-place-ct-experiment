import { expect } from '@playwright/test';
import { test } from 'pw-ct';
import { Counter } from './Counter.tsx';
import { AnotherComponent } from './AnotherComponent.tsx';

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

test('intermixed different import', async ({ page, mount }) => {
  await mount(() => <AnotherComponent />);

  await expect(page.locator('body')).toHaveText('Some text');
});

test('decrement', async ({ page, mount }) => {
  await mount(() => <Counter />);

  await page.getByText('Decrement').click();
  await expect(page.locator('[data-testid="count"]')).toHaveText('-1');
});