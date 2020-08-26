import React from "react";
/**
 * 麦克风示例
 */
class Microphone extends React.Component {

  componentDidMount(){
    const constraints = window.constraints = {
      //启用音频
      audio: true,
      //禁用视频
      video: false
    };
    //根据约束条件获取媒体
    navigator.mediaDevices.getUserMedia(constraints).then(this.handleSuccess).catch(this.handleError);
  }

  //获取媒体成功
  handleSuccess = (stream) => {
    //获取audio对象
    let audio = this.refs['audio'];
    //获取音频规道
    const audioTracks = stream.getAudioTracks();
    //获取音频设备名称
    console.log('获取的音频设备为: ' + audioTracks[0].label);
    //不活动状态
    stream.oninactive = () => {
      console.log('Stream停止');
    };
    window.stream = stream;
    //将audio播放源指定为stream
    audio.srcObject = stream;
  }

  //错误处理
  handleError(error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
  }

  render() {
    
    return (

      <div className="container">
        <h1>
          <span>麦克风示例</span>
        </h1>
        {/* 音频对象,可播放声音 */}
        <audio ref="audio" controls autoPlay></audio>
        <p className="warning">警告: 如何没有使用头戴式耳机, 声音会反馈到扬声器.</p>
      </div>

    );
  }
}
//导出组件
export default Microphone;
