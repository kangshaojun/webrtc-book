xcode升级后在ios模拟器上运行flutter项目报错
发布时间：2020-03-25 15:27:08有 1421 人浏览来源：码云网
具体错误信息为：

building for is simulator but the linked and embedded framework 'app.framework' was built for ios

大概的意思是app.framework这个包是用于ios设备而不是模拟器的。从来没有遇到这个错误，应该升级xcode升级有关系。



于是执行flutter clean重新编译运行，结果还是一样。



于是去google了一下，找到了解决方案：

1）删除ios/flutter/app.framework

2) 重新编译运行后解决问题  



重新编译后会生成新的app.framework，不必担心删掉会导致其他问题。