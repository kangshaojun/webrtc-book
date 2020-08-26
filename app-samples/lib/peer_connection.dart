import 'package:flutter/material.dart';
import 'package:flutter_webrtc/webrtc.dart';
import 'dart:core';
import 'dart:async';

/**
 * 连接建立示例
 */
class PeerConnectionSample extends StatefulWidget {

  static String tag = '连接建立示例';

  @override
  _PeerConnectionSampleState createState() => _PeerConnectionSampleState();
}

class _PeerConnectionSampleState extends State<PeerConnectionSample> {
  //本地媒体流
  MediaStream _localStream;
  //远端媒体流
  MediaStream _remoteStream;
  //本地连接
  RTCPeerConnection _localConnection;
  //远端连接
  RTCPeerConnection _remoteConnection;
  //本地视频渲染对象
  final _localRenderer = RTCVideoRenderer();
  //远端视频渲染对象
  final _remoteRenderer = RTCVideoRenderer();
  //是否连接
  bool _isConnected = false;

  //媒体约束
  final Map<String, dynamic> mediaConstraints = {
    //开启音频
    "audio": true,
    "video": {
      "mandatory": {
        //宽度
        "minWidth": '640',
        //高度
        "minHeight": '480',
        //帧率
        "minFrameRate": '30',
      },
      "facingMode": "user",
      "optional": [],
    }
  };

  Map<String, dynamic> configuration = {
    //使用google的服务器
    "iceServers": [
      {"url": "stun:stun.l.google.com:19302"},
    ]
  };

  //sdp约束
  final Map<String, dynamic> sdp_constraints = {
    "mandatory": {
      //是否接收语音数据
      "OfferToReceiveAudio": true,
      //是否接收视频数据
      "OfferToReceiveVideo": true,
    },
    "optional": [],
  };

  //PeerConnection约束
  final Map<String, dynamic> pc_constraints = {
    "mandatory": {},
    "optional": [
      //如果要与浏览器互通开启DtlsSrtpKeyAgreement,此处不开启
      {"DtlsSrtpKeyAgreement": false},
    ],
  };

  @override
  initState() {
    super.initState();
    //初始化视频渲染对象
    initRenderers();
  }

  @override
  deactivate() {
    super.deactivate();
    //挂断
    if (_isConnected) {
      _close();
    }
    //销毁本地视频渲染对象
    _localRenderer.dispose();
    //销毁远端视频渲染对象
    _remoteRenderer.dispose();
  }

  //初始化视频渲染对象
  initRenderers() async {
    await _localRenderer.initialize();
    await _remoteRenderer.initialize();
  }

  //本地Ice连接状态
  _onLocalIceConnectionState(RTCIceConnectionState state) {
    print(state);
  }

  //远端Ice连接状态
  _onRemoteIceConnectionState(RTCIceConnectionState state) {
    print(state);
  }

  //远端流添加成功回调
  _onRemoteAddStream(MediaStream stream) {
    print('Remote addStream: ' + stream.id);
    //得到远端媒体流
    _remoteStream = stream;
    //将远端视频渲染对象与媒体流绑定
    _remoteRenderer.srcObject = stream;
  }

  //本地Candidate数据回调
  _onLocalCandidate(RTCIceCandidate candidate) {
    print('LocalCandidate: ' + candidate.candidate);
    //将本地Candidate添加至远端连接
    _remoteConnection.addCandidate(candidate);
  }

  //远端Candidate数据回调
  _onRemoteCandidate(RTCIceCandidate candidate) {
    print('RemoteCandidate: ' + candidate.candidate);
    //将远端Candidate添加至本地连接
    _localConnection.addCandidate(candidate);
  }

  _open() async {

    //如果本地与远端连接创建则返回
    if (_localConnection != null || _remoteConnection != null) return;

    try {
      //根据媒体约束获取本地媒体流
      _localStream = await navigator.getUserMedia(mediaConstraints);
      //将本地媒体流与本地视频对象绑定
      _localRenderer.srcObject = _localStream;

      //创建本地连接对象
      _localConnection = await createPeerConnection(configuration, pc_constraints);
      //添加本地Candidate事件监听
      _localConnection.onIceCandidate = _onLocalCandidate;
      //添加本地Ice连接状态事件监听
      _localConnection.onIceConnectionState = _onLocalIceConnectionState;


      //添加本地流至本地连接
      _localConnection.addStream(_localStream);
      //设置本地禁音状态为false
      _localStream.getAudioTracks()[0].setMicrophoneMute(false);


      //创建远端连接对象
      _remoteConnection = await createPeerConnection(configuration, pc_constraints);
      //添加远端Candidate事件监听
      _remoteConnection.onIceCandidate = _onRemoteCandidate;
      //监听获取到远端视频流事件
      _remoteConnection.onAddStream = _onRemoteAddStream;
      //添加远端Ice连接状态事件监听
      _remoteConnection.onIceConnectionState = _onRemoteIceConnectionState;

      //本地连接创建提议Offer
      RTCSessionDescription offer = await _localConnection.createOffer(sdp_constraints);
      print("offer:"+ offer.sdp);
      //本地连接设置本地sdp信息
      _localConnection.setLocalDescription(offer);
      //远端连接设置远端sdp信息
      _remoteConnection.setRemoteDescription(offer);


      //远端连接创建应答Answer
      RTCSessionDescription answer = await _remoteConnection.createAnswer(sdp_constraints);
      print("answer:"+ answer.sdp);
      //远端连接设置本地sdp信息
      _remoteConnection.setLocalDescription(answer);
      //本地连接设置远端sdp信息
      _localConnection.setRemoteDescription(answer);

    } catch (e) {
      print(e.toString());
    }
    if (!mounted) return;

    //设置为连接状态
    setState(() {
      _isConnected = true;
    });
  }

  //关闭处理
  _close() async {
    try {
      //销毁本地流
      await _localStream.dispose();
      //销毁远端流
      await _remoteStream.dispose();
      //关闭本地连接
      await _localConnection.close();
      //关闭远端连接
      await _remoteConnection.close();
      //将本地连接置为空
      _localConnection = null;
      //将远端连接置为空
      _remoteConnection = null;
      //将本地视频源置为空
      _localRenderer.srcObject = null;
      //将远端视频源置为空
      _remoteRenderer.srcObject = null;
    } catch (e) {
      print(e.toString());
    }
    //设置连接状态为false
    setState(() {
      _isConnected = false;
    });
  }

  //重写 build方法
  @override
  Widget build(BuildContext context) {
    return
      //页面脚手架
      Scaffold(
        //应用栏
        appBar: AppBar(
          //标题
          title: Text('连接建立示例'),
        ),
        //旋转组件,可用于判断旋转方向
        body: OrientationBuilder(
          //orientation为旋转方向
          builder: (context, orientation) {
            //居中
            return Center(
              //容器
              child: Container(
                decoration: BoxDecoration(color: Colors.white),
                child: Stack(
                  children: <Widget>[
                    Align(
                      //判断是否为垂直方向
                      alignment: orientation == Orientation.portrait
                          ? const FractionalOffset(0.5, 0.1)
                          : const FractionalOffset(0.0, 0.5),
                      child: Container(
                        margin: EdgeInsets.fromLTRB(0.0, 0.0, 0.0, 0.0),
                        width: 320.0,
                        height: 240.0,
                        //本地视频渲染
                        child: RTCVideoView(_localRenderer),
                        decoration: BoxDecoration(color: Colors.black54),
                      ),
                    ),
                    Align(
                      //判断是否为垂直方向
                      alignment: orientation == Orientation.portrait
                          ? const FractionalOffset(0.5, 0.9)
                          : const FractionalOffset(1.0, 0.5),
                      child: Container(
                        margin: EdgeInsets.fromLTRB(0.0, 0.0, 0.0, 0.0),
                        width: 320.0,
                        height: 240.0,
                        //远端视频渲染
                        child: RTCVideoView(_remoteRenderer),
                        decoration: BoxDecoration(color: Colors.black54),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
        //浮动按钮
        floatingActionButton: FloatingActionButton(
          onPressed: _isConnected ? _close : _open,
          child: Icon(_isConnected ? Icons.close : Icons.add),
        ),
      );

  }
}
