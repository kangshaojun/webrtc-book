import 'package:flutter/material.dart';
import 'package:flutter_webrtc/webrtc.dart';
import 'dart:core';

/**
 * 数据通道示例
 */
class DataChannelSample extends StatefulWidget {

  static String tag = '数据通道示例';

  @override
  _DataChannelSampleState createState() => _DataChannelSampleState();
}

class _DataChannelSampleState extends State<DataChannelSample> {
  //本地连接
  RTCPeerConnection _localConnection;
  //远端连接
  RTCPeerConnection _remoteConnection;
  RTCDataChannelInit _dataChannelDict = null;
  //发送通道
  RTCDataChannel _sendChannel;
  //接收通道
  RTCDataChannel _receiveChannel;
  //是否连接
  bool _isConnected = false;
  //接收到的消息
  String _message = '';


  Map<String, dynamic> configuration = {
    //使用google的服务器
    "iceServers": [
      {"url": "stun:stun.l.google.com:19302"},
    ]
  };

  //sdp约束
  final Map<String, dynamic> sdp_constraints = {
    "mandatory": {
      //不接收语音数据
      "OfferToReceiveAudio": false,
      //不接收视频数据
      "OfferToReceiveVideo": false,
    },
    "optional": [],
  };

  //PeerConnection约束
  final Map<String, dynamic> pc_constraints = {
    "mandatory": {},
    "optional": [
      //如果要与浏览器互通开启DtlsSrtpKeyAgreement
      {"DtlsSrtpKeyAgreement": true},
    ],
  };

  @override
  initState() {
    super.initState();
  }

  @override
  deactivate() {
    super.deactivate();
    //挂断
    if (_isConnected) {
      _close();
    }
  }

  _open() async {

    //如果本地与远端连接创建则返回
    if (_localConnection != null || _remoteConnection != null) return;

    try {
      //创建本地连接对象
      _localConnection = await createPeerConnection(configuration, pc_constraints);
      //添加本地Candidate事件监听
      _localConnection.onIceCandidate = _onLocalCandidate;
      //添加本地Ice连接状态事件监听
      _localConnection.onIceConnectionState = _onLocalIceConnectionState;

      //实例化DataChannel初始化对象
      _dataChannelDict = RTCDataChannelInit();
      //创建RTCDataChannel对象时设置的通道的唯一id
      _dataChannelDict.id = 1;
      //表示通过RTCDataChannel的信息的到达顺序需要和发送顺序一致
      _dataChannelDict.ordered = true;
      //最大重传时间
      _dataChannelDict.maxRetransmitTime = -1;
      //最大重传次数
      _dataChannelDict.maxRetransmits = -1;
      //传输协议
      _dataChannelDict.protocol = "sctp";
      //是否由用户代理或应用程序协商频道
      _dataChannelDict.negotiated = false;
      //创建发送通道
      _sendChannel = await _localConnection.createDataChannel('dataChannel', _dataChannelDict);


      //创建远端连接对象
      _remoteConnection = await createPeerConnection(configuration, pc_constraints);
      //添加远端Candidate事件监听
      _remoteConnection.onIceCandidate = _onRemoteCandidate;
      //添加远端Ice连接状态事件监听
      _remoteConnection.onIceConnectionState = _onRemoteIceConnectionState;
      //远端DataChannel回调事件
      _remoteConnection.onDataChannel = _onDataChannel;

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
      //关闭本地连接
      await _localConnection.close();
      //关闭远端连接
      await _remoteConnection.close();
      //将本地连接置为空
      _localConnection = null;
      //将远端连接置为空
      _remoteConnection = null;
    } catch (e) {
      print(e.toString());
    }
    //设置连接状态为false
    setState(() {
      _isConnected = false;
    });
  }

  //本地Ice连接状态
  _onLocalIceConnectionState(RTCIceConnectionState state) {
    print(state);
  }

  //远端Ice连接状态
  _onRemoteIceConnectionState(RTCIceConnectionState state) {
    print(state);
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

  //远端DataChannel回调事件
  _onDataChannel(RTCDataChannel dataChannel) {
    //接收回调事件赋值
    _receiveChannel = dataChannel;
    //监听数据通道消息
    _receiveChannel.onMessage = this._onReceiveMessageCallback;
    //监听数据通道状态改变
    _receiveChannel.onDataChannelState = this._onDataChannelStateCallback;

  }

  //接收消息回调方法
  _onReceiveMessageCallback(RTCDataChannelMessage message){
    print(message.text.toString());
    this.setState((){
      _message = message.text;
    });
  }

  //数据通道状态改变回调方法
  _onDataChannelStateCallback(RTCDataChannelState state){
    print(state.toString());
  }

  //发送消息
  _sendMessage(){
    //此处发送的是文本数据
    this._sendChannel.send(RTCDataChannelMessage('测试数据'));
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
          title: Text('数据通道示例'),
        ),
        //旋转组件,可用于判断旋转方向
        body: OrientationBuilder(
          //orientation为旋转方向
          builder: (context, orientation) {
            //居中
            return Center(
              //容器
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  Text(
                    '接收到的消息:' + _message,
                  ),
                  RaisedButton(
                    child: Text('点击发送文本'),
                    onPressed: (){
                      this._sendMessage();
                    },
                  ),
                ],
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
