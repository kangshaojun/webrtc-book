import React from "react";
import { Button } from "antd";
import '../styles/css/datachannel.scss';

//本地连接对象
let localConnection;
//远端连接对象
let remoteConnection;
//发送通道
let sendChannel;
//接收通道
let receiveChannel;
/**
 * 数据通道示例
 */
class DataChannel extends React.Component {

  //呼叫
  call = async () => {
    console.log('开始呼叫...');

    //设置ICE Server,使用Google服务器
    let configuration = { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] };

    //创建RTCPeerConnection对象
    localConnection = new RTCPeerConnection(configuration);
    console.log('创建本地PeerConnection成功:localConnection');
    //监听返回的Candidate信息
    localConnection.addEventListener('icecandidate', this.onLocalIceCandidate);

    //实例化发送通道
    sendChannel = localConnection.createDataChannel('webrtc-datachannel');
    //onopen事件监听
    sendChannel.onopen = this.onSendChannelStateChange;
    //onclose事件监听
    sendChannel.onclose = this.onSendChannelStateChange;

    //创建RTCPeerConnection对象
    remoteConnection = new RTCPeerConnection(configuration);
    console.log('创建本地PeerConnection成功:remoteConnection');
    //监听返回的Candidate信息
    remoteConnection.addEventListener('icecandidate', this.onRemoteIceCandidate);

    //远端连接数据到达事件监听
    remoteConnection.ondatachannel = this.receiveChannelCallback;

    //监听ICE状态变化
    localConnection.addEventListener('iceconnectionstatechange', this.onLocalIceStateChange);
    //监听ICE状态变化
    remoteConnection.addEventListener('iceconnectionstatechange', this.onRemoteIceStateChange);

    try {
      console.log('localConnection创建提议Offer开始');
      //创建提议Offer
      const offer = await localConnection.createOffer();
      //创建Offer成功
      await this.onCreateOfferSuccess(offer);
    } catch (e) {
      //创建Offer失败
      this.onCreateSessionDescriptionError(e);
    }
  }

  //创建会话描述错误
  onCreateSessionDescriptionError = (error) => {
    console.log(`创建会话描述SD错误: ${error.toString()}`);
  }

  //创建提议Offer成功
  onCreateOfferSuccess = async (desc) => {
    //localConnection创建Offer返回的SDP信息
    console.log(`localConnection创建Offer返回的SDP信息\n${desc.sdp}`);
    console.log('设置localConnection的本地描述start');
    try {
      //设置localConnection的本地描述
      await localConnection.setLocalDescription(desc);
      this.onSetLocalSuccess(localConnection);
    } catch (e) {
      this.onSetSessionDescriptionError();
    }

    console.log('remoteConnection开始设置远端描述');
    try {
      //设置remoteConnection的远端描述
      await remoteConnection.setRemoteDescription(desc);
      this.onSetRemoteSuccess(remoteConnection);
    } catch (e) {
      //创建会话描述错误
      this.onSetSessionDescriptionError();
    }

    console.log('remoteConnection开始创建应答Answer');
    try {
      //创建应答Answer
      const answer = await remoteConnection.createAnswer();
      //创建应答成功
      await this.onCreateAnswerSuccess(answer);
    } catch (e) {
      //创建会话描述错误
      this.onCreateSessionDescriptionError(e);
    }
  }

  //设置本地描述完成
  onSetLocalSuccess = (pc) => {
    console.log(`${this.getName(pc)}设置本地描述完成:setLocalDescription`);
  }

  //设置远端描述完成
  onSetRemoteSuccess = (pc) => {
    console.log(`${this.getName(pc)}设置远端描述完成:setRemoteDescription`);
  }

  //设置描述SD错误
  onSetSessionDescriptionError = (error) => {
    console.log(`设置描述SD错误: ${error.toString()}`);
  }

  getName = (pc) => {
    return (pc === localConnection) ? 'localConnection' : 'remoteConnection';
  }

  //创建应答成功
  onCreateAnswerSuccess = async (desc) => {
    //输出SDP信息
    console.log(`remoteConnection的应答Answer数据:\n${desc.sdp}`);
    console.log('remoteConnection设置本地描述开始:setLocalDescription');
    try {
      //设置remoteConnection的本地描述信息
      await remoteConnection.setLocalDescription(desc);
      this.onSetLocalSuccess(remoteConnection);
    } catch (e) {
      this.onSetSessionDescriptionError(e);
    }
    console.log('localConnection设置远端描述开始:setRemoteDescription');
    try {
      //设置localConnection的远端描述,即remoteConnection的应答信息
      await localConnection.setRemoteDescription(desc);
      this.onSetRemoteSuccess(localConnection);
    } catch (e) {
      this.onSetSessionDescriptionError(e);
    }
  }

  //Candidate事件回调方法
  onLocalIceCandidate = async (event) => {
    try {
      if (event.candidate) {
        //将会localConnection的Candidate添加至remoteConnection里
        await remoteConnection.addIceCandidate(event.candidate);
        this.onAddIceCandidateSuccess(remoteConnection);
      }
    } catch (e) {
      this.onAddIceCandidateError(remoteConnection, e);
    }
    console.log(`IceCandidate数据:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
  }

  //Candidate事件回调方法
  onRemoteIceCandidate = async (event) => {
    try {
      if (event.candidate) {
        //将会remoteConnection的Candidate添加至localConnection里
        await localConnection.addIceCandidate(event.candidate);
        this.onAddIceCandidateSuccess(localConnection);
      }
    } catch (e) {
      this.onAddIceCandidateError(localConnection, e);
    }
    console.log(`IceCandidate数据:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
  }

  //添加Candidate成功
  onAddIceCandidateSuccess = (pc) => {
    console.log(`${this.getName(pc)}添加IceCandidate成功`);
  }

  //添加Candidate失败
  onAddIceCandidateError = (pc, error) => {
    console.log(`${this.getName(pc)}添加IceCandidate失败: ${error.toString()}`);
  }

  //监听ICE状态变化事件回调方法
  onLocalIceStateChange = (event) => {
    console.log(`localConnection连接的ICE状态: ${localConnection.iceConnectionState}`);
    console.log('ICE状态改变事件: ', event);
  }

  //监听ICE状态变化事件回调方法
  onRemoteIceStateChange = (event) => {
    console.log(`remoteConnection连接的ICE状态: ${remoteConnection.iceConnectionState}`);
    console.log('ICE状态改变事件: ', event);
  }

  //断开连接
  hangup = () => {
    console.log('结束会话');
    //关闭localConnection
    localConnection.close();
    //关闭remoteConnection
    remoteConnection.close();
    //localConnection置为空
    localConnection = null;
    //remoteConnection置为空
    remoteConnection = null;
  }

  sendData = () => {
    let dataChannelSend = this.refs['dataChannelSend'];
    const data = dataChannelSend.value;
    sendChannel.send(data);
    console.log('发送的数据:' + data);
  }

  //接收通道数据到达回调方法
  receiveChannelCallback = (event) => {
    console.log('Receive Channel Callback');
    //实例化接收通道
    receiveChannel = event.channel;
    //接收消息事件监听
    receiveChannel.onmessage = this.onReceiveMessageCallback;
    //onopen事件监听
    receiveChannel.onopen = this.onReceiveChannelStateChange;
    //onclose事件监听
    receiveChannel.onclose = this.onReceiveChannelStateChange;
  }
  
  //接收消息处理
  onReceiveMessageCallback = (event) => {
    console.log('接收的数据:' + event.data);
    let dataChannelReceive = this.refs['dataChannelReceive'];
    dataChannelReceive.value = event.data;
  }
  
  //发送通道状态变化
  onSendChannelStateChange = () => {
    const readyState = sendChannel.readyState;
    console.log('发送通道状态: ' + readyState);
  }
  
  //接收通道状态变化
  onReceiveChannelStateChange = () => {
    const readyState = receiveChannel.readyState;
    console.log('接收通道状态:' + readyState);
  }

  render() {
    return (
      <div className="container">
        <div>
          <div>
            <h2>发送</h2>
            <textarea ref="dataChannelSend" disabled={false}
              placeholder="请输入要发送的文本..." />
          </div>
          <div>
            <h2>接收</h2>
            <textarea ref="dataChannelReceive" disabled={false} />
          </div>
        </div>
        <div>
          <Button onClick={this.call} style={{ marginRight: "10px" }}>呼叫</Button>
          <Button onClick={this.sendData} style={{ marginRight: "10px" }}>发送</Button>
          <Button onClick={this.hangup} style={{ marginRight: "10px" }}>挂断</Button>
        </div>
      </div>
    );
  }
}
//导出组件
export default DataChannel;
