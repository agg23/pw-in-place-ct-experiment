import { expect } from '@playwright/test';
import { test } from 'pw-ct';
import { Counter } from './Counter.tsx';
import { Wrapper } from './Wrapper.tsx';

test('render', async ({ page, mount }) => {
  await mount.react(() => <Counter />);

  await expect(page.locator('[data-testid="count"]')).toHaveText('0');
});

test('initial value', async ({ page, mount }) => {
  await mount.react(() => <Counter initial={314} />);

  await expect(page.locator('[data-testid="count"]')).toHaveText('314');
});

test('increment', async ({ page, mount }) => {
  await mount.react(() => <Counter />);

  await page.getByText('Increment').click();
  await expect(page.locator('[data-testid="count"]')).toHaveText('1');
});

test('decrement', async ({ page, mount }) => {
  await mount.react(() => <Counter />);

  await page.getByText('Decrement').click();
  await expect(page.locator('[data-testid="count"]')).toHaveText('-1');
});

test('nested jsx', async ({ page, mount }) => {
  await mount.react(() => <Wrapper><Counter initial={123} /></Wrapper>);

  await expect(page.locator('body')).toContainText('This is some wrapper');
  await expect(page.locator('[data-testid="count"]')).toHaveText('123');
});
