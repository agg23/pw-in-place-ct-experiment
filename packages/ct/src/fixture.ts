import { test as base } from '@playwright/test';
import * as path from 'path';
import { buildUserContentScript } from './script';
import { Dependency } from './types';
import { VIRTUAL_ENTRYPOINT_NAME } from './virtual';

// TODO: Detect Webpack vs Vite
let VIRTUAL_ENTRYPOINT_PATH_PROMISE: Promise<string | undefined> = Promise.resolve().then(async () => {
  try {
    throw new Error();
    await import('vite');
    return 'TODO: Enter vite path';
  } catch {
    // Try Webpack
    try {
      const { VIRTUAL_ENTRYPOINT_PATH } = await import('pw-webpack-plugin');
      return VIRTUAL_ENTRYPOINT_PATH;
    } catch {
      throw new Error('Failed to detect Vite or Webpack');
    }
  }
});


export const test = base.extend<{ mount: (componentBuilder: () => object) => Promise<void>, ctRootDir: string | undefined }>({
  ctRootDir: [undefined, { option: true }],
  mount: async ({ page, ctRootDir }, use) => {
    if (!ctRootDir) {
      throw new Error('ctRootDir is not defined');
    }

    const mountFixture = async () => {
      throw new Error('Attempted to call `mount` directly. This should be transformed by the Babel plugin');
    };

    let rootProjectDir = ctRootDir;

    if (rootProjectDir.startsWith("file://")) {
      // ESM adds file:// and it messes up path methods
      rootProjectDir = rootProjectDir.slice("file://".length);
    }

    mountFixture._mountInternal = async (componentBuilder: () => object, imports: Record<string, Dependency>, workingDir: string) => {
      const scriptWorkingRelativeDir = path.relative(rootProjectDir, workingDir);

      const script = await buildUserContentScript(componentBuilder, imports, scriptWorkingRelativeDir);
      try {
        const name = await VIRTUAL_ENTRYPOINT_PATH_PROMISE;
        await fetch(`http://localhost:8080/${VIRTUAL_ENTRYPOINT_NAME}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            body: script,
          }),
        });
      } catch (e) {
        console.error('Failed to update virtual module', e);
      }

      await page.goto('http://localhost:8080');
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return use(mountFixture);
  }
});
