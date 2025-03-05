import type WebpackDevServer5 from 'webpack-dev-server'
import type WebpackDevServer4 from 'webpack-dev-server-4'

import { sourceDefaultWebpackDependencies } from "./sourceRelativeWebpackModules"
import { createWebpackDevServer } from './createWebpackDevServer';

export { VIRTUAL_ENTRYPOINT_PATH } from './virtualModules';

export const run = async (projectRoot: string) => {
  const sourceWebpackModulesResult = sourceDefaultWebpackDependencies({ projectRoot });

  const { server, compiler } = await createWebpackDevServer({
    devServerConfig: {
      projectRoot
    },
    // frameworkConfig: {},
    sourceWebpackModulesResult,
  });

  console.log((compiler as any).context);

  // Set up initial instance of entrypoint virtual file
  // (compiler as any).hooks.done.tap('PWPlugin', () => {
  //   console.log("Calling plugin");
  //   virtualModules.writeModule('/Users/agastineau/code/componentTesting2/test-projects/webpack-plugin/dist/custom-test.js', '');
  // });

  const typedWebpackDevServer = server as unknown as WebpackDevServer4 | WebpackDevServer5;

  await typedWebpackDevServer.start();
}