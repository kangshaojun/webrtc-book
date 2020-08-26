package util

import (
	"encoding/json"
)
//将数据map[string]interface{}编码成Json字符串
func Marshal(m map[string]interface{}) string {
	if byt, err := json.Marshal(m); err != nil {
		Errorf(err.Error())
		return ""
	} else {
		return string(byt)
	}
}
//将Json字符串解码到相应的数据结构map[string]interface{}
func Unmarshal(str string) (map[string]interface{}, error) {
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(str), &data); err != nil {
		Errorf(err.Error())
		return nil, err
	}
	return data, nil
}