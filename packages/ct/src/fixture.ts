import { test as base } from '@playwright/test';
import * as path from 'path';
import { buildUserContentScript } from './script';
import { CTFramework, Dependency, MountFixture } from './types';
import { VIRTUAL_ENTRYPOINT_NAME } from './virtual';

export const test = base.extend<{ mount: MountFixture, ctRootDir: string, ctPort: number }>({
  // These values are validated in `defineConfig`
  ctRootDir: ['./', { option: true }],
  ctPort: [3100, { option: true }],
  mount: async ({ page, ctRootDir: rootProjectDir, ctPort }, use) => {
    const sharedReject = async () => {
      throw new Error('Attempted to call `mount` directly. This should be transformed by the Babel plugin');
    };

    const mountFixture: MountFixture = {
      react: sharedReject,
      vue: sharedReject,
      svelte: sharedReject,
    };

    if (rootProjectDir.startsWith("file://")) {
      // ESM adds file:// and it messes up path methods
      rootProjectDir = rootProjectDir.slice("file://".length);
    }

    (mountFixture as any)._mountInternal = async <T extends CTFramework>(componentBuilder: MountFixture[T], imports: Record<string, Dependency>, workingDir: string, framework: CTFramework) => {
      const scriptWorkingRelativeDir = path.relative(rootProjectDir, workingDir);

      const script = await buildUserContentScript(componentBuilder, imports, scriptWorkingRelativeDir, framework);
      try {
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

  },
});
