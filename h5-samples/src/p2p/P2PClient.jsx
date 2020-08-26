import React from 'react';
import { List, Button } from "antd";
import HangupIcon from "mdi-react/PhoneHangupIcon";
import VideoIcon from "mdi-react/VideoIcon";
import VideocamOffIcon from "mdi-react/VideocamOffIcon";
import MicrophoneIcon from "mdi-react/MicrophoneIcon";
import MicrophoneOffIcon from "mdi-react/MicrophoneOffIcon";
import LocalVideoView from './LocalVideoView';
import RemoteVideoView from './RemoteVideoView';
import P2PVideoCall from './P2PVideoCall';
import P2PLogin from './P2PLogin';
import './../../styles/css/p2p.scss';
/**
 * 一对一客户端
 */
class P2PClient extends React.Component {

  constructor(props) {
    super(props);
    //信令对象
    this.p2pVideoCall = null;
    //初始状态值
    this.state = {
      //Users数组
      users: [],
      //自己Id
      userId: null,
      //用户名
      userName:'',
      //房间号
      roomId:'111111',
      //是否正在视频通话
      isVideoCall: false,
      //是否登录房间
      isLogin:false,
      //本地流
      localStream: null,
      //远端流
      remoteStream: null,
      //禁用音频
      audioMuted: false,
      //禁用视频
      videoMuted: false,
    };
  }
  
  connectServer = () => {
    //WebSocket连接url
    var p2pUrl = 'wss://' + window.location.hostname + ':8000/ws';
    var turnUrl = 'https://' + window.location.hostname + ':9000/api/turn?service=turn&username=sample';
    console.log("信令服务器地址:" +p2pUrl);
    console.log("中转服务器地址:" +turnUrl);
    //初始化信令 传入url及名称
    this.p2pVideoCall = new P2PVideoCall(p2pUrl,turnUrl,this.state.userName,this.state.roomId);
    //监听更新用户列表事件
    this.p2pVideoCall.on('updateUserList', (users, self) => {
      this.setState({ 
        users:users, 
        userId: self,
      });
    });
    //监听新的呼叫事件
    this.p2pVideoCall.on('newCall', (from, sessios) => {
      this.setState({ isVideoCall: true });
    });
    //监听新本地流事件
    this.p2pVideoCall.on('localstream', (stream) => {
      this.setState({ localStream: stream });
    });
    //监听新远端流添加事件
    this.p2pVideoCall.on('addstream', (stream) => {
      this.setState({ remoteStream: stream });
    });
    //监听远端流移除事件
    this.p2pVideoCall.on('removestream', (stream) => {
      this.setState({ remoteStream: null });
    });
    //监听会话结束事件
    this.p2pVideoCall.on('hangUp', (to, session) => {
      this.setState({ 
        isVideoCall: false, 
        localStream: null, 
        remoteStream: null 
      });
    });
    //监听离开事件
    this.p2pVideoCall.on('leave', (to) => {
      this.setState({ isVideoCall: false, localStream: null, remoteStream: null });
    });
  }
  
  //呼叫对方参与会话
  handleStartCall = (remoteUserId, type) => {
    this.p2pVideoCall.startCall(remoteUserId, type);
  }
  
  //挂断处理
  handleUp = () => {
    this.p2pVideoCall.hangUp();
  }

  //打开/关闭本地视频
  onVideoOnClickHandler = () => {
    let videoMuted = !this.state.videoMuted;
    this.onToggleLocalVideoTrack(videoMuted);
    this.setState({ videoMuted });
  }

  onToggleLocalVideoTrack = (muted) => {
    //获取所有视频频轨道
    var videoTracks = this.state.localStream.getVideoTracks();
    if (videoTracks.length === 0) {
      console.log("没有本地视频.");
      return;
    }
    console.log("打开/关闭本地视频.");
    //循环迭代所有轨道
    for (var i = 0; i < videoTracks.length; ++i) {
      //设置每个轨道的enabled值
      videoTracks[i].enabled = !muted;
    }
  }

  //打开/关闭本地音频
  onAudioClickHandler = () => {
        let audioMuted = !this.state.audioMuted;
        this.onToggleLocalAudioTrack(audioMuted);
        this.setState({audioMuted:audioMuted});
    }

  onToggleLocalAudioTrack = (muted) => {
      //获取所有音频轨道
      var audioTracks = this.state.localStream.getAudioTracks();
      if(audioTracks.length === 0){
          console.log("没有本地音频");
          return;
      }
      console.log("打开/关闭本地音频.");
      //循环迭代所有轨道
      for(var i = 0; i<audioTracks.length; ++i){
          //设置每个轨道的enabled值
          audioTracks[i].enabled = !muted;
      }
  }

  loginHandler = (userName,roomId) =>{
    this.setState({
      isLogin:true,
      userName:userName,
      roomId:roomId,
    });
    this.connectServer();
  }

  render() {
    return (
      <div className="main-layout">
        {/* 判断打开状态 */}
        {!this.state.isLogin ?
          <div className="login-container">
            <h2>一对一视频通话案例</h2>
            <P2PLogin loginHandler={this.loginHandler}/>
          </div>
          :
          !this.state.isVideoCall ?
          <List bordered header={"一对一视频通话案例"} footer={"终端列表(Web/Android/iOS)"}>
            {
              //迭代所有的用户
              this.state.users.map((user, i) => {
                return (
                  <List.Item key={user.id}>
                    <div className="list-item">
                      {user.name + user.id}
                      {user.id !== this.state.userId &&
                        <div>
                          <Button type="link"  onClick={() => this.handleStartCall(user.id, 'video')}>视频</Button>
                          <Button type="link"  onClick={() => this.handleStartCall(user.id, 'screen')}>共享桌面</Button>
                        </div>
                      }
                    </div>
                  </List.Item>
                )
              })
            }
          </List>
          :
          <div>
            <div>
              {
                //渲染本地视频
                this.state.remoteStream != null ? <RemoteVideoView stream={this.state.remoteStream} id={'remoteview'} /> : null
              }
              {
                //渲染远端视频
                this.state.localStream != null ? <LocalVideoView stream={this.state.localStream} muted={this.state.videoMuted} id={'localview'} /> : null
              }
            </div>
            <div className="btn-tools">
              {/* 打开/关闭视频 */}
              <Button className="button" ghost size="large" shape="circle"
                icon={this.state.videoMuted ? <VideocamOffIcon /> : <VideoIcon />}
                onClick={this.onVideoOnClickHandler}
              >
              </Button>
              {/* 挂断 */}
              <Button className="button" ghost size="large" shape="circle"
                icon={<HangupIcon />}
                onClick={this.handleUp}
              >
              </Button>
              {/* 打开/关闭音频 */}
              <Button ghost size="large" shape="circle"
                icon={this.state.audioMuted ? <MicrophoneOffIcon /> : <MicrophoneIcon />}
                onClick={this.onAudioClickHandler}
              >
              </Button>
            </div>
          </div>
        }
      </div>
    );
  }
}
//导出组件
export default P2PClient;
