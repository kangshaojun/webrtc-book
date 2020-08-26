import React, { Component } from 'react'
import PropTypes from "prop-types";
import VideocamOffIcon from "mdi-react/VideocamOffIcon";
/**
 * 本地视频组件
 */
export default class LocalVideoView extends Component {

    //组件加载完成
    componentDidMount = () => {
        //获取到视频对象
        let video = this.refs[this.props.id];
        //指定视频的源为stream
        video.srcObject = this.props.stream;
       //当获取到MetaData数据后开始播放
        video.onloadedmetadata = (e) => {
            video.play();
        };
    }

    render() {
        //本地小视频样式
        const small = {
            display:'flex',
            justifyContent: 'center',
            alignItems: 'center',
            //绝对定位
            position: 'absolute',
            //指定宽
            width: '192px',
            //指定高
            height: '108px',
            //底部
            bottom: '60px',
            //右侧
            right: '10px',
            //边框宽度
            borderWidth: '2px',
            //边框样式
            borderStyle: 'solid',
            //边框颜色
            borderColor: '#ffffff',
            //溢出隐藏
            overflow: 'hidden',
            //设置此属性可以使得视频在最上层
            zIndex: 99,
            //边框弧度
            borderRadius: '4px',
        };
        //禁止视频图标样式
        const videoMuteIcon = {
            position: 'absolute',
            color:'#fff',
          }

        return (
            <div key={this.props.id}
                //小视频样式
                style={small}>
                {/* 设置ref及id值 视频自动播放 objectFit为cover模式可以平铺整个视频 */}
                <video ref={this.props.id} id={this.props.id} 
                autoPlay playsInline muted={true}
                style={{ width: '100%', height: '100%', objectFit: 'cover', }} />
                {
                    //判断禁止视频属性值    
                    this.props.muted? <VideocamOffIcon style={videoMuteIcon}/> : null
                }
            </div>
        )
    }
}
//组件属性
LocalVideoView.propTypes = {
    //媒体流
    stream: PropTypes.any.isRequired,
    //Id
    id: PropTypes.string,
}
