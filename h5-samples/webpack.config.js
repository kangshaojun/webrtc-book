//引用webpack
const webpack = require('webpack');
//模块导出
module.exports = {
  //入口文件
  entry: './src/index.jsx',
  //开发调试时可以看到源码
  devtool: 'source-map',
  //模块
  module: {
    //规则
    rules: [
      //加载js|jsx源码文件
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }, 
      //加载scss|less|css等样式文件
      {
        test: /\.(scss|less|css)$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
    ]
  },
  //配置如何寻找模块所对应的文件
  resolve: {
    //寻找所有js,jsx文件
    extensions: ['*', '.js', '.jsx']
  },
  //输出文件配置
  output: {
    //输出路径 __dirname表示当前目录
    path: __dirname + '/dist',
    //公共路径为项目根目录
    publicPath: '/',
    //打包后输出文件名
    filename: 'samples.js'
  },
  //webpack插件
  plugins: [
    //热加载插件
    new webpack.HotModuleReplacementPlugin(),
  ],
  //开发服务器配置
  devServer: {
    //加载内容目录
    contentBase: './dist',
    //是否热加载
    hot: true,
    //加载IP地址
    host: '0.0.0.0',
  }
};
