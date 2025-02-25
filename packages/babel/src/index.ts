import { defineConfig as baseDefineConfig } from "@playwright/test";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// @ts-expect-error
export const defineConfig: typeof baseDefineConfig = (config) =>
  baseDefineConfig({
    ...config,
    "@playwright/test": {
      babelPlugins: [[require.resolve("./mount-transform")]],
    },
  });
