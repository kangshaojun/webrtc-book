import React from 'react';
import { Modal, Button, Select } from 'antd';
import SoundMeter from './soundmeter';
import '../../styles/css/media-settings.scss';

const Option = Select.Option;
/**
 * 音频 视频 分辨率 综合设置
 */
export default class MediaSettings extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            //是否弹出对话框
            visible: false,
            //视频输入设备列表
            videoDevices: [],
            //音频输入设备列表
            audioDevices: [],
            //音频输出设备列表
            audioOutputDevices: [],
            //分辨率
            resolution: 'vga',
            //当前选择的音频输入设备
            selectedAudioDevice: "",
            //当前选择的视频输入设备
            selectedVideoDevice: "",
            //音频音量
            audioLevel: 0,
        }

        try {
            //AudioContext是用于管理和播放所有的声音
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            //实例化AudioContext
            window.audioContext = new AudioContext();
        } catch (e) {
            console.log('网页音频API不支持.');
        }
    }

    componentDidMount() {
        if (window.localStorage) {
            //读取本地存储信息
            let deviceInfo = localStorage["deviceInfo"];
            if (deviceInfo) {
                //将JSON数据转成对象
                let info = JSON.parse(deviceInfo);
                //设置本地状态值
                this.setState({
                    selectedAudioDevice: info.audioDevice,
                    selectedVideoDevice: info.videoDevice,
                    resolution: info.resolution,
                });
            }
        }
        //更新设备
        this.updateDevices().then((data) => {
            //判断当前选择的音频输入设备是否为空并且是否有设备
            if (this.state.selectedAudioDevice === "" && data.audioDevices.length > 0) {
                //默认选中第一个设备
                this.state.selectedAudioDevice = data.audioDevices[0].deviceId;
            }
            //判断当前选择的视频输入设备是否为空并且是否有设备
            if (this.state.selectedVideoDevice === "" && data.videoDevices.length > 0) {
                //默认选中第一个设备
                this.state.selectedVideoDevice = data.videoDevices[0].deviceId;
            }
            //设置设备列表状态值
            this.state.videoDevices = data.videoDevices;
            this.state.audioDevices = data.audioDevices;
            this.state.audioOutputDevices = data.audioOutputDevices;
        });

    }

    //更新设备
    updateDevices = () => {
        return new Promise((pResolve, pReject) => {
            //视频输入设备列表
            let videoDevices = [];
            //音频输入设备列表
            let audioDevices = [];
            //音频输出设备列表
            let audioOutputDevices = [];
            //枚举所有设备
            navigator.mediaDevices.enumerateDevices()
                //返回设备列表
                .then((devices) => {
                    //使用循环迭代设备列表
                    for (let device of devices) {
                        //过滤出视频输入设备
                        if (device.kind === 'videoinput') {
                            videoDevices.push(device);
                            //过滤出音频输入设备
                        } else if (device.kind === 'audioinput') {
                            audioDevices.push(device);
                            //过滤出音频输出设备
                        } else if (device.kind === 'audiooutput') {
                            audioOutputDevices.push(device);
                        }
                    }
                }).then(() => {
                    //处理好后将三种设备数据返回
                    let data = { videoDevices, audioDevices, audioOutputDevices };
                    pResolve(data);
                });
        });
    }

    //音频音量处理
    soundMeterProcess = () => {
        //读取音量值,再乘以一个系数,可以得到音量条的宽度
        var val = (window.soundMeter.instant.toFixed(2) * 348) + 1;
        //设置音量值状态
        this.setState({ audioLevel: val });
        if (this.state.visible) {
            //每隔100毫秒调用一次soundMeterProcess函数,模拟实时检测音频音量
            setTimeout(this.soundMeterProcess, 100);
        }
    }

    //开始预览
    startPreview = () => {
        //判断window对象里是否有stream
        if (window.stream) {
            //关闭音视频流
            this.closeMediaStream(window.stream);
        }
        //SoundMeter声音测量,用于做声音音量测算使用的
        this.soundMeter = window.soundMeter = new SoundMeter(window.audioContext);
        let soundMeterProcess = this.soundMeterProcess;

        //视频预览对象
        let videoElement = this.refs['previewVideo'];
        //音频源
        let audioSource = this.state.selectedAudioDevice;
        //视频源
        let videoSource = this.state.selectedVideoDevice;
        //定义约束条件
        let constraints = {
            //设置音频设备Id
            audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
            //设置视频设备Id
            video: { deviceId: videoSource ? { exact: videoSource } : undefined }
        };
        //根据约束条件获取数据流
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (stream) {
                //成功返回音视频流
                window.stream = stream;
                videoElement.srcObject = stream;
                //将声音测量对象与流连接起来
                soundMeter.connectToSource(stream);
                //每隔100毫秒调用一次soundMeterProcess函数,模拟实时检测音频音量
                setTimeout(soundMeterProcess, 100);
                //返回枚举设备
                return navigator.mediaDevices.enumerateDevices();
            })
            .then((devces) => { })
            .catch((erro) => { });


    }

    //停止预览
    stopPreview = () => {
        //关闭音视频流
        if (window.stream) {
            this.closeMediaStream(window.stream);
        }
    }

    //关闭音视频流
    closeMediaStream = (stream) => {
        //判断stream是否为空
        if (!stream) {
            return;
        }
        var tracks, i, len;
        //判断是否有getTracks方法
        if (stream.getTracks) {
            //获取所有的Track
            tracks = stream.getTracks();
            //迭代所有Track
            for (i = 0, len = tracks.length; i < len; i += 1) {
                //停止每个Track
                tracks[i].stop();
            }
        } else {
            //获取所有的音频Track
            tracks = stream.getAudioTracks();
            //迭代所有音频Track
            for (i = 0, len = tracks.length; i < len; i += 1) {
                //停止每个Track
                tracks[i].stop();
            }
            //获取所有的视频Track
            tracks = stream.getVideoTracks();
            //迭代所有视频Track
            for (i = 0, len = tracks.length; i < len; i += 1) {
                //停止每个Track
                tracks[i].stop();
            }
        }
    }

    //弹出对话框
    showModal = () => {
        this.setState({
            visible: true,
        });
        //延迟100毫秒后开始预览
        setTimeout(this.startPreview, 100);
    }

    //点击确定处理
    handleOk = (e) => {
        //关闭对话框
        this.setState({
            visible: false,
        });
        //判断是否能存储
        if (window.localStorage) {
            //设置信息
            let deviceInfo = {
                //音频设备Id
                audioDevice: this.state.selectedAudioDevice,
                //视频设备Id
                videoDevice: this.state.selectedVideoDevice,
                //分辨率
                resolution: this.state.resolution,
            };
            //使用JSON转成字符串后存储在本地
            localStorage["deviceInfo"] = JSON.stringify(deviceInfo);
        }
        //停止预览
        this.stopPreview();
    }

    //取消设置
    handleCancel = (e) => {
        //关闭对话框
        this.setState({
            visible: false,
        });
        //停止预览
        this.stopPreview();
    }

    //音频输入设备改变
    handleAudioDeviceChange = (e) => {
        console.log('选择的音频输入设备为: ' + JSON.stringify(e));
        this.setState({ selectedAudioDevice: e });
        setTimeout(this.startPreview, 100);
    }
    //视频输入设备改变
    handleVideoDeviceChange = (e) => {
        console.log('选择的视频输入设备为: ' + JSON.stringify(e));
        this.setState({ selectedVideoDevice: e });
        setTimeout(this.startPreview, 100);
    }
    //分辨率选择改变
    handleResolutionChange = (e) => {
        console.log('选择的分辨率为: ' + JSON.stringify(e));
        this.setState({ resolution:e});
    }

    render() {
        return (
            <div className="container">
                <h1>
                    <span>设置综合示例</span>
                </h1>
                <Button onClick={this.showModal}>修改设备</Button>
                <Modal
                    title="修改设备"
                    visible={this.state.visible}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                    okText="确定"
                    cancelText="取消">
                    <div className="item">
                        <span className="item-left">麦克风</span>
                        <div className="item-right">
                            <Select value={this.state.selectedAudioDevice} style={{ width: 350 }} onChange={this.handleAudioDeviceChange}>
                                {
                                    this.state.audioDevices.map((device, index) => {
                                        return (<Option value={device.deviceId} key={device.deviceId}>{device.label}</Option>);
                                    })
                                }
                            </Select>
                            <div ref="progressbar" style={{
                                width: this.state.audioLevel + 'px',
                                height: '10px',
                                backgroundColor: '#8dc63f',
                                marginTop: '20px',
                            }}>
                            </div>
                        </div>
                    </div>
                    <div className="item">
                        <span className="item-left">摄像头</span>
                        <div className="item-right">
                            <Select value={this.state.selectedVideoDevice} style={{ width: 350 }} onChange={this.handleVideoDeviceChange}>
                                {
                                    this.state.videoDevices.map((device, index) => {
                                        return (<Option value={device.deviceId} key={device.deviceId}>{device.label}</Option>);
                                    })
                                }
                            </Select>
                            <div className="video-container">
                                <video id='previewVideo' ref='previewVideo' autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }}></video>
                            </div>

                        </div>
                    </div>
                    <div className="item">
                        <span className="item-left">清晰度</span>
                        <div className="item-right">
                            <Select style={{ width: 350 }} value={this.state.resolution} onChange={this.handleResolutionChange}>
                                <Option value="qvga">流畅(320x240)</Option>
                                <Option value="vga">标清(640x360)</Option>
                                <Option value="hd">高清(1280x720)</Option>
                                <Option value="fullhd">超清(1920x1080)</Option>
                            </Select>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }
}
