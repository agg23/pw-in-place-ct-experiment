export type WebpackDevServerConfig = {
  // specs: Cypress.Spec[]
  // cypressConfig: Cypress.PluginConfigOptions
  // devServerEvents: NodeJS.EventEmitter
  projectRoot: string,
  onConfigNotFound?: (devServer: 'webpack', cwd: string, lookedIn: string[]) => void
  // webpackConfig?: ConfigHandler // Derived from the user's webpack config
  webpackConfig?: {},
} 
// & FrameworkConfig