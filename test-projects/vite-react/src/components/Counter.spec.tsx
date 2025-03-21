import { expect } from '@playwright/test';
import { test } from 'pw-ct';
import { Counter } from './Counter.tsx';
import { AnotherComponent } from './AnotherComponent.tsx';
import VueComponent from './VueComponent.vue';
import { Wrapper } from './Wrapper.tsx';
import CustomImport from '@/App.tsx';

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

test('intermixed different import', async ({ page, mount }) => {
  await mount.react(() => <AnotherComponent />);

  await expect(page.locator('body')).toHaveText('Some text');
});

test('intermixed Vue import', async ({ page, mount }) => {
  await mount.react(() => <AnotherComponent />);
  await expect(page.locator('body')).toHaveText('Some text');

  await mount.vue(() => ({ component: VueComponent, props: { msg: "Hello world" } }));
  await expect(page.locator('body')).toHaveText('Welcome to Vue: Hello world');

  await mount.react(() => <AnotherComponent />);
  await expect(page.locator('body')).toHaveText('Some text');
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

test('custom import', async ({ page, mount }) => {
  await mount.react(() => <CustomImport />);

  await expect(page.locator('body')).toContainText('Click on the Vite and React logos to learn more');
});
