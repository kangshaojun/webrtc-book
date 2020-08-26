import React from "react";
import { HashRouter as Router,Route,} from 'react-router-dom';
import PeerConnection from './PeerConnection';
import DataChannel from './DataChannel';
import Samples from './Samples';
import Canvas from "./Canvas";
import Camera from './Camera';
import Microphone from './Microphone';
import ScreenSharing from './ScreenSharing';
import VideoFilter from './VideoFilter';
import Resolution from './Resolution';
import AudioVolume from './volume/AudioVolume';
import DeviceSelect from './DeviceSelect';
import MediaSettings from './media-settings/MediaSettings';
import RecordAudio from "./RecordAudio";
import RecordVideo from "./RecordVideo";
import P2PClient from "./p2p/P2PClient";
import RecordScreen from "./RecordScreen";
import RecordCanvas from "./RecordCanvas";
import MediaStreamAPI from "./MediaStreamAPI";
import CaptureVideo from "./CaptureVideo";
import CaptureCanvas from "./CaptureCanvas";
import PeerConnectionVideo from "./PeerConnectionVideo";
import PeerConnectionCanvas from "./PeerConnectionCanvas";
import DataChannelFile from "./DataChannelFile";

//主组件
class App extends React.Component {

  render() {
    //路由配置
    return <Router>
            <div>
                {/* 首页 */}
                <Route exact path="/" component={Samples} />
                <Route exact path="/camera" component={Camera} />
                <Route exact path="/microphone" component={Microphone} />
                <Route exact path="/canvas" component={Canvas} />
                <Route exact path="/screenSharing" component={ScreenSharing} />
                <Route exact path="/videoFilter" component={VideoFilter} />
                <Route exact path="/resolution" component={Resolution} />
                <Route exact path="/audioVolume" component={AudioVolume} />
                <Route exact path="/deviceSelect" component={DeviceSelect} />
                <Route exact path="/mediaSettings" component={MediaSettings} />
                <Route exact path="/recordAudio" component={RecordAudio} />
                <Route exact path="/recordScreen" component={RecordScreen} />
                <Route exact path="/recordCanvas" component={RecordCanvas} />
                <Route exact path="/mediaStreamAPI" component={MediaStreamAPI} />
                <Route exact path="/captureVideo" component={CaptureVideo} />
                <Route exact path="/captureCanvas" component={CaptureCanvas} />
                <Route exact path="/recordVideo" component={RecordVideo} />
                <Route exact path="/peerConnection" component={PeerConnection} />
                <Route exact path="/peerConnectionVideo" component={PeerConnectionVideo} />
                <Route exact path="/peerConnectionCanvas" component={PeerConnectionCanvas} />
                <Route exact path="/dataChannel" component={DataChannel} />
                <Route exact path="/dataChannelFile" component={DataChannelFile} />
                <Route exact path="/p2pClient" component={P2PClient} />
            </div>
        </Router>
  }
}
//导出主组件
export default App;
