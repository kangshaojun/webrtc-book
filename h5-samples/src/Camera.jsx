import React from "react";
import { Button, message } from "antd";

//约束条件
const constraints = window.constraints = {
  //禁用音频
  audio: false,
  //启用视频
  video: true
};

/**
 * 摄像头使用示例
 */
class Camera extends React.Component {
  constructor() {
    super();
  }

  //打开摄像头
  openCamera = async (e) => {
    try {
      //根据约束条件获取媒体
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('handleSuccess:');
      this.handleSuccess(stream);
    } catch (e) {
      this.handleError(e);
    }
  }

  handleSuccess = (stream) => {
    const video = this.refs['myVideo'];
    const videoTracks = stream.getVideoTracks();
    console.log('通过设置限制条件获取到流:', constraints);
    console.log(`使用的视频设备: ${videoTracks[0].label}`);
    //使得浏览器能访问到stream
    window.stream = stream; 
    video.srcObject = stream;
  }

  handleError(error) {
    if (error.name === 'ConstraintNotSatisfiedError') {
      const v = constraints.video;
      //宽高尺寸错误
      message.error(`宽:${v.width.exact} 高:${v.height.exact} 设备不支持`);
    } else if (error.name === 'PermissionDeniedError') {
      message.error('没有摄像头和麦克风使用权限,请点击允许按钮');
    }
    message.error(`getUserMedia错误: ${error.name}`, error);
  }

  render() {
    return (
      <div className="container">
        <h1>
          <span>摄像头示例</span>
        </h1>
        <video className="video" ref="myVideo" autoPlay playsInline></video>
        <Button onClick={this.openCamera}>打开摄像头</Button>
      </div>
    );
  }
}
//导出组件
export default Camera;
