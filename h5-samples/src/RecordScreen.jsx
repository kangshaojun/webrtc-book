import React from "react";
import { Button } from "antd";

//录制对象
let mediaRecorder;
//录制数据
let recordedBlobs;
//捕获数据流
let stream;
/**
 * 录制屏幕示例
 */
class RecordScreen extends React.Component {

  //开始捕获桌面
  startCaptureScreen = async (e) => {
    try {
      //调用getDisplayMedia方法,约束设置成{video:true}即可
      stream = await navigator.mediaDevices.getDisplayMedia({
        //设置屏幕分辨率
        video: {
          width: 2880, height: 1800
        }
      });

      const video = this.refs['myVideo'];
      //获取视频轨道
      const videoTracks = stream.getVideoTracks();
      //读取视频资源名称
      console.log(`视频资源名称: ${videoTracks[0].label}`);
      window.stream = stream;
      //将视频对象的源指定为stream
      video.srcObject = stream;

      this.startRecord();

    } catch (e) {
      console.log('getUserMedia错误:' + error);
    }
  }

  //开始录制
  startRecord = (e) => {
    //监听流是否处于不活动状态,用于判断用户是否停止捕获屏幕
    stream.addEventListener('inactive', e => {
      console.log('监听到屏幕捕获停止后停止录制!');
      this.stopRecord(e);
    });

    //录制数据
    recordedBlobs = [];
    try {
      //创建MediaRecorder对象,准备录制
      mediaRecorder = new MediaRecorder(window.stream, { mimeType: 'video/webm' });
    } catch (e) {
      console.error('创建MediaRecorder错误:', e);
      return;
    }

    //录制停止事件监听
    mediaRecorder.onstop = (event) => {
      console.log('录制停止: ', event);
      console.log('录制的Blobs数据为: ', recordedBlobs);
    };

    //录制数据回调事件
    mediaRecorder.ondataavailable = (event) => {
      console.log('handleDataAvailable', event);
      //判断是否有数据
      if (event.data && event.data.size > 0) {
        //将数据记录起来
        recordedBlobs.push(event.data);
      }
    };
    //开始录制并指定录制时间为10秒
    mediaRecorder.start(10);
    console.log('MediaRecorder started', mediaRecorder);
  }

  stopRecord = (e) => {
    //停止录制
    mediaRecorder.stop();
    //停掉所有的规道
    stream.getTracks().forEach(track => track.stop());
    //stream置为空
    stream = null;

    //生成blob文件,类型为video/webm
    const blob = new Blob(recordedBlobs, { type: 'video/webm' });
    //创建一个下载链接
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    //指定下载文件及类型
    a.download = 'screen.webm';
    //将a标签添加至网页上去
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      //释放url对象.
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  render() {
    return (
      <div className="container">
        <h1>
          <span>录制屏幕示例</span>
        </h1>
        {/* 捕获屏幕数据渲染 */}
        <video className="video" ref="myVideo" autoPlay playsInline></video>
        <Button onClick={this.startCaptureScreen} style={{ marginRight: "10px" }}>开始</Button>
        <Button onClick={this.stopRecord}>停止</Button>
      </div>
    );
  }
}
//导出组件
export default RecordScreen;
