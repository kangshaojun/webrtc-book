package util

import (
	"os"
	"time"
	"github.com/rs/zerolog"
)
//创建日志变量
var log zerolog.Logger
//定义日志等级
type Level uint8

const (
	//调试信息,iota为常量记数器初始为0
	DebugLevel Level = iota
	//正常输出信息
	InfoLevel
	//警告信息
	WarnLevel
	//错误信息
	ErrorLevel
	//严重错误信息
	FatalLevel
	//程序异常
	PanicLevel
	//没有等级
	NoLevel
	//禁用
	Disabled
)

//初始化
func init() {
	//初始设置为调试信息
	zerolog.SetGlobalLevel(zerolog.DebugLevel)
	//创建控制台输出对象,指定时间格式
	output := zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339}
	//实例化日志对象
	log = zerolog.New(output).With().Timestamp().Logger()
	//设置调试等级
	SetLevel(DebugLevel)
}

//根据传入的值设置等级
func SetLevel(l Level) {
	zerolog.SetGlobalLevel(zerolog.Level(l))
}

//正常输出日志信息
func Infof(format string, v ...interface{}) {
	log.Info().Msgf(format, v...)
}

//输出调试日志信息
func Debugf(format string, v ...interface{}) {
	log.Debug().Msgf(format, v...)
}

//输出警告日志信息
func Warnf(format string, v ...interface{}) {
	log.Warn().Msgf(format, v...)
}

//输出错误日志信息
func Errorf(format string, v ...interface{}) {
	log.Error().Msgf(format, v...)
}

//输出异常日志信息
func Panicf(format string, v ...interface{}) {
	log.Panic().Msgf(format, v...)
}
