import type WebpackDevServer5 from 'webpack-dev-server'
import type WebpackDevServer4 from 'webpack-dev-server-4'

import { sourceDefaultWebpackDependencies } from "./sourceRelativeWebpackModules"
import { createWebpackDevServer } from './createWebpackDevServer';

export const run = async (projectRoot: string) => {
  const sourceWebpackModulesResult = sourceDefaultWebpackDependencies({ projectRoot });

  const { server, compiler } = await createWebpackDevServer({
    devServerConfig: {
      projectRoot
    },
    // frameworkConfig: {},
    sourceWebpackModulesResult,
  });

  const typedWebpackDevServer = server as unknown as WebpackDevServer4 | WebpackDevServer5;

  await typedWebpackDevServer.start();
}