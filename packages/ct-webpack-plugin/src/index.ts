import type WebpackDevServer5 from 'webpack-dev-server'
import type WebpackDevServer4 from 'webpack-dev-server-4'

import { sourceDefaultWebpackDependencies } from "./sourceRelativeWebpackModules"
import { createWebpackDevServer } from './createWebpackDevServer';
import { nextHandler } from './nextHandler';
import { PresetHandlerResult } from './types';

export { VIRTUAL_ENTRYPOINT_PATH } from './virtualModules';

export const run = async (projectRoot: string) => {
  // const sourceWebpackModulesResult = sourceDefaultWebpackDependencies({ projectRoot });

  const { frameworkConfig, sourceWebpackModulesResult } = await modules(projectRoot);

  const { server, compiler } = await createWebpackDevServer({
    devServerConfig: {
      projectRoot
    },
    frameworkConfig,
    sourceWebpackModulesResult,
  });

  const typedWebpackDevServer = server as unknown as WebpackDevServer4 | WebpackDevServer5;

  await typedWebpackDevServer.start();
}

const modules = async (projectRoot: string): Promise<PresetHandlerResult> => {
  if (false) {
    return await nextHandler({ projectRoot });
  }

  return {
    sourceWebpackModulesResult: sourceDefaultWebpackDependencies({ projectRoot }),
    frameworkConfig: undefined,
  };
}