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

