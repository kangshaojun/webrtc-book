package room

import (
	"net/http"
	"p2p-server/pkg/server"
	"p2p-server/pkg/util"
	"strings"
)

const (
	JoinRoom       = "joinRoom"         //加入房间
	Offer          = "offer"            //Offer消息
	Answer         = "answer"			//Answer消息
	Candidate      = "candidate"        //Candidate消息
	HangUp         = "hangUp"           //挂断
	LeaveRoom      = "leaveRoom"		//离开房间
	UpdateUserList = "updateUserList"   //更新房间用户列表
)

//定义房间
type RoomManager struct {
	rooms map[string]*Room
}

//实例化房间管理对象
func NewRoomManager() *RoomManager {
	var roomManager = &RoomManager{
		rooms: make(map[string]*Room),
	}
	return roomManager
}

//定义房间
type Room struct {
	//所有用户
	users map[string]User
	//所有会话
	sessions  map[string]Session
	ID string
}

//实例化房间对象
func NewRoom(id string) *Room {
	var room = &Room{
		users:    make(map[string]User),
		sessions: make(map[string]Session),
		ID: id,
	}
	return room
}

//获取房间
func (roomManager *RoomManager) getRoom(id string) *Room {
	return roomManager.rooms[id]
}

//创建房间
func (roomManager *RoomManager) createRoom(id string) *Room {
	roomManager.rooms[id] = NewRoom(id)
	return roomManager.rooms[id]
}

//删除房间
func (roomManager *RoomManager) deleteRoom(id string) {
	delete(roomManager.rooms, id)
}

//WebSocket消息处理
func (roomManager *RoomManager) HandleNewWebSocket(conn *server.WebSocketConn, request *http.Request) {
	util.Infof("On Open %v", request)
	//监听消息事件
	conn.On("message", func(message []byte) {
		//解析Json数据
		request, err := util.Unmarshal(string(message))
		//错误日志输出
		if err != nil {
			util.Errorf("解析Json数据Unmarshal错误 %v", err)
			return
		}
		//定义数据
		var data map[string]interface{} = nil
		//拿到具体数据
		tmp, found := request["data"]
		//如果没有找到数据输出日志
		if !found {
			util.Errorf("没有发现数据!")
			return
		}
		data = tmp.(map[string]interface{})

		roomId := data["roomId"].(string)
		util.Infof("房间Id: %v", roomId)

		//根据roomId获取房间
		room := roomManager.getRoom(roomId);
		//查询不到房间则创建一个房间
		if room == nil {
			room = roomManager.createRoom(roomId)
		}

		//判断消息类型
		switch request["type"] {
		case JoinRoom:
			onJoinRoom(conn,data,room, roomManager);
			break
		//提议Offer消息
		case Offer:
			//直接执行下一个case并转发消息
			fallthrough
		//应答Answer消息
		case Answer:
			//直接执行下一个case并转发消息
			fallthrough
		//网络信息Candidate
		case Candidate:
			onCandidate(conn,data,room, roomManager,request);
			break
		//挂断消息
		case HangUp:
			onHangUp(conn,data,room, roomManager,request)
			break
		default:
			{
				util.Warnf("未知的请求 %v", request)
			}
			break
		}
	})

	//连接关闭事件处理
	conn.On("close", func(code int, text string) {
		onClose(conn, roomManager)
	})
}

func onJoinRoom(conn *server.WebSocketConn, data map[string]interface{},room *Room, roomManager *RoomManager)  {
	//创建一个User
	user := User{
		//连接
		conn: conn,
		//User信息
		info: UserInfo{
			ID:    data["id"].(string),//ID值
			Name:  data["name"].(string),//名称
		},
	}
	//把User放入数组里
	room.users[user.info.ID] = user;
	//通知所有的User更新
	roomManager.notifyUsersUpdate(conn, room.users)
}

//offer/answer/candidate消息处理
func onCandidate(conn *server.WebSocketConn, data map[string]interface{},room *Room, roomManager *RoomManager,request map[string]interface{})  {
	//读取目标to属性值
	to := data["to"].(string)
	//查找User对象
	if user, ok := room.users[to]; !ok {
		util.Errorf("没有发现用户[" + to + "]")
		return
	} else {
		//发送信息给目标User
		user.conn.Send(util.Marshal(request))
	}
}

func onHangUp(conn *server.WebSocketConn, data map[string]interface{},room *Room, roomManager *RoomManager,request map[string]interface{})  {
	//拿到sessionId属性值,并转换成字符串
	sessionID := data["sessionId"].(string)
	//使用-分割字符串
	ids := strings.Split(sessionID, "-")

	//根据Id查找User
	if user, ok := room.users[ids[0]]; !ok {
		util.Warnf("用户 [" + ids[0] + "] 没有找到")
		return
	} else {
		//挂断消息
		hangUp := map[string]interface{}{
			//消息类型
			"type": HangUp,
			//数据
			"data": map[string]interface{}{
				//0表示自己 1表示对方
				"to":         ids[0],
				//会话Id
				"sessionId": sessionID,
			},
		}
		//发送信息给目标User,即自己[0]
		user.conn.Send(util.Marshal(hangUp))
	}

	//根据Id查找User
	if user, ok := room.users[ids[1]]; !ok {
		util.Warnf("用户 [" + ids[1] + "] 没有找到")
		return
	} else {
		//挂断消息
		hangUp := map[string]interface{}{
			//消息类型
			"type": HangUp,
			//数据
			"data": map[string]interface{}{
				//0表示自己  1表示对方
				"to":         ids[1],
				//会话Id
				"sessionId": sessionID,
			},
		}
		//发送信息给目标User,即对方[1]
		user.conn.Send(util.Marshal(hangUp))
	}
}

func onClose(conn *server.WebSocketConn, roomManager *RoomManager,)  {
	util.Infof("连接关闭 %v", conn)
	var userId string = "";
	var roomId string = "";

	//遍历所有的房间找到退出的用户
	for _, room := range roomManager.rooms {
		for _, user := range room.users {
			//判断是不是当前连接对象
			if user.conn == conn {
				userId = user.info.ID;
				roomId = room.ID;
				break
			}
		}
	}

	if roomId == "" {
		util.Errorf("没有查找到退出的房间及用户");
		return
	}

	util.Infof("退出的用户roomId %v userId %v",roomId,userId);

	//循环遍历所有的User
	for _, user := range roomManager.getRoom(roomId).users {
		//判断是不是当前连接对象
		if user.conn != conn {
			leave := map[string]interface{}{
				"type": LeaveRoom,
				"data": userId,
			}
			user.conn.Send(util.Marshal(leave));
		}
	}
	util.Infof("删除User", userId)
	//根据Id删除User
	delete(roomManager.getRoom(roomId).users, userId)

	//通知所有的User更新数据
	roomManager.notifyUsersUpdate(conn, roomManager.getRoom(roomId).users)
}

//通知所有的用户更新
func (roomManager *RoomManager) notifyUsersUpdate(conn *server.WebSocketConn, users map[string]User) {
	//更新信息
	infos := []UserInfo{}
	//迭代所有的User
	for _, userClient := range users {
		//添加至数组里
		infos = append(infos, userClient.info)
	}
	//创建发送消息数据结构
	request := make(map[string]interface{})
	//消息类型
	request["type"] = UpdateUserList
	//数据
	request["data"] = infos
	//迭代所有的User
	for _, user := range users {
		//将Json数据发送给每一个User
		user.conn.Send(util.Marshal(request))
	}
}