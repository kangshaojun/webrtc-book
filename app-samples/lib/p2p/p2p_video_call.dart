import 'dart:convert';
import 'dart:async';
import 'package:flutter_webrtc/webrtc.dart';
import 'package:app_samples/p2p/p2p_state.dart';
import 'package:app_samples/p2p/p2p_constraints.dart';
import 'package:app_samples/p2p/p2p_ice_servers.dart';
import 'package:app_samples/p2p/p2p_socket.dart';

//定义信令状态回调函数
typedef void SignalingStateCallback(P2PState state);
//定义媒体流状态回调函数
typedef void StreamStateCallback(MediaStream stream);
//用户列表更新回调函数
typedef void UsersUpdateCallback(dynamic event);
/**
 * 信令类
 */
class P2PVideoCall {
  //Json编码
  JsonEncoder _encoder = JsonEncoder();
  //Json解码
  JsonDecoder _decoder = JsonDecoder();
  //自已Id
  String _userId = '';
  //用户名
  String _userName = 'FlutterApp';
  //房间Id
  String _roomId = '111111';
  //WebSocket对象
  P2PSocket _socket;
  //会话Id
  var _sessionId;
  //IP地址
  var _host;
  //信令服务器端口
  var _p2pPort = 8000;
  //Turn服务器端口
  var _turnPort = 9000;
  //PeerConnection集合
  var _peerConnections = Map<String, RTCPeerConnection>();
  //远端Candidate数组
  var _remoteCandidates = [];
  //获取ICE服务信息
  P2PIceServers _p2pIceServers;
  //本地媒体流
  MediaStream _localStream;
  //信令状态回调函数
  SignalingStateCallback onStateChange;
  //媒体流状态回调函数,本地流
  StreamStateCallback onLocalStream;
  //媒体流状态回调函数,远端流添加
  StreamStateCallback onAddRemoteStream;
  //媒体流状态回调函数,远端流移除
  StreamStateCallback onRemoveRemoteStream;
  //所有成员更新回调函数
  UsersUpdateCallback onUsersUpdate;

  //信令类构造函数
  P2PVideoCall(this._host,this._p2pPort,this._turnPort,this._userId,this._userName,this._roomId);

  //信令关闭
  close() {
    //销毁本地媒体流
    if (_localStream != null) {
      _localStream.dispose();
      _localStream = null;
    }
    //循环迭代所有的PeerConnection并关闭
    _peerConnections.forEach((key, pc) {
      pc.close();
    });
    //关闭Socket
    if (_socket != null) {
      _socket.close();
    }
  }

  //麦克风禁音
  void muteMicrophone(muted) {
    //判断本地流及音频轨道长度
    if (_localStream != null && _localStream.getAudioTracks().length > 0) {
      //第一个音频轨道是否禁用
      _localStream.getAudioTracks()[0].enabled = muted;
      if (muted) {
        print("已静音");
      } else {
        print("取消静音");
      }
    } else {}
  }

  //切换摄像头
  void switchCamera() {
    if (_localStream != null) {
      //获取视频轨道并切换摄像头
      _localStream.getVideoTracks()[0].switchCamera();
    }
  }

  //呼叫
  void startCall(String remoteUserId, String media, isScreen) {
    //会话Id = 自己Id + 下划线 + 对方Id
    this._sessionId = this._userId + '-' + remoteUserId;

    //设置信令状态
    if (this.onStateChange != null) {
      this.onStateChange(P2PState.CallStateJoinRoom);
    }

    //创建PeerConnection
    _createPeerConnection(remoteUserId, media, isScreen).then((pc) {
      //把PC对象放入集合里,注意Key使用的是对方Id
      _peerConnections[remoteUserId] = pc;
      //创建提议Offer
      _createOffer(remoteUserId, pc, media);
    });
  }

  //发送挂断消息
  void hangUp() {
    _send('hangUp', {
      'sessionId': this._sessionId,
      'from': this._userId,
      'roomId':_roomId,//房间Id
    });
  }

  //服务端发到前端的消息处理
  void onMessage(message) async {
    //取消息数据
    Map<String, dynamic> mapData = message;
    var data = mapData['data'];


    //使用消息类型作为判断条件
    switch (mapData['type']) {
      //成员列表
      case 'updateUserList':
        {
          //成员列表数据
          List<dynamic> users = data;
          if (this.onUsersUpdate != null) {
            //回调参数,包括自己Id及成员列表
            Map<String, dynamic> event = Map<String, dynamic>();
            event['users'] = users;
            //执行回调函数
            this.onUsersUpdate(event);
          }
        }
        break;
      //提议Offer消息
      case 'offer':
        {
          //提议方Id
          var id = data['from'];
          //SDP描述
          var description = data['description'];
          //请求媒体类型
          var media = data['media'];
          //会话Id
          var sessionId = data['sessionId'];
          this._sessionId = sessionId;
          //调用信令状态回调函数,状态为呼叫
          if (this.onStateChange != null) {
            this.onStateChange(P2PState.CallStateJoinRoom);
          }
          //应答方创建PeerConnection
          var pc = await _createPeerConnection(id, media, false);
          //将PC放入PeerConnection集合里
          _peerConnections[id] = pc;
          //应答方PC设置远端SDP描述
          await pc.setRemoteDescription(RTCSessionDescription(description['sdp'], description['type']));
          //应答方创建应答信息
          await _createAnswer(id, pc, media);
          if (this._remoteCandidates.length > 0) {
            //如果有Candidate缓存数据,将其添加至应答方PC对象里
            _remoteCandidates.forEach((candidate) async {
              await pc.addCandidate(candidate);
            });
            //添加完清空数组
            _remoteCandidates.clear();
          }
        }
        break;
      //应答Answer信息
      case 'answer':
        {
          //应答方Id
          var id = data['from'];
          //SDP描述
          var description = data['description'];
          //取出提议方PeerConnection
          var pc = _peerConnections[id];
          if (pc != null) {
            //提议方PC设置远端SDP描述
            await pc.setRemoteDescription(RTCSessionDescription(description['sdp'], description['type']));
          }
        }
        break;
      //网络Candidate信息
      case 'candidate':
        {
          //发送消息方Id
          var id = data['from'];
          //读取数据
          var candidateMap = data['candidate'];
          //根据Id获取PeerConnection
          var pc = _peerConnections[id];
          //生成Candidate对象
          RTCIceCandidate candidate = RTCIceCandidate(
              candidateMap['candidate'],
              candidateMap['sdpMid'],
              candidateMap['sdpMLineIndex']);
          if (pc != null) {
            //将对方发过来的Candidate添加至PC对象里
            await pc.addCandidate(candidate);
          } else {
            //当应答方PC还未建立时,将Candidate数据暂时缓存起来
            _remoteCandidates.add(candidate);
          }
        }
        break;
      //离开房间消息
      case 'leaveRoom':
        {
          print('离开:');
          var id = data;
          print('离开:' + id);
          this.leave(id);
        }
        break;
      //挂断消息
      case 'hangUp':
        {
          var id = data['to'];
          var sessionId = data['sessionId'];
          print('挂断:' + sessionId);
          this.leave(id);
        }
        break;
      case 'heartPackage':
        {
          print('服务端发心跳包!');
        }
        break;
      default:
        break;
    }
  }

  //挂断/离开
  void leave(String id) {
    //关闭并清空所有PC
    _peerConnections.forEach((key, peerConn) {
      peerConn.close();
    });
    _peerConnections.clear();

    //销毁本地媒体流
    if (_localStream != null) {
      _localStream.dispose();
      _localStream = null;
    }

    //将会话Id置为空
    this._sessionId = null;
    //设置当前状态为挂断状态
    if (this.onStateChange != null) {
      this.onStateChange(P2PState.CallStateHangUp);
    }
  }

  //WebSocket连接
  void connect() async {
    var url = 'https://$_host:$_p2pPort/ws';
    //使用Socket连接信令服务器
    _socket = P2PSocket(url);

    print('连接:$url');

    //获取ICE信息
    _p2pIceServers = P2PIceServers(this._host,this._turnPort);
    _p2pIceServers.init();

    //socket打开
    _socket.onOpen = () {
      print('onOpen');
      //连接打开状态
      this?.onStateChange(P2PState.ConnectionOpen);
      //发送新加入成员消息
      _send('joinRoom', {
        'name': _userName,//名称
        'id': _userId,//自己Id
        'roomId':_roomId,//房间Id
      });
    };

    //socket接收消息
    _socket.onMessage = (message) {
      print('接收数据: ' + message);
      //Json解码器
      JsonDecoder decoder = JsonDecoder();
      //处理消息
      this.onMessage(decoder.convert(message));
    };

    //socket连接关闭
    _socket.onClose = (int code, String reason) {
      print('服务端关闭Socket [$code => $reason]!');
      if (this.onStateChange != null) {
        //连接关闭状态
        this.onStateChange(P2PState.ConnectionClosed);
      }
    };

    //执行连接
    await _socket.connect();
  }

  //创建媒体流
  Future<MediaStream> createStream(media, user_screen) async {
    //获取本地音视频或屏幕流
    MediaStream stream = user_screen
        ? await navigator.getDisplayMedia(P2PConstraints.MEDIA_CONSTRAINTS)
        : await navigator.getUserMedia(P2PConstraints.MEDIA_CONSTRAINTS);
    //本地媒体流状态回调函数
    if (this.onLocalStream != null) {
      this.onLocalStream(stream);
    }
    //返回媒体流
    return stream;
  }

  //创建PeerConnection
  _createPeerConnection(id, media, isScreen) async {
    //创建并获取本地媒体流
    _localStream = await createStream(media, isScreen);
    //创建PC
    RTCPeerConnection pc = await createPeerConnection(_p2pIceServers.IceServers, P2PConstraints.PC_CONSTRAINTS);
    //添加本地流至PC
    pc.addStream(_localStream);
    //PC收集到Candidate数据
    pc.onIceCandidate = (candidate) {
      //发送至对方
      _send('candidate', {
        //对方Id
        'to': id,
        //自己Id
        'from': _userId,
        //Candidate数据
        'candidate': {
          'sdpMLineIndex': candidate.sdpMlineIndex,
          'sdpMid': candidate.sdpMid,
          'candidate': candidate.candidate,
        },
        //会话Id
        'sessionId': this._sessionId,
        'roomId':_roomId,//房间Id
      });
    };

    //Ice连接状态
    pc.onIceConnectionState = (state) {};

    //远端流到达
    pc.onAddStream = (stream) {
      if (this.onAddRemoteStream != null){
        this.onAddRemoteStream(stream);
      }
    };

    //远端流移除
    pc.onRemoveStream = (stream) {
      if (this.onRemoveRemoteStream != null){
        this.onRemoveRemoteStream(stream);
      }
    };

    //返回PC
    return pc;
  }

  //创建提议Offer
  _createOffer(String id, RTCPeerConnection pc, String media) async {
    try {
      //返回SDP信息
      RTCSessionDescription s = await pc.createOffer(P2PConstraints.SDP_CONSTRAINTS);
      //设置本地描述信息
      pc.setLocalDescription(s);
      //发送Offer至对方
      _send('offer', {
        //对方Id
        'to': id,
        //自己Id
        'from': _userId,
        //SDP数据
        'description': {'sdp': s.sdp, 'type': s.type},
        //会话Id
        'sessionId': this._sessionId,
        //媒体类型
        'media': media,
        'roomId':_roomId,//房间Id
      });
    } catch (e) {
      print(e.toString());
    }
  }

  //创建应答Answer
  _createAnswer(String id, RTCPeerConnection pc, media) async {
    try {
      //返回SDP信息
      RTCSessionDescription s = await pc.createAnswer(P2PConstraints.SDP_CONSTRAINTS);
      //设置本地描述信息
      pc.setLocalDescription(s);
      //发送Answer至对方
      _send('answer', {
        //对方Id
        'to': id,
        //自己Id
        'from': _userId,
        //SDP数据
        'description': {'sdp': s.sdp, 'type': s.type},
        //会话Id
        'sessionId': this._sessionId,
        //房间Id
        'roomId':_roomId,
      });
    } catch (e) {
      print(e.toString());
    }
  }

  //发送消息 传入类型及数据
  _send(type, data) {
    var request = Map();
    request["type"] = type;
    request["data"] = data;
    //Json转码后发送
    _socket.send(_encoder.convert(request));
  }
}
