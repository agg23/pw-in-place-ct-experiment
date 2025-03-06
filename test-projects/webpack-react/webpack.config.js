const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

const packageJSON = require("./package.json");
const isDebug = !process.argv.includes("release");

module.exports = {
  entry: "./src/index.jsx",
  output: {
    uniqueName: packageJSON.name,
    publicPath: "/",
    path: path.resolve(__dirname, "build"),
    filename: `${packageJSON.version}/js/[name].[chunkhash:8].js`,
    chunkFilename: `${packageJSON.version}/js/[name].[chunkhash:8].js`,
    assetModuleFilename: isDebug
      ? `images/[path][name].[contenthash:8][ext]`
      : `images/[path][contenthash:8][ext]`,
    crossOriginLoading: "anonymous",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      filename: "index.html",
    }),
  ],
  devtool: "source-map",
  devServer: {
    port: 8080,
    // devMiddleware: {
    //   writeToDisk: true,
    // },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              modules: true,
            },
          },
          "sass-loader",
        ],
      },
    ],
  },
  resolve: {
    extensions: [".*", ".js", ".jsx", ".ts", ".tsx"],
  },
};
