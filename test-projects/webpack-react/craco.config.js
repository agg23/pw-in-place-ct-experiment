// craco.config.js
const path = require('path');

// CRA is stupid and won't let you import `node_modules` outside of the project directory, so it doesn't like workspaces
module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Allow imports outside of src directory
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ModuleScopePlugin'
      );

      // Add your workspace's node_modules to the module resolution paths
      webpackConfig.resolve.modules = [
        path.resolve(__dirname, 'node_modules'), // Local node_modules (if any)
        path.resolve(__dirname, '../../../node_modules'), // Path to your workspace root's node_modules
        'node_modules',  // Default node_modules resolution
        ...(webpackConfig.resolve.modules || []),
      ];

      return webpackConfig;
    },
  },
};