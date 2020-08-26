import React from "react";
import ReactDOM from "react-dom";
//导入主组件
import App from "./App";
//导入antd样式
import "antd/dist/antd.css";
//导入全局样式
import "../styles/css/styles.scss";

//将根组件App渲染至首页div里
ReactDOM.render( <App />, document.getElementById("app"));
