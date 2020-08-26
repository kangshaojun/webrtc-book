import 'package:app_samples/p2p/p2p_turn.dart';

//Turn服务器返回数据
var _turnCredential;

class P2PIceServers{

  //主机地址
  String _host;
  //端口
  int _turnPort;

  //ICE服务器信息
  Map<String, dynamic> IceServers = {
    'iceServers': [
      {'url': 'stun:stun.l.google.com:19302'},
      /*
      {
        'url': 'turn:123.45.67.89:3478',
        'username': 'change_to_real_user',
        'credential': 'change_to_real_secret'
      },
       */
    ]
  };

  //构造函数
  P2PIceServers(String host,int turnPort){
    this._host = host;
    this._turnPort = turnPort;
  }

  //初始化
  init(){
    this._requestIceServers(this._host,this._turnPort);
  }

  //发起请求
  Future _requestIceServers(String host,int turnPort) async{
    if (_turnCredential == null) {
      try {
        //请求TurnServer服务器
        _turnCredential = await getTurnCredential(host, turnPort);
        IceServers = {
          'iceServers': [
            {
              'url': _turnCredential['uris'][0],
              'username': _turnCredential['username'],
              'credential': _turnCredential['password']
            },
          ]
        };
      } catch (e) {}
    }
    return IceServers;
  }

}