import React from "react";
import { Select } from "antd";
import '../styles/css/video-filter.scss';

const { Option } = Select;

//视频
let video;

/**
 * 视频滤镜示例
 */
class VideoFilter extends React.Component {

    componentDidMount() {
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

    //错误处理
    handleError(error) {
        console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
    }

    //选择框选择改变
    handleChange = (value) => {
        console.log(`selected ${value}`);
        //设置滤镜
        video.className = value;
    }

    render() {

        return (
            <div className="container">
                <h1>
                    <span>视频滤镜示例</span>
                </h1>
                {/* 视频渲染 */}
                <video ref='video' playsInline autoPlay></video>
                {/* 滤镜属性选择 */}
                <Select defaultValue="none" style={{ width: '100px' }} onChange={this.handleChange}>
                    <Option value="none">没有滤镜</Option>
                    <Option value="blur">模糊</Option>
                    <Option value="grayscale">灰度</Option>
                    <Option value="invert">反转</Option>
                    <Option value="sepia">深褐色</Option>
                </Select>
            </div>
        );
    }
}
//导出组件
export default VideoFilter;
