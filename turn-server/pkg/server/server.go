package server

import (
	"net/http"
	"strconv"

	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net"
	"net/url"
	"time"
	"turn-server/pkg/logger"
	"turn-server/pkg/turn"
	"turn-server/pkg/util"
)

const (
	sharedKey = `flutter-webrtc-turn-server-shared-key`
)

type HttpsServerConfig struct {
	Host           string
	Port           int
	CertFile       string
	KeyFile        string
	TurnServerPath string
}

func DefaultConfig() HttpsServerConfig {
	return HttpsServerConfig{
		Host:           "0.0.0.0",
		Port:           8086,
		TurnServerPath: "/api/turn",
	}
}

type TurnCredentials struct {
	Username string   `json:"username"`
	Password string   `json:"password"`
	TTL      int      `json:"ttl"`
	Uris     []string `json:"uris"`
}

func Marshal(m map[string]interface{}) string {
	if byt, err := json.Marshal(m); err != nil {
		logger.Errorf(err.Error())
		return ""
	} else {
		return string(byt)
	}
}

func Unmarshal(str string) (map[string]interface{}, error) {
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(str), &data); err != nil {
		logger.Errorf(err.Error())
		return nil, err
	}
	return data, nil
}

type HttpsServer struct {
	turn      *turn.TurnServer
	expresMap *util.ExpiredMap
}

func NewHttpsServer(turn *turn.TurnServer) *HttpsServer {
	var server = &HttpsServer{
		turn:      turn,
		expresMap: util.NewExpiredMap(),
	}
	server.turn.AuthHandler = server.authHandler
	return server
}

// Bind .
func (server *HttpsServer) Bind(cfg HttpsServerConfig) {
	// Websocket handle fun
	http.HandleFunc(cfg.TurnServerPath, server.HandleTurnServerCredentials)
	logger.Infof("Golang Turn Server listening on: %s:%d", cfg.Host, cfg.Port)
	panic(http.ListenAndServeTLS(cfg.Host+":"+strconv.Itoa(cfg.Port), cfg.CertFile, cfg.KeyFile, nil))
}

func (s HttpsServer) authHandler(username string, realm string, srcAddr net.Addr) (string, bool) {
	// handle turn credential.
	if found, info := s.expresMap.Get(username); found {
		credential := info.(TurnCredentials)
		return credential.Password, true
	}
	return "", false
}

// HandleTurnServerCredentials .
// https://tools.ietf.org/html/draft-uberti-behave-turn-rest-00
func (s *HttpsServer) HandleTurnServerCredentials(writer http.ResponseWriter, request *http.Request) {
	writer.Header().Set("Content-Type", "application/json")
	writer.Header().Set("Access-Control-Allow-Origin", "*")

	//解析请求参数
	params, err := url.ParseQuery(request.URL.RawQuery)
	if err != nil {
	}
	logger.Debugf("%v", params)
	//获取service参数
	service := params["service"][0]
	if service != "turn" {
		return
	}
	//获取username参数
	username := params["username"][0]

	//当前时间戳
	timestamp := time.Now().Unix()
	//时间戳:用户名 1587944830:flutter-webrtc
	turnUsername := fmt.Sprintf("%d:%s", timestamp, username)
	fmt.Println("turnUsername:::",turnUsername);

	//hmac是密钥相关的哈希运算消息认证码
	hmac := hmac.New(sha1.New, []byte(sharedKey))
	//1587944058:flutter-webrtc 9V6nnqG+XYxtmngnzxIXeRCHQqk
	hmac.Write([]byte(turnUsername))
	fmt.Println("turnUsername:::",turnUsername);

	//生成密码
	turnPassword := base64.RawStdEncoding.EncodeToString(hmac.Sum(nil))
	fmt.Println("turnPassword:::",turnPassword);
	/*
		{
		     "username" : "12334939:mbzrxpgjys",
		     "password" : "adfsaflsjfldssia",
		     "ttl" : 86400,
		     "uris" : [
		       "turn:1.2.3.4:9991?transport=udp",
		       "turn:1.2.3.4:9992?transport=tcp",
		       "turns:1.2.3.4:443?transport=tcp"
			 ]
		}
		For client pc.
		var iceServer = {
			"username": response.username,
			"credential": response.password,
			"uris": response.uris
		};
		var config = {"iceServers": [iceServer]};
		var pc = new RTCPeerConnection(config);

	*/
	ttl := 86400
	host := fmt.Sprintf("%s:%d", s.turn.Config.PublicIP, s.turn.Config.Port)
	credential := TurnCredentials{
		Username: turnUsername,
		Password: turnPassword,
		TTL:      ttl,
		Uris: []string{
			"turn:" + host + "?transport=udp",
		},
	}
	s.expresMap.Set(turnUsername, credential, int64(ttl))
	//json编码并返回
	json.NewEncoder(writer).Encode(credential)
}
