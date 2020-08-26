import 'package:flutter/material.dart';
import 'dart:core';
import 'package:flutter_webrtc/webrtc.dart';
import 'package:app_samples/p2p/p2p_video_call.dart';
import 'package:app_samples/config/server_url.dart';
import 'package:app_samples/p2p/p2p_state.dart';
import 'package:app_samples/utils/utils.dart';
/**
 * 一对一视频通话示例
 */
class P2PClient extends StatefulWidget {
  static String tag = '一对一视频通话';

  String _userName = "";
  String _roomId = "111111";

  P2PClient(this._userName,this._roomId);

  @override
  _P2PClientState createState() => _P2PClientState();
}

class _P2PClientState extends State<P2PClient> {
  //信令
  P2PVideoCall _p2pVideoCall;
  //所有成员
  List<dynamic> _users = [];
  //自己Id
  var _userId = randomNumeric(6);
  //本地视频渲染对象
  RTCVideoRenderer _localRenderer = RTCVideoRenderer();
  //远端视频渲染对象
  RTCVideoRenderer _remoteRenderer = RTCVideoRenderer();
  //是否呼叫
  bool _inCalling = false;
  //是否麦克风禁音
  bool _microphoneOff = false;

  @override
  initState() {
    super.initState();
    //初始化视频渲染对象
    initRenderers();
    //开始连接
    _connect();
  }

  //初始化视频渲染对象
  initRenderers() async {
    await _localRenderer.initialize();
    await _remoteRenderer.initialize();
  }

  @override
  deactivate() {
    super.deactivate();
    //关闭信令
    if (_p2pVideoCall != null){
      _p2pVideoCall.close();
    }
    //销毁本地视频
    _localRenderer.dispose();
    //销毁远端视频
    _remoteRenderer.dispose();
  }

  //连接
  void _connect() async {
    if (_p2pVideoCall == null) {
      //实例化信令并执行连接
      _p2pVideoCall = P2PVideoCall(ServerUrl.IP,ServerUrl.P2P_PORT,ServerUrl.TURN_PORT,_userId,widget._userName,widget._roomId)..connect();
      //信令状态处理
      _p2pVideoCall.onStateChange = (P2PState state) {
        switch (state) {
          //呼叫状态
          case P2PState.CallStateJoinRoom:
            this.setState(() {
              _inCalling = true;
            });
            break;
          //挂断状态
          case P2PState.CallStateHangUp:
            this.setState(() {
              _localRenderer.srcObject = null;
              _remoteRenderer.srcObject = null;
              _inCalling = false;
            });
            break;
          case P2PState.ConnectionClosed:
          case P2PState.ConnectionError:
          case P2PState.ConnectionOpen:
            break;
        }
      };

      //成员更新处理
      _p2pVideoCall.onUsersUpdate = ((event) {
        this.setState(() {
          //设置所有成员
          _users = event['users'];
        });
      });

      //本地流到达回调
      _p2pVideoCall.onLocalStream = ((stream) {
        //将本地视频渲染对象源指定为stream
        _localRenderer.srcObject = stream;
      });

      //远端流到达回调
      _p2pVideoCall.onAddRemoteStream = ((stream) {
        //将远端视频渲染对象源指定为stream
        _remoteRenderer.srcObject = stream;
      });

      //远端流移除回调
      _p2pVideoCall.onRemoveRemoteStream = ((stream) {
        //将远端视频渲染对象源置为空
        _remoteRenderer.srcObject = null;
      });
    }
  }

  //发起呼叫
  _startCall(context, userId, use_screen) async {
    //判断是对放的userId才发起呼叫
    if (_p2pVideoCall != null && userId != _userId) {
      //发起呼叫,传入对方Id,媒体类型,是否为屏幕共享
      _p2pVideoCall.startCall(userId, 'video', use_screen);
    }
  }

  //挂断处理
  _hangUp() {
    if (_p2pVideoCall != null) {
      _p2pVideoCall.hangUp();
    }
  }

  //切换摄像头
  _switchCamera() {
    _p2pVideoCall.switchCamera();
  }

  //麦克风静音
  _muteMic() {
    var muted = !_microphoneOff;
      setState(() {
        _microphoneOff = muted;
      });
    _p2pVideoCall.muteMicrophone(!muted);
  }

  _buildUserItem(context, user) {
    return ListBody(children: <Widget>[
      ListTile(
        title: Text(user['name']),
        subtitle: Text('id:' + user['id']),
        onTap: null,
        trailing: SizedBox(
            width: 100.0,
            child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: <Widget>[
                  IconButton(
                    icon: Icon(Icons.videocam),
                    onPressed: () => _startCall(context, user['id'], false),
                    tooltip: '视频通话',
                  ),
                  IconButton(
                    icon: Icon(Icons.screen_share),
                    onPressed: () => _startCall(context, user['id'], true),
                    tooltip: '屏幕共享',
                  )
                ])),
      ),
      Divider()
    ]);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('一对一视频通话'),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: _inCalling
          ? SizedBox(
              width: 200.0,
              child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: <Widget>[
                    //切换摄像头按钮
                    FloatingActionButton(
                      child: Icon(Icons.switch_camera),
                      onPressed: _switchCamera,
                    ),
                    //挂断按钮
                    FloatingActionButton(
                      onPressed: _hangUp,
                      child: Icon(Icons.call_end),
                      backgroundColor: Colors.pink,
                    ),
                    //麦克风禁音按钮
                    FloatingActionButton(
                      child: this._microphoneOff ? Icon(Icons.mic_off) : Icon(Icons.mic),
                      onPressed: _muteMic,
                    )
                  ]))
          : null,
      body: _inCalling
          //旋转控制组件
          ? OrientationBuilder(builder: (context, orientation) {
              return Container(
                child: Stack(children: <Widget>[
                  //远端视频定位
                  Positioned(
                      left: 0.0,
                      right: 0.0,
                      top: 0.0,
                      bottom: 0.0,
                      //远端视频容器,大小为大视频
                      child: Container(
                        margin: EdgeInsets.fromLTRB(0.0, 0.0, 0.0, 0.0),
                        //整个容器宽
                        width: MediaQuery.of(context).size.width,
                        //整个容器高
                        height: MediaQuery.of(context).size.height,
                        //远端视频渲染
                        child: RTCVideoView(_remoteRenderer),
                        decoration: BoxDecoration(color: Colors.black54),
                      )),
                  //本地视频定位
                  Positioned(
                    left: 20.0,
                    top: 20.0,
                    //本地视频容器,大小为小视频
                    child: Container(
                      //固定宽度,竖屏时为90,横屏时为120
                      width: orientation == Orientation.portrait ? 90.0 : 120.0,
                      //固定高度,竖屏时为120,横屏时为90
                      height: orientation == Orientation.portrait ? 120.0 : 90.0,
                      //本地视频渲染
                      child: RTCVideoView(_localRenderer),
                      decoration: BoxDecoration(color: Colors.black54),
                    ),
                  ),
                ]),
              );
            })
          : ListView.builder(
              shrinkWrap: true,
              padding: EdgeInsets.all(0.0),
              itemCount: _users.length,
              itemBuilder: (context, i) {
                return _buildUserItem(context, _users[i]);
              }),
    );
  }
}
