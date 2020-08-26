import 'dart:convert';
import 'dart:async';
import 'dart:io';
//请求TurnServer
Future<Map> getTurnCredential(String host, int port) async {
    //创建HttpClient对象
    HttpClient client = HttpClient(context: SecurityContext());
    client.badCertificateCallback = (X509Certificate cert, String host, int port) {
      print('getTurnCredential: 允许自签名证书 => $host:$port. ');
      return true;
    };
    //请求url
    var url = 'https://$host:$port/api/turn?service=turn&username=sample';
    print('url:' + url);
    //发起请求
    var request = await client.getUrl(Uri.parse(url));
    //关闭请求
    var response = await request.close();
    //获取返回的数据
    var responseBody = await response.transform(Utf8Decoder()).join();
    print('getTurnCredential:返回数据 => $responseBody.');
    //使用Json解码数据
    Map data = JsonDecoder().convert(responseBody);
    //返回数据
    return data;
  }
