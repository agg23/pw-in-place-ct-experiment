import { defineConfig as baseDefineConfig } from "pw-ct-babel";
import { type PlaywrightTestConfig as BasePlaywrightTestConfig } from "@playwright/test";
import { CTServerType } from "./types";

export { test } from "./fixture";

export type PlaywrightTestConfig<T = {}, W = {}> = Omit<BasePlaywrightTestConfig<T, W>, 'use'> & {
  use: BasePlaywrightTestConfig<T, W>['use'] & {
    // ctTemplateDir?: string;
    // ctCacheDir?: string;
    // ctViteConfig?: InlineConfig | (() => Promise<InlineConfig>);
    ctPort?: number;
    ctServerType: CTServerType;
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
  const original = baseDefineConfig(config, ...configs) as PlaywrightTestConfig<T, W>;

  // TODO: Improve this
  if (!original.use?.ctRootDir) {
    throw new Error('ctRootDir is not defined');
  }

  if (!original.use?.ctServerType) {
    throw new Error('ctServerType is required');
  }

  return original as PlaywrightTestConfig<T, W>;
}
