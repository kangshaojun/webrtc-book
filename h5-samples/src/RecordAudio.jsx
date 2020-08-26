import React from "react";
import { Button, } from "antd";
import "../styles/css/record-audio.scss";

//录制对象
let mediaRecorder;
//录制数据
let recordedBlobs;
//音频播放对象
let audioPlayer;
/**
 * 录制音频示例
 */
class RecordAudio extends React.Component {
  constructor() {
    super();
    //初始操作状态
    this.state = {
      status: 'start',
    }
  }

  componentDidMount() {
    //获取音频播放器
    audioPlayer = this.refs['audioPlayer'];
  }

  //点击打开麦克风按钮
  startClickHandler = async (e) => {
    try {
      //获取音频数据流
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('获取音频stream:', stream);
      //将stream与window.stream绑定
      window.stream = stream;

      //设置当前状态为startRecord
      this.setState({
        status: 'startRecord',
      });

    } catch (e) {
      //发生错误
      console.error('navigator.getUserMedia error:', e);
    }
  }

  //开始录制
  startRecordButtonClickHandler = (e) => {
    recordedBlobs = [];
    //媒体类型
    let options = { mineType: 'audio/ogg;' };
    try {
      //初始化MediaRecorder对象,传入音频流及媒体类型
      mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e) {
      console.error('MediaRecorder创建失败:', e);
      return;
    }

    //录制停止事件回调
    mediaRecorder.onstop = (event) => {
      console.log('Recorder stopped: ', event);
      console.log('Recorded Blobs: ', recordedBlobs);
    };
    //当数据有效时触发的事件,可以把数据存储到缓存区里
    mediaRecorder.ondataavailable = this.handleDataAvailable;
    //录制10秒
    mediaRecorder.start(10);
    console.log('MediaRecorder started', mediaRecorder);

    //设置当前状态为stopRecord
    this.setState({
      status: 'stopRecord',
    });
  }

  //停止录制
  stopRecordButtonClickHandler = (e) => {
    mediaRecorder.stop();
    //设置当前状态为play
    this.setState({
      status: 'play',
    });
  }

  //播放录制数据
  playButtonClickHandler = (e) => {
    //生成blob文件,类型为audio/ogg
    const blob = new Blob(recordedBlobs, { type: 'audio/ogg' });

    audioPlayer.src = null;
    //根据blob文件生成播放器的数据源
    audioPlayer.src = window.URL.createObjectURL(blob);
    //播放声音
    audioPlayer.play();
    //设置当前状态为download
    this.setState({
      status: 'download',
    });
  }

  //下载录制文件
  downloadButtonClickHandler = (e) => {
    //生成blob文件,类型为audio/ogg
    const blob = new Blob(recordedBlobs, { type: 'audio/ogg' });
    //URL.createObjectURL()方法会根据传入的参数创建一个指向该参数对象的URL
    const url = window.URL.createObjectURL(blob);
    //创建a标签
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    //设置下载文件
    a.download = 'test.ogg';
    //将a标签添加至网页上去
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      //URL.revokeObjectURL()方法会释放一个通过URL.createObjectURL()创建的对象URL.
      window.URL.revokeObjectURL(url);
    }, 100);
    //设置当前状态为start
    this.setState({
      status: 'start',
    });
  }

  //录制数据回调事件
  handleDataAvailable = (event) => {
    console.log('handleDataAvailable', event);
    //判断是否有数据
    if (event.data && event.data.size > 0) {
      //将数据记录起来
      recordedBlobs.push(event.data);
    }
  }

  render() {

    return (
      <div className="container">
        <h1>
          <span>音频录制</span>
        </h1>

        {/* 音频播放器,播放录制音频 */}
        <audio ref="audioPlayer" controls autoPlay></audio>

        <div>
          <Button
            className="button"
            onClick={this.startClickHandler}
            disabled={this.state.status != 'start'}>
            打开麦克风
            </Button>
          <Button
            className="button"
            disabled={this.state.status != 'startRecord'}
            onClick={this.startRecordButtonClickHandler}>
            开始录制
          </Button>
          <Button
            className="button"
            disabled={this.state.status != 'stopRecord'}
            onClick={this.stopRecordButtonClickHandler}>
            停止录制
          </Button>
          <Button
            className="button"
            disabled={this.state.status != 'play'}
            onClick={this.playButtonClickHandler}>
            播放
          </Button>
          <Button
            className="button"
            disabled={this.state.status != 'download'}
            onClick={this.downloadButtonClickHandler}>
            下载
            </Button>
        </div>
      </div>
    );
  }
}
//导出组件
export default RecordAudio;
