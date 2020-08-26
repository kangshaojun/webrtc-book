import React from "react";
import '../styles/css/capture-canvas.scss';

//MediaStream对象
let stream;
//画布对象
let canvas;
//画布2D内容
let context;

/**
 * 捕获Canvas作为媒体流示例
 */
class CaptureCanvas extends React.Component {

    componentDidMount() {
        canvas = this.refs['canvas'];
        this.startCaptureCanvas();
    }

    //开始捕获Canvas
    startCaptureCanvas = async (e) => {
        stream = canvas.captureStream(10);
        const video = this.refs['video'];
        //将视频对象的源指定为stream
        video.srcObject = stream;

        this.drawLine();
    }

    //画线
    drawLine = () => {
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

    render() {
        return (
            <div className="container">
                <h1>
                    <span>捕获Canvas作为媒体流示例</span>
                </h1>
                <div>
                    {/* 画布Canvas容器 */}
                    <div className="small-canvas">
                        {/* Canvas不设置样式 */}
                        <canvas ref='canvas'></canvas>
                    </div>
                    <video className="small-video" ref='video' playsInline autoPlay></video>
                </div>
            </div>
        );
    }
}
//导出组件
export default CaptureCanvas;
