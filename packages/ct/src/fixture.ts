import { test as base } from '@playwright/test';
import * as path from 'path';
import { buildUserContentScript } from './script';
import { CTServerType, Dependency } from './types';
import { VIRTUAL_ENTRYPOINT_NAME } from './virtual';

let storedVirtualEntrypointPath: Promise<string | undefined> | undefined;

const getVirtualEntrypointPath = async (type: CTServerType) => {
  if (storedVirtualEntrypointPath) {
    return await storedVirtualEntrypointPath;
  }

  const checkPath = async () => {
    switch (type) {
      case 'vite': {
        try {
          const { VIRTUAL_ENTRYPOINT_PATH } = await import('pw-ct-vite-plugin');
          return VIRTUAL_ENTRYPOINT_PATH;
        } catch {
          throw new Error(`ctServerType: 'vite' is set but Vite is not installed`);
        }
      }
      case 'webpack': {
        try {
          const { VIRTUAL_ENTRYPOINT_PATH } = await import('pw-ct-webpack-plugin');
          return VIRTUAL_ENTRYPOINT_PATH;
        } catch {
          throw new Error(`ctServerType: 'webpack' is set but pw-webpack-plugin is not installed`);
        }
      }
      // TODO: Assert never
      default: {
        throw new Error(`Unknown ctServerType: ${type}`);
      }
    }
  };

  storedVirtualEntrypointPath = checkPath();
  return await storedVirtualEntrypointPath;
}

export const test = base.extend<{ mount: (componentBuilder: () => object) => Promise<void>, ctRootDir: string, ctServerType: CTServerType, ctPort: number }>({
  // These values are validated in `defineConfig`
  ctRootDir: ['./', { option: true }],
  ctServerType: ['vite', { option: true }],
  ctPort: [3100, { option: true }],
  mount: async ({ page, ctRootDir: rootProjectDir, ctServerType, ctPort }, use) => {
    const mountFixture = async () => {
      throw new Error('Attempted to call `mount` directly. This should be transformed by the Babel plugin');
    };

    if (rootProjectDir.startsWith("file://")) {
      // ESM adds file:// and it messes up path methods
      rootProjectDir = rootProjectDir.slice("file://".length);
    }

    mountFixture._mountInternal = async (componentBuilder: () => object, imports: Record<string, Dependency>, workingDir: string) => {
      const scriptWorkingRelativeDir = path.relative(rootProjectDir, workingDir);

      const script = await buildUserContentScript(componentBuilder, imports, scriptWorkingRelativeDir);
      try {
        const name = await getVirtualEntrypointPath(ctServerType);
        await fetch(`http://localhost:${ctPort}/${VIRTUAL_ENTRYPOINT_NAME}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: script,
          }),
        });
      } catch (e) {
        console.error('Failed to update virtual module', e);
      }

      await page.goto(`http://localhost:${ctPort}`);
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return use(mountFixture);
  }
});
