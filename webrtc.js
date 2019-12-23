const mediaStreamConstraints = { video: true, audio: true };
const offerOptions = { offerToReceiveVideo: true, offerToReceiveAudio: true, voiceActivityDetection: true };
const answerOptions = null;
let startTime = null;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const servers = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        { urls: "stun:stun.ekiga.net" },
        { urls: "stun:stun.ideasip.com" },
        { urls: "stun:stun.rixtelecom.se" },
        { urls: "stun:stun.schlund.de" },
        { urls: "stun:stun.stunprotocol.org:3478" },
        { urls: "stun:stun.voiparound.com" },
        { urls: "stun:stun.voipbuster.com" },
        { urls: "stun:stun.voipstunt.com" },
        { urls: "stun:stun.voxgratia.org" }
    ]
};

let localStream;
let remoteStream;
let lastCallStreamData;

let peerConnection = new RTCPeerConnection(servers);

// Sets the MediaStream as the media device source.
function setupMediaDevice(mediaStream) {
    trace('Etablish stream preview.');
    localVideo.srcObject = mediaStream;
    localStream = mediaStream;
    trace('Add video stream to peerConnection.');
    peerConnection.addStream(localStream);
}

// Define RTC peer connection behavior.

function handleNegotiation() {
    trace('Negotiation Needed');
}

function handleSignalingState() {
    trace(peerConnection.signalingState);
}

// Connects with new peer candidate.
function handleConnection(desc) {
    if (desc && desc.candidate && desc.candidate.candidate) {
        trace(`ICE Canditate Update : ${desc.candidate.candidate}`);
        socket.emit('ice update', { username: username.value , candidate: desc.candidate.toJSON() });
    }
}

// Logs error when setting session description fails.
function setSessionDescriptionError(error) {
    trace(`Failed to create session description: ${error.toString()}.`);
}

// Logs offer creation and sets peer connection session descriptions.
function createdOffer(description) {
    trace(`Creating offer from peerConnection:\n${description.sdp}`);
    peerConnection.setLocalDescription(description)
        .then(() => socket.emit('register', { username: username.value }))
        .catch(setSessionDescriptionError);
}

function handleStream(event) {
    remoteVideo.srcObject = event.stream;
    remoteStream = event.stream;
}

// Logs answer to offer creation and sets peer connection session descriptions.
function getAnswer(description) {
    trace(`Receiving answer from peerConnection:\n${description.sdp}.`);
    peerConnection.setRemoteDescription(description)
        .catch(setSessionDescriptionError);
}

function trace(text) {
    text = text.trim();
    const now = (window.performance.now() / 1000).toFixed(3);
    console.log(now, text);
}