import { defineConfig as baseDefineConfig, PlaywrightTestConfig as BasePlaywrightTestConfig } from "@playwright/test";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

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
  return baseDefineConfig({
    ...config,
    // @ts-expect-error
    "@playwright/test": {
      // @ts-expect-error
      ...config["@playwright/test"],
      babelPlugins: [[require.resolve("./mount-transform")]],
    },
  }, configs);
}
