import VirtualModulesPlugin from 'webpack-virtual-modules';
import * as path from 'path';

// TODO: Remove duplication with Vite
export const VIRTUAL_ENTRYPOINT_NAME = '_pw-ct-entrypoint';
export const VIRTUAL_ENTRYPOINT_PATH = path.join(__dirname, '..', 'node_modules', VIRTUAL_ENTRYPOINT_NAME);

export const virtualModules = new VirtualModulesPlugin({
  [VIRTUAL_ENTRYPOINT_PATH]: "export default function entrypoint() { throw new Error('Failed to set up virtual module'); }",
});
