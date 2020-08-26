package server

import (
	"errors"
	"github.com/chuckpreslar/emission"
	"github.com/gorilla/websocket"
	"net"
	"p2p-server/pkg/util"
	"sync"
	"time"
)

//发送心跳包的间隔时间 5秒
const pingPeriod = 5 * time.Second

//定义WebSocket连接
type WebSocketConn struct {
	//事件派发器
	emission.Emitter
	//socket连接
	socket *websocket.Conn
	//互斥锁
	mutex  *sync.Mutex
	//是否关闭
	closed bool
}

//实例化WebSocket连接
func NewWebSocketConn(socket *websocket.Conn) *WebSocketConn {
	//定义连接变量
	var conn WebSocketConn
	//实例化事件触发器
	conn.Emitter = *emission.NewEmitter()
	//socket连接
	conn.socket = socket
	//实例化互斥锁
	conn.mutex = new(sync.Mutex)
	//打开状态
	conn.closed = false
	//socket连接关闭回调函数
	conn.socket.SetCloseHandler(func(code int, text string) error {
		//输出日志
		util.Warnf("%s [%d]", text, code)
		//派发关闭事件
		conn.Emit("close", code, text)
		//设置为关闭状态
		conn.closed = true
		return nil
	})
	//返回连接
	return &conn
}

//读取消息
func (conn *WebSocketConn) ReadMessage() {
	//创建一个读取消息的通道
	in := make(chan []byte)
	//创建一个通道关闭使用
	stop := make(chan struct{})
	//实例化一个Ping对象
	pingTicker := time.NewTicker(pingPeriod)

	//获取到socket对象
	var c = conn.socket
	go func() {
		for {
			//读取socket数据
			_, message, err := c.ReadMessage()
			//错误处理
			if err != nil {
				//输出日志
				util.Warnf("获取到错误: %v", err)
				//关闭错误
				if c, k := err.(*websocket.CloseError); k {
					//派发关闭事件
					conn.Emit("close", c.Code, c.Text)
				} else {
					//读写错误
					if c, k := err.(*net.OpError); k {
						//派发关闭事件
						conn.Emit("close", 1008, c.Error())
					}
				}
				//关闭通道
				close(stop)
				break
			}
			//将消息放入通道里
			in <- message
		}
	}()

	//循环接收通道数据
	for {
		select {
		case _ = <-pingTicker.C:
			util.Infof("发送心跳包...")
			//发送空包
			heartPackage := map[string]interface{}{
				//消息类型
				"type": "heartPackage",
				//空数据包
				"data": "",
			}
			//发送心跳包给当前发送消息的Peer
			if err := conn.Send(util.Marshal(heartPackage)); err != nil {
				util.Errorf("发送心跳包错误")
				//停止
				pingTicker.Stop()
				return
			}
		//使用通道接收数据
		case message := <-in:
			{
				util.Infof("接收到的数据: %s", message)
				//将接收到的数据派发出去,消息类型为message
				conn.Emit("message", []byte(message))
			}
		case <-stop:
			return
		}
	}
}

//发送消息
func (conn *WebSocketConn) Send(message string) error {
	util.Infof("发送数据: %s", message)
	//连接加锁
	conn.mutex.Lock()
	//延迟执行连接解锁
	defer conn.mutex.Unlock()
	//判断连接是否关闭
	if conn.closed {
		return errors.New("websocket: write closed")
	}
	//发送消息
	return conn.socket.WriteMessage(websocket.TextMessage, []byte(message))
}

//关闭WebSocket连接
func (conn *WebSocketConn) Close() {
	//连接加锁
	conn.mutex.Lock()
	//延迟执行连接解锁
	defer conn.mutex.Unlock()
	if conn.closed == false {
		util.Infof("关闭WebSocket连接 : ", conn)
		//关闭WebSocket连接
		conn.socket.Close()
		//设置关闭状态为true
		conn.closed = true
	} else {
		util.Warnf("连接已关闭 :", conn)
	}
}
