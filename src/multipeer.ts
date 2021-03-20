export enum RTCEventType{
    NEW_ICE_CANDIDATE = "NEW_ICE_CANDIDATE",
    VIDEO_OFFER = "VIDEO_OFFER",
    VIDEO_ANSWER = "VIDEO_ANSWER",
    NEW_TRACK = "NEW_TRACK",
}

export interface RTCEvent {
    id: string,
    event: string,
    [key: string]: any,
}

interface Peer{
    peer : RTCPeerConnection,
    sender?: RTCRtpSender,
}

interface AllRTCPeerConnection{
    [key: string]: Peer
}

export class Multipeer {
    private _allPeerConnections: AllRTCPeerConnection = {};
    private _rtcPeerConfig: RTCConfiguration;
    private _localStream: MediaStream = new MediaStream();
    private _signalFunction: Function;
    private _defaultMediaStreamConstraints: MediaStreamConstraints = {
        audio: true,
        video: true,
    };

    /**
     * @param {RTCConfiguration} config - RTCConfiguration object with ICE Server config etc.
     * @param {Function} signalFunction - a callback function which will be called every time an RTC event occurs. An object of type RTCEvent is passed to this signal function. 
     * @param {MediaStreamConstraints=} mediaStreamConstraints <optional> - MediaStreamConstraints if any 
    */
    constructor(config: RTCConfiguration, signalFunction: Function, mediaStreamConstraints?: MediaStreamConstraints){
        this._rtcPeerConfig = config;
        this._signalFunction = signalFunction;
        this.initializeLocalStream(mediaStreamConstraints || this._defaultMediaStreamConstraints);
    }

    private initializeLocalStream = (mediaConstraints: MediaStreamConstraints) => {
        navigator.mediaDevices.getUserMedia(mediaConstraints)
        .then(localStream => this._localStream = localStream);
    }

    get localStream() : MediaStream {
        return this._localStream;
    }

    createPeerConnection = (id: string) => {
        if(this._allPeerConnections[id] !== undefined){
            throw (new Error("Id is not unique"));
        }
        this._allPeerConnections[id] = {
            peer: new RTCPeerConnection(this._rtcPeerConfig)
        }
        this._allPeerConnections[id].peer.onicecandidate = (event: RTCPeerConnectionIceEvent) => this.handleICECandidateEvent(id, event);
        this._allPeerConnections[id].peer.ontrack = (event: RTCTrackEvent) => this.handleTrackEvent(id, event);
        this._localStream.getTracks().forEach(track => {
            this._allPeerConnections[id].sender = this._allPeerConnections[id].peer.addTrack(track, this._localStream);
        });
    }

    private handleICECandidateEvent = (id: string, event: RTCPeerConnectionIceEvent) => {
        if(event.candidate){
            this._signalFunction({
                id: id,
                event: RTCEventType.NEW_ICE_CANDIDATE,
                candidate: event.candidate,
            });
        }
    }

    private handleTrackEvent = (id: string, event: RTCTrackEvent) => {
        if(event.streams && event.streams[0]){
            this._signalFunction({
                id: id,
                event: RTCEventType.NEW_TRACK,
                stream: event.streams[0],
            });
        }
    }

    createNewOffer = (id: string) => {
        this._allPeerConnections[id].peer.createOffer()
        .then((offer: RTCSessionDescriptionInit) => this._allPeerConnections[id].peer.setLocalDescription(offer))
        .then(() => {
            this._signalFunction({
                id: id,
                event: RTCEventType.VIDEO_OFFER,
                sdp: this._allPeerConnections[id].peer.localDescription
            });
        });
    }

    handleVideoOffer = (id: string, sdp: RTCSessionDescription) => {
        const sessionDescription = new RTCSessionDescription(sdp);
        this._allPeerConnections[id].peer.setRemoteDescription(sessionDescription)
        .then(() => this._allPeerConnections[id].peer.createAnswer())
        .then((answer: RTCSessionDescriptionInit) => this._allPeerConnections[id].peer.setLocalDescription(answer))
        .then(() => {
            this._signalFunction({
                id: id,
                event: RTCEventType.VIDEO_ANSWER,
                sdp: this._allPeerConnections[id].peer.localDescription
            });
        });
    }

    handleVideoAnswer = (id: string, sdp: RTCSessionDescription) => {
        const sessionDescription = new RTCSessionDescription(sdp);
        this._allPeerConnections[id].peer.setRemoteDescription(sessionDescription);
    }

    handleRemoteICECandidate = (id: string, candidate: RTCIceCandidateInit) => {
        const newCandidate = new RTCIceCandidate(candidate);
        this._allPeerConnections[id].peer.addIceCandidate(newCandidate)
    }
}