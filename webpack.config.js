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
      banner: ` The MIT License (MIT)

 Copyright (c) 2017-2020 Kokororin (https://kotori.love)

 Permission is hereby granted, free of charge, to any person obtaining a
 copy of this software and associated documentation files (the "Software"),
 to deal in the Software without restriction, including without limitation
 the rights to use, copy, modify, merge, publish, distribute, sublicense,
 and/or sell copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included
 in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 IN THE SOFTWARE.`
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
    this.plugin('done', function(statsData) {
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
