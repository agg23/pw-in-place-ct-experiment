import type { ReactNode } from 'react';
import { createApp } from 'vue';

export interface Dependency {
  url: string;
  type: 'named' | 'default' | 'namespace';
}

export interface DedupedImport {
  // TODO: Support renaming
  named: string[];
  default?: string;
  namespace?: string;
}

export interface VirtualModuleRequest {
  name: string;
  body: string;
}

export type CTServerType = 'vite' | 'webpack';

export type CTFramework = 'react' | 'vue' | 'svelte';

type FunctionParamsToObjectType<T extends (...args: any) => any> =
  Parameters<T> extends [infer A]
  ? (A extends object
    ? (keyof A extends never // Check if A is an empty object
      ? {} // If empty object, return an empty object type
      : A) // Otherwise, return A
    : {}) // If A isn't an object, return an empty object type
  : {}; // If not a single argument function, return empty object

type VueCreateParams = Parameters<typeof createApp>;
interface VueCreateObject {
  component: VueCreateParams[0];
  props?: VueCreateParams[1];
}

// TODO: Add a type assertion for CTFramework
export interface MountFixture {
  react: (componentBuilder: () => ReactNode) => Promise<void>;
  vue: (componentBuilder: () => VueCreateObject) => Promise<void>;
  svelte: (componentBuilder: () => object) => Promise<void>;
}
