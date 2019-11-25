var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');

module.exports = {
  entry: "./src/index.js",
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    chunkFilename: '[id].js',
    publicPath: "/",
  },
  devServer: {
    hot: true
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({inject: true, template: "./src/index.html"})
  ]
}
