import 'package:flutter/material.dart';
import 'package:app_samples/p2p/p2p_client.dart';
//一对一视频通话登录页面
class P2PLogin extends StatefulWidget {
  @override
  _P2PLoginState createState() => _P2PLoginState();
}

class _P2PLoginState extends State<P2PLogin> {
  String _userName;//用户名
  String _roomId;//房间号

  //点击登录
  handleJoin(){
    //跳转至P2PClient
    Navigator.push(
      context,
      MaterialPageRoute(
          builder: (BuildContext context) => P2PClient(this._userName,this._roomId)),
    );
  }

  @override
  Widget build(BuildContext context) {
    //页面脚手架
    return Scaffold(
      appBar: AppBar(
        //标题
        title: Text('一对一视频通话案例'),
      ),
      body: Center(
        //垂直布局
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              SizedBox(
                  width: 260.0,
                  child: TextField(
                    //键盘类型为文本
                    keyboardType: TextInputType.text,
                    textAlign: TextAlign.center,
                    decoration: InputDecoration(
                      contentPadding: EdgeInsets.all(10.0),
                      hintText: '请输入用户名',
                    ),
                    onChanged: (value) {
                      setState(() {
                        _userName = value;
                      });
                    },
                  )),
              SizedBox(
                width: 260.0,
                child: TextField(
                  //键盘类型为数字
                  keyboardType: TextInputType.phone,
                  textAlign: TextAlign.center,
                  decoration: InputDecoration(
                    contentPadding: EdgeInsets.all(10.0),
                    hintText: '请输入房间号',
                  ),
                  onChanged: (value) {
                    setState(() {
                      _roomId = value;
                    });
                  },
                ),
              ),
              SizedBox(
                width: 260.0,
                height: 48.0,
              ),
              SizedBox(
                width: 260.0,
                height: 48.0,
                //登录按钮
                child: RaisedButton(
                  child: Text(
                    '登录',
                  ),
                  onPressed: () {
                    if (_roomId != null) {
                      handleJoin();
                      return;
                    }
                  },
                ),
              ),
            ]),
      ),
    );
  }
}
