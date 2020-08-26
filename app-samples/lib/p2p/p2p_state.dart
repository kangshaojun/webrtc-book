//状态
enum P2PState {
  //加入房间
  CallStateJoinRoom,
  //挂断
  CallStateHangUp,
  //连接打开
  ConnectionOpen,
  //连接关闭
  ConnectionClosed,
  //连接错误
  ConnectionError,
}