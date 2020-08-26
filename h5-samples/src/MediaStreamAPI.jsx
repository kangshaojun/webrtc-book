import React from "react";
import { Button } from "antd";

//MediaStream对象
let stream;
/**
 * 摄像头使用示例
 */
class MediaStreamAPI extends React.Component {
    constructor() {
        super();
    }

    componentDidMount() {
        this.openDevice();
    }

    //打开音视频设备
    openDevice = async () => {
        try {
            //根据约束条件获取媒体
            stream = await navigator.mediaDevices.getUserMedia({
                //启用音频
                audio: true,
                //启用视频
                video: true
            });
            let video = this.refs['myVideo'];
            video.srcObject = stream;
        } catch (e) {
            console.log(`getUserMedia错误:` + error);
        }
    }

    //获取音频轨道列表
    btnGetAudioTracks = () => {
        console.log("getAudioTracks");
        //返回一个数据
        console.log(stream.getAudioTracks());
    }

    //根据Id获取音频轨道
    btnGetTrackById = () => {
        console.log("getTrackById");
        console.log(stream.getTrackById(stream.getAudioTracks()[0].id));
    }

    //删除音频轨道
    btnRemoveAudioTrack = () => {
        console.log("removeAudioTrack()");
        stream.removeTrack(stream.getAudioTracks()[0]);
    }

    //获取所有轨道,包括音频及视频
    btnGetTracks = () => {
        console.log("getTracks()");
        console.log(stream.getTracks());
    }

    //获取视频轨道列表
    btnGetVideoTracks = () => {
        console.log("getVideoTracks()");
        console.log(stream.getVideoTracks());
    }

    //删除视频轨道
    btnRemoveVideoTrack = () => {
        console.log("removeVideoTrack()");
        stream.removeTrack(stream.getVideoTracks()[0]);
    }

    render() {
        return (
            <div className="container">
                <h1>
                    <span>MediaStreamAPI测试</span>
                </h1>
                <video className="video" ref="myVideo" autoPlay playsInline></video>
                <Button onClick={this.btnGetTracks} style={{width:'120px'}}>获取所有轨道</Button>
                <Button onClick={this.btnGetAudioTracks} style={{width:'120px'}}>获取音频轨道</Button>
                <Button onClick={this.btnGetTrackById} style={{width:'200px'}}>根据Id获取音频轨道</Button>
                <Button onClick={this.btnRemoveAudioTrack} style={{width:'120px'}}>删除音频轨道</Button>
                <Button onClick={this.btnGetVideoTracks} style={{width:'120px'}}>获取视频轨道</Button>
                <Button onClick={this.btnRemoveVideoTrack} style={{width:'120px'}}>删除视频轨道</Button>
            </div>
        );
    }
}
//导出组件
export default MediaStreamAPI;
