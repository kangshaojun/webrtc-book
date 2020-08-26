import 'dart:math';
//产生随机数
String randomNumeric(int length) {
  String start = '123456789';
  String center = '0123456789';
  String result = '';
  for (int i = 0; i < length; i++) {
    if (i == 1) {
      result = start[Random().nextInt(start.length)];
    } else {
      result = result + center[Random().nextInt(center.length)];
    }
  }
  return result;
}

