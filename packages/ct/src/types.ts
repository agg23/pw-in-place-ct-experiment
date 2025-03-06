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

export type CTFramework = 'react' | 'vue' | 'svelte';

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
