import type { ReactNode } from 'react';
import type { createApp } from 'vue';
import type { mount } from 'svelte'
import { BrowserSpy, BrowserVariable } from './variable';

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
  $browserSpy: <T extends () => {}>(value: T) => Promise<BrowserSpy<T>>;

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
