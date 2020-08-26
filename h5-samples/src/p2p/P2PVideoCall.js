import * as events from 'events';
import Axios from 'axios';
//PeerConnection连接
var RTCPeerConnection;
//会话描述
var RTCSessionDescription;
//连接配置
var configuration;
/**
 * 信令类
 */
export default class P2PVideoCall extends events.EventEmitter {
    //构造函数
    constructor(p2pUrl,turnUrl,name,roomId) {
        super();
        //Socket
        this.socket = null;
        //所有PeerConnection
        this.peerConnections = {};
        //会话Id
        this.sessionId = '000-111';
        //自己Id
        this.userId = 0;
        //用户名
        this.name = name;
        //房间号
        this.roomId = roomId;
        //信令服务器url
        this.p2pUrl = p2pUrl;
        //中转服务器url
        this.turnUrl = turnUrl;
        //本地媒体流
        this.localStream;
       
        //RTCPeerConnection兼容性处理
        RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.msRTCPeerConnection;
        //RTCSessionDescription兼容性处理
        RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription || window.msRTCSessionDescription;
        //getUserMedia兼容性处理
        navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia;

        //ICE配置
        configuration = { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] };

        //访问Turn中转服务器
        Axios.get(this.turnUrl, {}).then(res => {
            if(res.status === 200){
                let _turnCredential = res.data;
                configuration = { "iceServers": [
                    { 
                        "url":  _turnCredential['uris'][0],
                        'username': _turnCredential['username'],
                        'credential': _turnCredential['password']
                    }
                ]};
                console.log("configuration:" + JSON.stringify(configuration));
            }
        }).catch((error)=>{
            console.log('网络错误:请求不到TurnServer服务器');
        });
    
        //初始化WebSocket
        this.socket = new WebSocket(this.p2pUrl);
        //连接打开
        this.socket.onopen = () => {
            console.log("WebSocket连接成功...");
            //获取随机数作为Id
            this.userId = this.getRandomUserId();
            //定义消息
            let message = {
                //加入房间
                'type':'joinRoom',
                //数据
                'data':{
                    //用户名
                    name: this.name,
                    //用户Id
                    id: this.userId,
                    //房间Id
                    roomId:this.roomId,
                }
            }
            //发送消息
            this.send(message);
        };

        //Socket消息处理
        this.socket.onmessage = (e) => {
            //解析JSON消息
            var parsedMessage = JSON.parse(e.data);
            console.info('收到的消息: {\n type = ' + parsedMessage.type + ', \n data = ' + JSON.stringify(parsedMessage.data) + '\n}');
            //判断条件为消息类型
            switch (parsedMessage.type) {
                case 'offer':
                    this.onOffer(parsedMessage);
                    break;
                case 'answer':
                    this.onAnswer(parsedMessage);
                    break;
                case 'candidate':
                    this.onCandidate(parsedMessage);
                    break;
                case 'updateUserList':
                    this.onUpdateUserList(parsedMessage);
                    break;
                case 'leaveRoom':
                    this.onLeave(parsedMessage);
                    break;
                case 'hangUp':
                    this.onHangUp(parsedMessage);
                    break;
                case 'heartPackage':
                    console.log('服务端发心跳包!');
                    break;
                default:
                    console.error('未知消息', parsedMessage);
            }
        };
        //Socket连接错误
        this.socket.onerror = (e) => {
            console.log('onerror::' + e.data);
        }
        //Socket连接关闭
        this.socket.onclose = (e) => {
            console.log('onclose::' + e.data);
        }
    }

    //获取本地媒体流
    getLocalStream = (type) => {
        return new Promise((pResolve, pReject) => {
            //设置约束条件
            var constraints = { audio: true, video: (type === 'video') ? { width: 1280, height: 720 } : false };
            //屏幕类型
            if (type == 'screen') {
                //调用getDisplayMedia接口获取桌面流
                navigator.mediaDevices.getDisplayMedia({ video: true }).then((mediaStream) => {
                    pResolve(mediaStream);
                }).catch((err) => {
                    console.log(err.name + ": " + err.message);
                    pReject(err);
                }
                );
            }else{
                //调用getUserMedia接口获取音视频流
                navigator.mediaDevices.getUserMedia(constraints).then((mediaStream) =>{
                    pResolve(mediaStream);
                }).catch((err) => {
                    console.log(err.name + ": " + err.message);
                    pReject(err);
                }
                );
            }
        });
    }

    //获取6位随机id
    getRandomUserId() {
        var num = "";
        for (var i = 0; i < 6; i++) {
            num += Math.floor(Math.random() * 10);
        }
        return num;
    }

    //发送消息,将消息转成JSON串后发送
    send = (data) => {
        this.socket.send(JSON.stringify(data));
    }

    /**
     * 发起会话
     * remoteUserId为被呼叫的Id
     * media为会话类型 音频|视频|共享桌面
     */
    startCall = (remoteUserId, media) => {
        //本地Id+远端Id组成
        this.sessionId = this.userId + '-' + remoteUserId;
        //获取本地媒体流
        this.getLocalStream(media).then((stream) => {
            //取得到本地媒体流
            this.localStream = stream;
            //提议方创建连接PeerConnection
            this.createPeerConnection(remoteUserId, media, true, stream);
            //派发本地流事件
            this.emit('localstream', stream);
            //派发新的呼叫事件
            this.emit('newCall', this.userId, this.sessionId);
        });
    }

    //挂断处理
    hangUp = () => {
        //定义消息
        let message = {
            //消息类型
            type: 'hangUp',
            //数据
            data:{
                //当前会话Id
                sessionId: this.sessionId,
                //消息发送者
                from: this.userId,
                //房间Id
                roomId:this.roomId,
            }
        }
        //发送消息
        this.send(message);
    }

    /**
     * 创建提议Offer
     * pc:PeerConnection对象
     * id:对方Id
     * media:媒体类型
     */
    createOffer = (pc, id, media) => {
        //创建提议
        pc.createOffer((desc) => {
            console.log('createOffer: ', desc.sdp);
            //设置本地描述
            pc.setLocalDescription(desc, () => {
                console.log('setLocalDescription', pc.localDescription);
                //消息
                let message = {
                    //消息类型为offer
                    type: 'offer',
                    //数据
                    data:{
                        //对方Id
                        to: id,
                        //本地Id
                        from:this.userId,
                        //SDP信息
                        description: {'sdp':desc.sdp,'type':desc.type},
                        //会话Id
                        sessionId: this.sessionId,
                        //媒体类型
                        media: media,
                        //房间Id
                        roomId:this.roomId,
                    }
                }
                //发送消息
                this.send(message);
            }, this.logError);
        }, this.logError);
    }

    /**
     * 创建PeerConnection
     * id:对方Id
     * media:媒体类型
     * isOffer:true是提议方|false是应答方
     * localstream:本地媒体流
     */
    createPeerConnection = (id, media, isOffer, localstream) => {
        console.log("创建PeerConnection...");
        //创建连接对象
        var pc = new RTCPeerConnection(configuration);
        //将PC对象放入集合里
        this.peerConnections["" + id] = pc;
        //收集到Candidate数据
        pc.onicecandidate = (event) => {
            console.log('onicecandidate', event);
            if (event.candidate) {
                //消息
                let message = {
                    //Candidate消息类型
                    type: 'candidate',
                    //数据
                    data:{
                        //对方Id
                        to: id,
                        //自己Id
                        from:this.userId,
                        //Candidate数据
                        candidate: {
                            'sdpMLineIndex': event.candidate.sdpMLineIndex,
                            'sdpMid': event.candidate.sdpMid,
                            'candidate': event.candidate.candidate,
                        },
                        //会话Id
                        sessionId: this.sessionId,
                        //房间Id
                        roomId:this.roomId,
                    }
                }
                //发送消息
                this.send(message);
            }
        };

        pc.onnegotiationneeded = () => {
            console.log('onnegotiationneeded');
        }

        pc.oniceconnectionstatechange = (event) => {
            console.log('oniceconnectionstatechange', event);
        };
        pc.onsignalingstatechange = (event) => {
            console.log('onsignalingstatechange', event);
        };
        //远端流到达
        pc.onaddstream = (event) => {
            console.log('onaddstream', event);
            //通知应用层处理流
            this.emit('addstream', event.stream);
        };
        //远端流移除
        pc.onremovestream = (event) => {
            console.log('onremovestream', event);
            //通知应用层移除流
            this.emit('removestream', event.stream);
        };

        //添加本地流至PC里
        pc.addStream(localstream);
        //如果是提议方创建Offer
        if (isOffer){
            this.createOffer(pc, id, media);
        } 
        return pc;
    }

    //更新用户列表
    onUpdateUserList = (message) => {
        var data = message.data;
        console.log("users = " + JSON.stringify(data));
        //通知应用层渲染成员列表
        this.emit('updateUserList', data, this.userId);
    }

    //提议方发过来的Offer处理
    onOffer = (message) => {
        //获取数据
        var data = message.data;
        //读取发送方Id
        var from = data.from;
        console.log("data:" + data);
        //响应这一端默认用视频
        var media = 'video';//data.media;
        //读取会话Id
        this.sessionId = data.sessionId;
        //通知应用层新的呼叫
        this.emit('newCall', from, this.sessionId);

        //应答方获取本地媒体流
        this.getLocalStream(media).then((stream) => {
            //获取到本地媒体流
            this.localStream = stream;
            //通知应用层本地媒体流
            this.emit('localstream', stream);
            //应答方创建连接PeerConnection
            var pc = this.createPeerConnection(from, media, false, stream);

            if (pc && data.description) {
                //应答方法设置远端会话描述SDP
                pc.setRemoteDescription(new RTCSessionDescription(data.description), () => {
                    if (pc.remoteDescription.type == "offer"){
                        //生成应答信息
                        pc.createAnswer((desc) => {
                            console.log('createAnswer: ', desc);
                            //应答方法设置本地会话描述SDP
                            pc.setLocalDescription(desc, () => {
                                console.log('setLocalDescription', pc.localDescription);
                                //消息
                                let message = {
                                    //应答消息类型
                                    type: 'answer',
                                    //数据
                                    data:{
                                        //对方Id
                                        to: from,
                                        //自己Id
                                        from:this.userId,
                                        //SDP信息
                                        description: {'sdp':desc.sdp, 'type':desc.type},
                                        //会话Id
                                        sessionId: this.sessionId,
                                        //房间Id
                                        roomId:this.roomId,
                                    }
                                };
                                //发送消息
                                this.send(message);
                            }, this.logError);
                        }, this.logError);
                    }
                }, this.logError);
            }
        });
    }

    //应答方发过来的Answer处理
    onAnswer = (message) => {
        //提取数据
        var data = message.data;
        //对方Id
        var from = data.from;
        var pc = null;
        //迭代所有的PC对象
        if (from in this.peerConnections) {
            //根据Id找到提议方的PC对象
            pc = this.peerConnections[from];
        }
        if (pc && data.description) {
            //提议方设置远端描述信息SDP
            pc.setRemoteDescription(new RTCSessionDescription(data.description), () => {
            }, this.logError);
        }
    }

    //接收到对方发过来的Candidate信息
    onCandidate = (message) => {
        var data = message.data;
        var from = data.from;
        var pc = null;
        //根据对方Id找到PC对象
        if (from in this.peerConnections) {
            pc = this.peerConnections[from];
        }
        //添加Candidate到PC对象中
        if (pc && data.candidate) {
            pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    }

    onLeave = (message) => {
        var id = message.data;
        console.log('leave', id);
        var peerConnections = this.peerConnections;
        var pc = peerConnections[id];
        if (pc !== undefined) {
            pc.close();
            delete peerConnections[id];
            this.emit('leave', id);
        }
        if (this.localStream != null) {
            this.closeMediaStream(this.localStream);
            this.localStream = null;
        }
    }

    //挂断处理
    onHangUp = (message) => {
        var data = message.data;
        //sessionId是由自己和远端Id组成,使用下划线连接
        var ids = data.sessionId.split('_');
        var to = data.to;
        console.log('挂断:sessionId:', data.sessionId);
        //取到两个PC对象
        var peerConnections = this.peerConnections;
        var pc1 = peerConnections[ids[0]];
        var pc2 = peerConnections[ids[1]];
        //关闭pc1
        if (pc1 !== undefined) {
            console.log("关闭视频");
            pc1.close();
            delete peerConnections[ids[0]]; 
        }
        //关闭pc2
        if (pc2 !== undefined) {
            console.log("关闭视频");
            pc2.close();
            delete peerConnections[ids[1]]; 
        }
        //关闭媒体流
        if (this.localStream != null) {
            this.closeMediaStream(this.localStream);
            this.localStream = null;
        }
        //发送结束会话至上层应用
        this.emit('hangUp', to, this.sessionId);
        //将会话Id设置为初始值000-111
        this.sessionId = '000-111';
    }

    logError = (error) => {
        console.log("logError", error);
    }
    
    //关闭媒体流
    closeMediaStream = (stream) => {
        if (!stream)
            return;
        //获取所有的轨道
        let tracks = stream.getTracks();
        //循环迭代所有轨道并停止
        for (let i = 0, len = tracks.length; i < len; i++) {
            tracks[i].stop();
        }
    }
}