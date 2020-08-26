package.json注释

{
  //项目名称
  "name": "h5-samples",
  //版本号
  "version": "0.0.1",
  //项目描述
  "description": "h5 webrtc samples",
  "main": "src/index.jsx",//入口程序
  "scripts": {
    //可使用npm build命令构建打包程序
    "build": "webpack --mode=production --config webpack.config.js",
    //可使用npm start命令启动程序
    "start": "webpack-dev-server --config ./webpack.config.js --mode development --open --https --cert ./configs/cert.pem --key  ./configs/key.pem"
  },
  //作者
  "author": "kangshaojun",
  //授权
  "license": "MIT",
  //开发库
  "devDependencies": {
    //语法转换库,如ES6转ES5
    "@babel/core": "^7.4.3",
    "@babel/plugin-proposal-class-properties": "^7.4.4",
    "@babel/plugin-transform-runtime": "^7.4.4",
    "@babel/preset-env": "^7.4.3",
    "@babel/preset-react": "^7.0.0",
    "@babel/runtime": "^7.4.4",
    "babel-loader": "^8.0.5",
    "babel-plugin-import": "^1.13.0",
    //css加载器
    "css-loader": "^3.2.0",
    //webpack文本插件
    "extract-text-webpack-plugin": "^4.0.0-beta.0",
    //node使用sass库
    "node-sass": "^4.9.2",
    //sass加载库
    "sass-loader": "^7.0.3",
    //样式加载器
    "style-loader": "^0.23.1",
    //打包工具
    "webpack": "^4.30.0",
    "webpack-cli": "^3.3.1",
    "webpack-dev-server": "^3.3.1",
    //文件拷贝插件
    "copy-webpack-plugin": "^5.0.5"
  },
  //引用库
  "dependencies": {
    //ant desgin组件
    "antd": "^4.1.1",
    //文件拷贝插件
    "copy-webpack-plugin": "^5.0.5",
    //react使用的mdi图标库
    "mdi-react": "^6.4.0",
    //react相关库
    "react": "^16.8.6",
    "react-dom": "^16.8.6",
    "react-mdi": "^0.5.7",
    "react-router-dom": "^5.1.2",
    "reactjs-localstorage": "0.0.8"
  },
  //关键字
  "keywords": [
    "h5",
    "webrtc",
    "js"
  ]
}
