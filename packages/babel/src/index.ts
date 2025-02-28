import { defineConfig as baseDefineConfig, PlaywrightTestConfig as BasePlaywrightTestConfig } from "@playwright/test";

export type PlaywrightTestConfig<T = {}, W = {}> = Omit<BasePlaywrightTestConfig<T, W>, 'use'> & {
  use: BasePlaywrightTestConfig<T, W>['use'] & {
    // ctPort?: number;
    // ctTemplateDir?: string;
    // ctCacheDir?: string;
    // ctViteConfig?: InlineConfig | (() => Promise<InlineConfig>);
    // TODO: I would really like to autodetect this, but I think the only thing that can be done is abusing exception stacks
    ctRootDir: string;
  };
};


export function defineConfig(config: PlaywrightTestConfig): PlaywrightTestConfig;
export function defineConfig<T>(config: PlaywrightTestConfig<T>): PlaywrightTestConfig<T>;
export function defineConfig<T, W>(config: PlaywrightTestConfig<T, W>): PlaywrightTestConfig<T, W>;
export function defineConfig(config: PlaywrightTestConfig<{ test: string }>, ...configs: PlaywrightTestConfig[]): PlaywrightTestConfig;
export function defineConfig<T>(config: PlaywrightTestConfig<T>, ...configs: PlaywrightTestConfig<T>[]): PlaywrightTestConfig<T>;
export function defineConfig<T, W>(config: PlaywrightTestConfig<T, W>, ...configs: PlaywrightTestConfig<T, W>[]): PlaywrightTestConfig<T, W>;
export function defineConfig<T, W>(config: PlaywrightTestConfig<T, W>, ...configs: PlaywrightTestConfig<T, W>[]) {
  const original = baseDefineConfig(config, ...configs);
  return {
    ...original,
    build: {
      // TODO: Remove. This is only necessary because of how Playwright runs Babel transforms on content not in the PW repo
      external: ["**/packages/**"],
    },
    "@playwright/test": {
      // @ts-expect-error
      ...original["@playwright/test"],
      babelPlugins: [[require.resolve("./mount-transform")]],
    },
  } as PlaywrightTestConfig<T, W> & { "@playwright/test": {} };
}
