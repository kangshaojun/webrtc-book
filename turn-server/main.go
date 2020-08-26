package main

import (
	"os"
	"turn-server/pkg/logger"
	"turn-server/pkg/server"
	"turn-server/pkg/turn"
	"gopkg.in/ini.v1"
)

func main() {
	//加载配置文件
	cfg, err := ini.Load("configs/config.ini")
	if err != nil {
		logger.Errorf("Fail to read file: %v", err)
		os.Exit(1)
	}

	//读取IP
	publicIP := cfg.Section("turn").Key("public_ip").String()
	//读取端口
	stunPort, err := cfg.Section("turn").Key("port").Int()
	if err != nil {
		stunPort = 3478
	}
	//读取realm
	realm := cfg.Section("turn").Key("realm").String()

	turnConfig := turn.DefaultConfig()
	turnConfig.PublicIP = publicIP
	turnConfig.Port = stunPort
	turnConfig.Realm = realm
	turn := turn.NewTurnServer(turnConfig)

	httpServer := server.NewHttpsServer(turn)

	sslCert := cfg.Section("general").Key("cert").String()
	sslKey := cfg.Section("general").Key("key").String()
	bindAddress := cfg.Section("general").Key("bind").String()

	port, err := cfg.Section("general").Key("port").Int()
	if err != nil {
		port = 9000
	}

	config := server.DefaultConfig()
	config.Host = bindAddress
	config.Port = port
	config.CertFile = sslCert
	config.KeyFile = sslKey

	httpServer.Bind(config)
}
