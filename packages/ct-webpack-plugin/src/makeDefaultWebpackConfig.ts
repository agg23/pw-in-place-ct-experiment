import path from 'path'
import debugLib from 'debug'
import type { Configuration } from 'webpack'
import type { CreateFinalWebpackConfig } from './createWebpackDevServer'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import bodyParser from 'body-parser';
import { VIRTUAL_ENTRYPOINT_NAME, VIRTUAL_ENTRYPOINT_PATH, virtualModules } from './virtualModules'
// import { CypressCTWebpackPlugin } from './CypressCTWebpackPlugin'

const debug = debugLib('cypress:webpack-dev-server:makeDefaultWebpackConfig')

const OUTPUT_PATH = path.join(__dirname, 'dist')

const OsSeparatorRE = RegExp(`\\${path.sep}`, 'g')
const posixSeparator = '/'

export function makeCypressWebpackConfig (
  config: CreateFinalWebpackConfig,
): Configuration {
  const {
    devServerConfig: {
      // cypressConfig: {
      //   justInTimeCompile,
      //   port,
      //   projectRoot,
      //   devServerPublicPathRoute,
      //   supportFile,
      //   indexHtmlFile,
      //   isTextTerminal: isRunMode,
      // },
      // specs: files,
      // devServerEvents,
      // framework,
    },
    sourceWebpackModulesResult: {
      webpack: {
        module: webpack,
        majorVersion: webpackMajorVersion,
      },
      // htmlWebpackPlugin: {
      //   module: HtmlWebpackPlugin,
      //   majorVersion: htmlWebpackPluginVersion,
      //   importPath: htmlWebpackPluginImportPath,
      // },
      webpackDevServer: {
        majorVersion: webpackDevServerMajorVersion,
      },
    },
  } = config

  // const webpackDevServerPort = port ?? undefined
  const webpackDevServerPort = 3100;
  const devServerPublicPathRoute = './';

  // debug(`Using HtmlWebpackPlugin version ${htmlWebpackPluginVersion} from ${htmlWebpackPluginImportPath}`)

  const optimization: Record<string, any> = {
    // To prevent files from being tree shaken by webpack, we set optimization.sideEffects: false ensuring that
    // webpack does not recognize the sideEffects flag in the package.json and thus files are not unintentionally
    // dropped during testing in production mode.
    sideEffects: false,
    splitChunks: {
      chunks: 'all',
    },
  }

  if (webpackMajorVersion === 5) {
    optimization.emitOnErrors = true
  } else {
    optimization.noEmitOnErrors = false
  }

  // const publicPath = (path.sep === posixSeparator)
  //   ? path.join(devServerPublicPathRoute, posixSeparator)
  //   // The second line here replaces backslashes on windows with posix compatible slash
  //   // See https://github.com/cypress-io/cypress/issues/16097
  //   : path.join(devServerPublicPathRoute, posixSeparator)
  //   .replace(OsSeparatorRE, posixSeparator)

  const finalConfig = {
    mode: 'development',
    // optimization,
    output: {
      filename: '[name].js',
      path: OUTPUT_PATH,
      publicPath: '/',
    },
    plugins: [
      virtualModules,
      new HtmlWebpackPlugin({
        template: path.join(__dirname, '../', 'index.html'),
        // template: indexHtmlFile ? path.isAbsolute(indexHtmlFile) ? indexHtmlFile : path.join(projectRoot, indexHtmlFile) : undefined,
        // Angular generates all of it's scripts with <script type="module">. Live-reloading breaks without this option.
        // We need to manually set the base here to `/__cypress/src/` so that static assets load with our proxy
        // ...(framework === 'angular' ? { scriptLoading: 'module', base: '/__cypress/src/' } : {}),
      }),
      // new CypressCTWebpackPlugin({
      //   files,
      //   projectRoot,
      //   devServerEvents,
      //   supportFile,
      //   webpack,
      //   indexHtmlFile,
      // }),
    ],
    devtool: 'inline-source-map',
  } as Configuration;

  // if (isRunMode) {
  //   // if justInTimeCompile is configured, we need to watch for file changes as the spec entries are going to be updated per test
  //   const ignored = justInTimeCompile ? /node_modules/ : '**/*'

  //   // Disable file watching when executing tests in `run` mode
  //   finalConfig.watchOptions = {
  //     ignored,
  //   }
  // }

  // if (webpackDevServerMajorVersion === 4) {
  //   return {
  //     ...finalConfig,
  //     devServer: {
  //       port: webpackDevServerPort,
  //       client: {
  //         overlay: false,
  //       },
  //     },
  //   }
  // }

  // default is webpack-dev-server v5
  return {
    ...finalConfig,
    devServer: {
      port: webpackDevServerPort,
      client: {
        overlay: false,
      },
      devMiddleware: {
        writeToDisk: true,
      },
      setupMiddlewares: (middlewares, devServer) => {
        devServer.app.post(`/${VIRTUAL_ENTRYPOINT_NAME}`, bodyParser.json(), (req, res) => {
          const body = req.body as { body: string };
          if (!body.body) {
            res.sendStatus(400);
            return;
          }
          virtualModules.writeModule(VIRTUAL_ENTRYPOINT_PATH, body.body);
          res.sendStatus(200);
        });

        return middlewares;
      }
    },
  }
}
