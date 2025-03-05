const { defineConfig } = require("pw-ct");

export default defineConfig({
  use: {
    ctRootDir: __dirname,
    ctServerType: 'webpack',
  }
});
