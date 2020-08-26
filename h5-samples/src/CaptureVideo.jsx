import React from "react";
/**
 * 捕获Video作为媒体流示例
 */
class CaptureVideo extends React.Component {
    constructor() {
        super();
    }

    //开始播放
    canPlay = () => {

        //源视频对象
        let sourceVideo = this.refs['sourceVideo'];
        //播放视频对象
        let playerVideo = this.refs['playerVideo'];

        //MediaStream对象
        let stream;
        //捕获侦率
        const fps = 0;
        //浏览器兼容判断,捕获媒体流
        if (sourceVideo.captureStream) {
            stream = sourceVideo.captureStream(fps);
        } else if (sourceVideo.mozCaptureStream) {
            stream = sourceVideo.mozCaptureStream(fps);
        } else {
            console.error('captureStream不支持');
            stream = null;
        }
        //将播放器源指定为stream
        playerVideo.srcObject = stream;
    }

    render() {
        return (
            <div className="container">
                <h1>
                    <span>捕获Video作为媒体流示例</span>
                </h1>
                {/* 源视频 显示控制按钮 循环播放 */}
                <video ref="sourceVideo" playsInline controls loop muted onCanPlay={this.canPlay}>
                    {/* mp4视频路径 */}
                    <source src="./assets/webrtc.mp4" type="video/mp4" />
                </video>
                <video ref="playerVideo" playsInline autoPlay></video>
            </div>
        );
    }
}
//导出组件
export default CaptureVideo;
