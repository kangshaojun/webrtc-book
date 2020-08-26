import React from "react";
import { Button, Select } from "antd";

const { Option } = Select;

//QVGA 320*240
const qvgaConstraints = {
    video: { width: { exact: 320 }, height: { exact: 240 } }
};

//VGA 640*480
const vgaConstraints = {
    video: { width: { exact: 640 }, height: { exact: 480 } }
};

//高清 1280*720
const hdConstraints = {
    video: { width: { exact: 1280 }, height: { exact: 720 } }
};

//超清 1920*1080
const fullHdConstraints = {
    video: { width: { exact: 1920 }, height: { exact: 1080 } }
};

//2K 2560*1440
const twoKConstraints = {
    video: { width: { exact: 2560 }, height: { exact: 1440 } }
};

//4K 4096*2160
const fourKConstraints = {
    video: { width: { exact: 4096 }, height: { exact: 2160 } }
};

//8K 7680*4320
const eightKConstraints = {
    video: { width: { exact: 7680 }, height: { exact: 4320 } }
};

//视频流
let stream;
//视频对象
let video;

/**
 * 分辨率示例
 */
class Resolution extends React.Component {

    componentDidMount() {
        //获取video对象引用
        video = this.refs['video'];
    }

    //根据约束获取视频
    getMedia = (constraints) => {
        //判断流对象是否为空
        if (stream) {
            //迭代并停止所有轨道
            stream.getTracks().forEach(track => {
                track.stop();
            });
        }
        //重新获取视频
        navigator.mediaDevices.getUserMedia(constraints)
            //成功获取
            .then(this.gotStream)
            //错误
            .catch(e => {
                this.handleError(e);
            });
    }

    //得到视频流处理
    gotStream = (mediaStream) => {
        stream = window.stream = mediaStream;
        //将video视频源指定为mediaStream
        video.srcObject = mediaStream;
        const track = mediaStream.getVideoTracks()[0];
        const constraints = track.getConstraints();
        console.log('约束条件为:' + JSON.stringify(constraints));
    }

    //错误处理
    handleError(error) {
        console.log(`getUserMedia错误: ${error.name}`, error);
    }

    //选择框选择改变
    handleChange = (value) => {
        console.log(`selected ${value}`);
        //根据选择框的值获取不同分辨率的视频
        switch (value) {
            case 'qvga':
                this.getMedia(qvgaConstraints);
                break;
            case 'vga':
                this.getMedia(vgaConstraints);
                break;
            case 'hd':
                this.getMedia(hdConstraints);
                break;
            case 'fullhd':
                this.getMedia(fullHdConstraints);
                break;
            case '2k':
                this.getMedia(twoKConstraints);
                break;
            case '4k':
                this.getMedia(fourKConstraints);
                break;
            case '8k':
                this.getMedia(eightKConstraints);
                break;
            default:
                this.getMedia(vgaConstraints);
                break;
        }
    }

    //动态改变分辨率
    dynamicChange = (e) => {
        //获取当前的视频流中的视频轨道
        const track = window.stream.getVideoTracks()[0];
        //使用超清约束作为测试条件
        console.log('应用高清效果:' + JSON.stringify(hdConstraints));
        track.applyConstraints(constraints)
            .then(() => {
              console.log('动态改变分辨率成功...');
            })
            .catch(err => {
              console.log('动态改变分辨率错误:', err.name);
            });
      }

    render() {
        return (
            <div className="container">
                <h1>
                    <span>视频分辨率示例</span>
                </h1>
                {/* 视频渲染 */}
                <video ref='video' playsInline autoPlay></video>
                {/* 清晰度选择 */}
                <Select defaultValue="vga" style={{ width: '100px',marginLeft:'20px' }} onChange={this.handleChange}>
                    <Option value="qvga">QVGA</Option>
                    <Option value="vga">VGA</Option>
                    <Option value="hd">高清</Option>
                    <Option value="fullhd">超清</Option>
                    <Option value="2k">2K</Option>
                    <Option value="4k">4K</Option>
                    <Option value="8k">8K</Option>
                </Select>
                <Button onClick={this.dynamicChange} style={{ marginLeft:'20px' }}>动态设置</Button>
            </div>
        );
    }
}
//导出组件
export default Resolution;
