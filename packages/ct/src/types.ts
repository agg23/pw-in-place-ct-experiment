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