import 'package:flutter/material.dart';
import 'package:flutter_webrtc/webrtc.dart';
import 'dart:core';

/**
 * 屏幕共享示例
 */
class GetDisplayMediaSample extends StatefulWidget {
  static String tag = '屏幕共享示例';

  @override
  _GetDisplayMediaSampleState createState() => _GetDisplayMediaSampleState();
}

class _GetDisplayMediaSampleState extends State<GetDisplayMediaSample> {
  //本地媒体流
  MediaStream _localStream;
  //本地视频渲染对象
  final _localRenderer = RTCVideoRenderer();
  //是否打开
  bool _isOpen = false;

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
      "audio": false,
      "video": true
    };

    try {
      //根据约束条件获取媒体流
      navigator.getDisplayMedia(mediaConstraints).then((stream){
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      //标题
      appBar: AppBar(
        title: Text('屏幕共享示例'),
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
      //右下角按钮
      floatingActionButton: FloatingActionButton(
        //打开或关闭处理
        onPressed: _isOpen ? _close : _open,
        //按钮图标
        child: Icon(_isOpen ? Icons.close : Icons.add),
      ),
    );
  }
}
