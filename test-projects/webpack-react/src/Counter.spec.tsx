import * as React from 'react';
import { expect } from '@playwright/test';
import { test } from 'pw-ct';
import { Counter } from './Counter.jsx';

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