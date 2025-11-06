const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    popup: './src/index.tsx',
    background: './public/app/background.js',
    content: './public/app/content.js',
    bringContent: './public/app/bring/content.js',
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: (pathData) => {
      switch (pathData.chunk.name) {
        case 'background':
          return 'app/background.js';
        case 'content':
          return 'app/content.js';
        case 'bringContent':
          return 'app/bringContent.js';
        default:
          return '[name].bundle.js';
      }
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: false,
            configFile: path.resolve(__dirname, './tsconfig.json'),
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/images/[name][ext]',
        },
      },
      {
        test: /\.svg$/i,
        oneOf: [
          {
            issuer: /\.[jt]sx?$/,
            resourceQuery: /react/,
            loader: '@svgr/webpack',
            options: {
              typescript: true,
              ref: true,
              svgo: true,
              svgoConfig: {
                plugins: [
                  {
                    name: 'preset-default',
                    params: {
                      overrides: {
                        removeViewBox: false,
                      },
                    },
                  },
                  'removeXMLNS',
                ],
              },
            },
          },
          {
            type: 'asset/resource',
            generator: {
              filename: 'static/images/[name][ext]',
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.png', '.jpg', '.jpeg', '.gif'],
    alias: {
      src: path.resolve(__dirname, './src'),
      '@Components': path.resolve(__dirname, './src/components/'),
      '@Utils': path.resolve(__dirname, './src/utils/'),
      '@Css': path.resolve(__dirname, './src/css/'),
      '@Reducers': path.resolve(__dirname, './src/reducers/'),
      '@images': path.resolve(__dirname, 'src/images'),
    },
    fallback: {
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      crypto: require.resolve('crypto-browserify'),
      buffer: require.resolve('buffer/'),
      stream: require.resolve('stream-browserify'),
      vm: require.resolve('vm-browserify'),
    },
  },
  plugins: [
    new Dotenv({
      path: '.env',
      systemvars: true,
      safe: true,
    }),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      chunks: ['popup'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public/manifest.json', to: 'manifest.json' },
        { from: 'public/favicon.png', to: 'favicon.png' },
        { from: 'public/app/script/inpage.js', to: 'app/script/inpage.js' },
      ],
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
  devServer: {
    static: path.join(__dirname, 'build'),
    compress: true,
    port: 3000,
  },
};
