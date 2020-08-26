import React from "react";
import { Button } from "antd";
import '../styles/css/record-canvas.scss';

//录制对象
let mediaRecorder;
//录制数据
let recordedBlobs;
//捕获数据流
let stream;
//画布对象
let canvas;
//画布2D内容
let context;

/**
 * 录制Canvas示例
 */
class RecordCanvas extends React.Component {

    componentDidMount() {
        this.drawLine();
    }

    drawLine = () => {
        //获取Canvas对象
        canvas = this.refs['canvas'];
        //获取Canvas的2d内容
        context = canvas.getContext("2d");

        //填充颜色
        context.fillStyle = '#CCC';
        //绘制Canvas背景
        context.fillRect(0,0,320,240);

        context.lineWidth = 1;
        //画笔颜色
        context.strokeStyle = "#FF0000";

        //监听画板鼠标按下事件 开始绘画
        canvas.addEventListener("mousedown", this.startAction);
        //监听画板鼠标抬起事件 结束绘画
        canvas.addEventListener("mouseup", this.endAction);
    }

    //鼠标按下事件
    startAction = (event) => {
        //开始新的路径
        context.beginPath();
        //将画笔移动到指定坐标，类似起点
        context.moveTo(event.offsetX, event.offsetY);
        //开始绘制
        context.stroke();
        //监听鼠标移动事件  
        canvas.addEventListener("mousemove", this.moveAction);
    }

    //鼠标移动事件  
    moveAction = (event) => {
        //将画笔移动到结束坐标，类似终点
        context.lineTo(event.offsetX, event.offsetY);
        //开始绘制
        context.stroke();
    }

    //鼠标抬起事件 
    endAction = () => {
        //移除鼠标移动事件
        canvas.removeEventListener("mousemove", this.moveAction);
    }

    //开始捕获Canvas
    startCaptureCanvas = async (e) => {
        stream = canvas.captureStream(10);
        const video = this.refs['video'];
        //获取视频轨道
        const videoTracks = stream.getVideoTracks();
        //读取视频资源名称
        console.log(`视频资源名称: ${videoTracks[0].label}`);
        window.stream = stream;
        //将视频对象的源指定为stream
        video.srcObject = stream;

        //开始录制
        this.startRecord();
    }

    //开始录制
    startRecord = (e) => {
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
        mediaRecorder.start(100);
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
        a.download = 'canvas.webm';
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
                    <span>录制Canvas示例</span>
                </h1>
                <div>
                    {/* 画布Canvas容器 */}
                    <div className="small-canvas">
                        {/* Canvas不设置样式 */}
                        <canvas ref='canvas'></canvas>
                    </div>
                    <video className="small-video" ref='video' playsInline autoPlay></video>
                </div>
                <Button className="button" onClick={this.startCaptureCanvas}>开始</Button>
                <Button className="button" onClick={this.stopRecord}>停止</Button>
            </div>
        );
    }
}
//导出组件
export default RecordCanvas;
