/* eslint-disable prefer-arrow-callback */
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const config = {
  mode: process.env.NODE_ENV,
  entry: {
    main: './source/pages/main',
    options: './source/pages/options',
    backend: './source/backend'
  },
  output: {
    path: path.join(__dirname, 'extension'),
    filename: '[name].js'
  },
  resolve: { extensions: ['.js'] },
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components)/
      },
      {
        test: /\.(png|jpg|gif|woff|woff2|ttf|svg|eot)(\?|\?[a-z0-9]+)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new CopyWebpackPlugin([
      {
        from: 'source/locales',
        to: '_locales'
      },
      {
        from: 'source/manifest.json'
      },
      {
        from: 'source/html'
      },
      {
        from: 'source/icons'
      }
    ]),
    new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
    new webpack.BannerPlugin({
      banner: `
${fs.readFileSync(path.join(__dirname, 'LICENSE')).toString()}
`
    })
  ]
};

if (process.env.NODE_ENV === 'production') {
  config.plugins.push(function() {
    this.plugin('done', function() {
      const fileName = path.join(__dirname, 'extension.zip');
      if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
      }
      const archive = archiver.create('zip', {});
      const output = fs.createWriteStream(fileName);
      archive.pipe(output);
      archive.directory('extension/', false);
      archive.finalize();
    });
  });
}

module.exports = config;
