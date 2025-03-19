import type { ReactNode } from 'react';
import type { createApp } from 'vue';
import type { mount } from 'svelte'
import { JSHandle } from '@playwright/test';

export type Dependency = {
  url: string;
  type: 'named' | 'default' | 'namespace';
  form: 'import';
} | {
  url: string;
  type: 'named' | 'default';
  form: 'require';
}

export interface DedupedImport {
  // TODO: Support renaming
  named: string[];
  default?: string;
  namespace?: string;
}

export interface DedupedRequire {
  // TODO: Support renaming
  named: string[];
  default?: string;
}

export interface VirtualModuleRequest {
  name: string;
  body: string;
}

export type CTFramework = 'react' | 'vue' | 'svelte';

// TODO: Find a better name
// export interface BrowserVariable<T> {
//   id: string;
//   handle: JSHandle<T>;
// }

export interface Fixture {
  mount: MountFixture;
  $browser: <T>(value: T) => Promise<BrowserVariable<T>>;

  ctRootDir: string;
  ctPort: number
}

type VueCreateParams = Parameters<typeof createApp>;
interface VueCreateObject {
  component: VueCreateParams[0];
  props?: VueCreateParams[1];
}

type SvelteMountParams = Parameters<typeof mount>;
interface SvelteMountObject {
  component: SvelteMountParams[0];
  props?: SvelteMountParams[1];
}

// TODO: Add a type assertion for CTFramework
export interface MountFixture {
  react: (componentBuilder: () => ReactNode) => Promise<void>;
  vue: (componentBuilder: () => VueCreateObject) => Promise<void>;
  svelte: (componentBuilder: () => SvelteMountObject) => Promise<void>;
}

type Handle<T> = JSHandle<{ value: T }>;

// TODO: Find a better name
export class BrowserVariable<T> {
  handle: Handle<T> | undefined = undefined;

  constructor(public id: string) {}

  registerHandle(handle: Handle<T>) {
    this.handle = handle;
  }

  async get(): Promise<T> {
    if (!this.handle) {
      throw new Error('Cannot get a browser variable that has not been initialized');
    }

    const wrapper = await this.handle.jsonValue();
    return wrapper.value;
  }

  async set(value: T): Promise<void> {
    if (!this.handle) {
      throw new Error('Cannot set a browser variable that has not been initialized');
    }

    await this.handle.evaluate((variable, value) => {
      variable.value = value as T;
    }, value);
  }
}