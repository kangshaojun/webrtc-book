/**
 * 约束条件
 */
class P2PConstraints {

  //Media约束条件
  static const Map<String, dynamic> MEDIA_CONSTRAINTS = {
    //开启音频
    "audio": true,
    "video": {
      "mandatory": {
        //宽度
        "minWidth": '640',
        //高度
        "minHeight": '480',
        //帧率
        "minFrameRate": '30',
      },
      "facingMode": "user",
      "optional": [],
    }
  };

  //PeerConnection约束
  static const Map<String, dynamic> PC_CONSTRAINTS = {
    'mandatory': {},
    'optional': [
      //如果要与浏览器互通开启DtlsSrtpKeyAgreement
      {'DtlsSrtpKeyAgreement': true},
    ],
  };

  //SDP约束
  static const Map<String, dynamic> SDP_CONSTRAINTS = {
    'mandatory': {
      //是否接收语音数据
      'OfferToReceiveAudio': true,
      //是否接收视频数据
      'OfferToReceiveVideo': true,
    },
    'optional': [],
  };
}
