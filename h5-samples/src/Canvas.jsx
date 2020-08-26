import React from "react";
import {Button} from "antd";
import '../styles/css/canvas.scss';

//视频
let video;

/**
 * 画布示例
 */
class Canvas extends React.Component {
  constructor() {
    super();
  }

  componentDidMount(){
    //获取video对象
    video = this.refs['video'];

    //约束条件
    const constraints = {
        //禁用音频
        audio: false,
        //启用视频
        video: true
      };
      //根据约束获取视频流
      navigator.mediaDevices.getUserMedia(constraints).then(this.handleSuccess).catch(this.handleError);
  }

  //获取视频成功
  handleSuccess = (stream) => {
    window.stream = stream;
    //将视频源指定为视频流
    video.srcObject = stream;
  }
  
  //截屏处理
  takeSnap = async (e) => {
    //获取画布对象
    let canvas = this.refs['canvas'];
    //设置画面宽度
    canvas.width = video.videoWidth;
    //设置画面高度
    canvas.height = video.videoHeight;
    //根据视频对象,xy坐标,画布宽,画布高绘制位图
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  }

  //错误处理
  handleError(error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
  }

  render() {
    
    return (
      <div className="container">
        <h1>
          <span>截取视频示例</span>
        </h1>
        <div>
          <video className="small-video" ref='video' playsInline autoPlay></video>
          {/* 画布Canvas */}
          <canvas className="small-canvas" ref='canvas'></canvas>
        </div>
        <Button className="button" onClick={this.takeSnap}>截屏</Button>
      </div>
    );
  }
}
//导出组件
export default Canvas;
