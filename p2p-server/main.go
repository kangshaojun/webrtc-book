package main

import (
	"os"
	"p2p-server/pkg/server"
	"p2p-server/pkg/util"
	"gopkg.in/ini.v1"
	"p2p-server/pkg/room"
)

//程序入口
func main() {
	//加载配置文件
	cfg, err := ini.Load("configs/config.ini")
	//加载出错,打印错误信息
	if err != nil {
		util.Errorf("读取文件失败: %v", err)
		os.Exit(1)
	}

	//实例化房间管理
	roomManager := room.NewRoomManager()
	//创建一个P2P服务
	wsServer := server.NewP2PServer(roomManager.HandleNewWebSocket)

	//读取证书Cert配置
	sslCert := cfg.Section("general").Key("cert").String()
	//读取证书Key配置
	sslKey := cfg.Section("general").Key("key").String()
	//读取IP地址配置
	bindAddress := cfg.Section("general").Key("bind").String()

	//读取监听端口
	port, err := cfg.Section("general").Key("port").Int()
	//读取失败设置默认端口
	if err != nil {
		port = 8000
	}
	//读取Html根路径配置
	htmlRoot := cfg.Section("general").Key("html_root").String()

	//实例化P2PServerConfig对象
	config := server.DefaultConfig()
	//主机地址
	config.Host = bindAddress
	//端口
	config.Port = port
	//Cert文件
	config.CertFile = sslCert
	//Key文件
	config.KeyFile = sslKey
	//Html根路径
	config.HTMLRoot = htmlRoot
	//绑定配置
	wsServer.Bind(config)
}
