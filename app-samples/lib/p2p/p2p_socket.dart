import 'dart:io';
import 'dart:math';
import 'dart:convert';
import 'dart:async';

//定义消息回调函数
typedef void OnMessageCallback(dynamic msg);
//定义关闭回调函数
typedef void OnCloseCallback(int code, String reason);
//定义打开回调函数
typedef void OnOpenCallback();

//WebSocket封装
class P2PSocket {
  //连接url
  String _url;
  //Socket对象
  var _socket;
  //打开回调函数
  OnOpenCallback onOpen;
  //消息回调函数
  OnMessageCallback onMessage;
  //关闭回调函数
  OnCloseCallback onClose;
  //构造函数
  P2PSocket(this._url);

  //开始连接
  connect() async {
    try {
      print(_url);
      //自签名验证连接
      _socket = await _connectForSelfSignedCert(_url);
      //打开连接回调
      this?.onOpen();
      //监听Socket消息
      _socket.listen((data) {
        this?.onMessage(data);
      }, onDone: () {
        //连接关闭回调
        this?.onClose(_socket.closeCode, _socket.closeReason);
      });
    } catch (e) {
      //连接关闭回调
      this.onClose(500, e.toString());
    }
  }

  //发送数据
  send(data) {
    if (_socket != null) {
      _socket.add(data);
      print('发送: $data');
    }
  }

  //关闭socket
  close() {
    if (_socket != null)
      _socket.close();
  }

  Future<WebSocket> _connectForSelfSignedCert(url) async {
    try {
      //随机数
      Random r = Random();
      //生成key
      String key = base64.encode(List<int>.generate(8, (_) => r.nextInt(255)));
      HttpClient client = HttpClient(context: SecurityContext());
      //证书强行被信任
      client.badCertificateCallback = (X509Certificate cert, String host, int port) {
        print('P2PSocket: 允许自签名证书 => $host:$port. ');
        //返回true强行被信任
        return true;
      };

      //发起请求
      HttpClientRequest request = await client.getUrl(Uri.parse(url));
      //标识该HTTP请求是一个协议升级请求
      request.headers.add('Connection', 'Upgrade');
      //协议升级为WebSocket协议
      request.headers.add('Upgrade', 'websocket');
      //客户端支持WebSocket的版本
      request.headers.add('Sec-WebSocket-Version', '13');
      //客户端采用base64编码的24位随机字符序列
      request.headers.add('Sec-WebSocket-Key', key.toLowerCase());
      //关闭请求
      HttpClientResponse response = await request.close();

      //分离出Socket
      Socket socket = await response.detachSocket();
      //通过一个已升级的Socket创建WebSocket
      var webSocket = WebSocket.fromUpgradedSocket(
        socket,
        protocol: 'signaling',
        serverSide: false,
      );
      //返回webSocket
      return webSocket;
    } catch (e) {
      throw e;
    }
  }
}
