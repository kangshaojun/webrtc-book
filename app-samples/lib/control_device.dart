import 'package:flutter/material.dart';
import 'package:flutter_webrtc/webrtc.dart';
import 'dart:core';

/**
 * 控制设备示例
 */
class ControlDeviceSample extends StatefulWidget {
  static String tag = '控制设备示例';

  @override
  _ControlDeviceSampleState createState() => _ControlDeviceSampleState();
}

class _ControlDeviceSampleState extends State<ControlDeviceSample> {
  //本地媒体流
  MediaStream _localStream;
  //本地视频渲染对象
  final _localRenderer = RTCVideoRenderer();
  //是否打开
  bool _isOpen = false;
  //是否关闭摄像头
  bool _cameraOff = false;
  //是否关闭麦克风
  bool _microphoneOff = false;
  //是否打开扬声器
  bool _speakerOn = true;

  @override
  initState() {
    super.initState();
    //RTCVideoRenderer初始化
    initRenderers();
  }

  //在销毁dispose之前,会调用deactivate,可用于释放资源
  @override
  deactivate() {
    super.deactivate();
    //关闭处理
    if (_isOpen) {
      _close();
    }
    //释放资源并停止渲染
    _localRenderer.dispose();
  }

  initRenderers() async {
    //RTCVideoRenderer初始化
    await _localRenderer.initialize();
  }

  //打开设备,平台的消息是异步的,所以这里需要使用async
  _open() async {
    //约束条件
    final Map<String, dynamic> mediaConstraints = {
      "audio": true,
      "video": { "width": 1280, "height": 720 }
    };

    try {
      //根据约束条件获取媒体流
      navigator.getUserMedia(mediaConstraints).then((stream){
        //将获取到的流stream赋给_localStream
        _localStream = stream;
        //将本地视频渲染对象与_localStream绑定
        _localRenderer.srcObject = _localStream;
      });
    } catch (e) {
      print(e.toString());
    }

    //判断状态是否初始化完成
    if (!mounted) return;

    //设置当前状态为打开状态
    setState(() {
      _isOpen = true;
    });
  }

  //关闭设备
  _close() async {
    try {
      //释放本地流资源
      await _localStream.dispose();
      //将本地渲染对象源置为空
      _localRenderer.srcObject = null;
    } catch (e) {
      print(e.toString());
    }
    //设置当前状态为关闭状态
    setState(() {
      _isOpen = false;
    });
  }

  //切换前后置摄像头
  _switchCamera() {
    //判断本地流及视频轨道长度
    if (_localStream != null && _localStream.getVideoTracks().length > 0) {
      //调用视频轨道的切换摄像头方法
      _localStream.getVideoTracks()[0].switchCamera();
    } else {
      print("不能切换摄像头");
    }
  }

  //是否禁用摄像头
  _turnCamera() {
    //判断本地流及视频轨道长度
    if (_localStream != null && _localStream.getVideoTracks().length > 0) {
      var muted = !_cameraOff;
      setState(() {
        _cameraOff = muted;
      });
      //第一个视频轨道是否禁用
      _localStream.getVideoTracks()[0].enabled = !muted;
    } else {
      print("不能操作摄像头");
    }
  }

  //是否静音
  _turnMicrophone() {
    //判断本地流及音频轨道长度
    if (_localStream != null && _localStream.getAudioTracks().length > 0) {
      var muted = !_microphoneOff;
      setState(() {
        _microphoneOff = muted;
      });
      //第一个音频轨道是否禁用
      _localStream.getAudioTracks()[0].enabled = !muted;

      if (muted) {
        print("已静音");
      } else {
        print("取消静音");
      }
    } else {}
  }

  //切换扬声器或听筒
  _switchSpeaker() {
    this.setState(() {
      _speakerOn = !_speakerOn;
      //获取音频轨道
      MediaStreamTrack audioTrack = _localStream.getAudioTracks()[0];
      //调用音频轨道的设置是否启用扬声器方法
      audioTrack.enableSpeakerphone(_speakerOn);
      print("切换至:" + (_speakerOn ? "扬声器" : "听筒"));
    });
  }

  //重绘UI
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      //标题
      appBar: AppBar(
        title: Text('控制设备示例'),
      ),
      //根据手机旋转方向更新UI
      body: OrientationBuilder(
        builder: (context, orientation) {
          //居中
          return Center(
            child: Container(
              //设置外边距
              margin: EdgeInsets.fromLTRB(0.0, 0.0, 0.0, 0.0),
              //设置容器宽度为页面宽度
              width: MediaQuery.of(context).size.width,
              //设置容器高度为页面高度
              height: MediaQuery.of(context).size.height,
              //WebRTC视频渲染控件
              child: RTCVideoView(_localRenderer),
              //设置背景色
              decoration: BoxDecoration(color: Colors.black54),
            ),
          );
        },
      ),
      //底部导航按钮
      bottomNavigationBar: BottomAppBar(
        //水平布局
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: <Widget>[
            IconButton(
              icon: Icon(_cameraOff ? Icons.videocam_off : Icons.videocam),
              //是否禁用摄像头
              onPressed: (){
                this._turnCamera();
              },
            ),
            IconButton(
              icon: Icon(Icons.switch_camera),
              //切换摄像头
              onPressed: (){
                this._switchCamera();
              },
            ),
            IconButton(
              icon: Icon(_microphoneOff ? Icons.mic_off : Icons.mic),
              onPressed: (){
                //是否禁音
                this._turnMicrophone();
              },
            ),
            IconButton(
              icon: Icon(_speakerOn ? Icons.volume_up : Icons.volume_down),
              onPressed: (){
                //切换扬声器或听筒
                this._switchSpeaker();
              },
            ),
          ],
        ),
      ),
      //右下角按钮
      floatingActionButton: FloatingActionButton(
        //打开或关闭处理
        onPressed: _isOpen ? _close : _open,
        //按钮图标
        child: Icon(_isOpen ? Icons.close : Icons.add),
      ),
      //浮动按钮停靠方式
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }
}
