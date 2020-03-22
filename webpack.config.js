/* eslint-disable prefer-arrow-callback */
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const config = {
  entry: {
    app: ['./source/index'],
    bg: ['./source/bg']
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
      }
    ]
  },
  stats: 'detailed',
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new CleanWebpackPlugin(['extension']),
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
    new webpack.BannerPlugin({
      banner: `
${fs.readFileSync(path.join(__dirname, 'LICENSE')).toString()}
`
    })
  ]
};

if (process.env.NODE_ENV === 'production') {
  config.plugins.unshift(
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        drop_console: true
      },
      beautify: false,
      comments: false
    })
  );

  config.plugins.push(function() {
    this.plugin('done', function() {
      const fileName = __dirname + '/extension.zip';
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
