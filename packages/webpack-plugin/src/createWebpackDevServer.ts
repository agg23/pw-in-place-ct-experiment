// MIT License
//
// Copyright (c) 2023 Cypress.io
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import debugLib from 'debug'
import type { Configuration as WebpackDevServer5Configuration } from 'webpack-dev-server'
import type { Configuration as WebpackDevServer4Configuration } from 'webpack-dev-server-4'
import type { WebpackDevServerConfig } from './types'
import type { SourceRelativeWebpackResult } from './sourceRelativeWebpackModules'
import { makeWebpackConfig } from './makeWebpackConfig'

const debug = debugLib('cypress:webpack-dev-server:start')

/**
 * Takes the webpack / webpackDevServer modules, the configuration provide
 * from the framework override (if any), and the configuration provided
 * from the user config (if any) and makes the final config we want to
 * serve into webpack
 */
export interface CreateFinalWebpackConfig {
  /**
   * Initial config passed to devServer
   */
  devServerConfig: WebpackDevServerConfig
  /**
   * Result of sourcing the webpack from the
   */
  sourceWebpackModulesResult: SourceRelativeWebpackResult
  /**
   * Framework-specific config overrides
   */
  frameworkConfig?: unknown
}

export async function createWebpackDevServer (
  config: CreateFinalWebpackConfig,
) {
  const {
    sourceWebpackModulesResult: {
      webpack: {
        module: webpack,
      },
      webpackDevServer: {
        majorVersion: webpackDevServerMajorVersion,
      },
    },
  } = config

  const finalWebpackConfig = await makeWebpackConfig(config)
  const webpackCompiler = webpack(finalWebpackConfig)

  if (webpackDevServerMajorVersion === 5) {
    debug('using webpack-dev-server v5')

    return webpackDevServer5(config, webpackCompiler, finalWebpackConfig)
  }

  if (webpackDevServerMajorVersion === 4) {
    debug('using webpack-dev-server v4')

    return webpackDevServer4(config, webpackCompiler, finalWebpackConfig)
  }

  throw new Error(`Unsupported webpackDevServer version ${webpackDevServerMajorVersion}`)
}

function webpackDevServer5 (
  config: CreateFinalWebpackConfig,
  compiler: object,
  finalWebpackConfig: Record<string, any>,
) {
  // const { devServerConfig: { cypressConfig: { devServerPublicPathRoute } } } = config
  // const isOpenMode = !config.devServerConfig.cypressConfig.isTextTerminal
  const WebpackDevServer = config.sourceWebpackModulesResult.webpackDevServer.module
  const webpackDevServerConfig: WebpackDevServer5Configuration = {
    host: '127.0.0.1',
    port: 'auto',
    // @ts-ignore
    ...finalWebpackConfig?.devServer,
    devMiddleware: {
      // publicPath: devServerPublicPathRoute,
      stats: finalWebpackConfig.stats ?? 'minimal',
    },
    hot: false,
    // Only enable file watching & reload when executing tests in `open` mode
    // liveReload: isOpenMode,
  }

  debug(WebpackDevServer)
  debug(webpackDevServerConfig)

  const server = new WebpackDevServer(webpackDevServerConfig, compiler)

  debug(server)

  return {
    server,
    compiler,
  }
}

function webpackDevServer4 (
  config: CreateFinalWebpackConfig,
  compiler: object,
  finalWebpackConfig: Record<string, any>,
) {
  // const { devServerConfig: { cypressConfig: { devServerPublicPathRoute } } } = config
  // const isOpenMode = !config.devServerConfig.cypressConfig.isTextTerminal
  const WebpackDevServer = config.sourceWebpackModulesResult.webpackDevServer.module
  const webpackDevServerConfig: WebpackDevServer4Configuration = {
    host: '127.0.0.1',
    port: 'auto',
    // @ts-ignore
    ...finalWebpackConfig?.devServer,
    devMiddleware: {
      // publicPath: devServerPublicPathRoute,
      stats: finalWebpackConfig.stats ?? 'minimal',
    },
    hot: false,
    // Only enable file watching & reload when executing tests in `open` mode
    // liveReload: isOpenMode,
  }

  const server = new WebpackDevServer(webpackDevServerConfig, compiler)

  return {
    server,
    compiler,
  }
}
