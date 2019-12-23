const mediaStreamConstraints = { video: true, audio: true };
const offerOptions = { offerToReceiveVideo: true, offerToReceiveAudio: true, voiceActivityDetection: true };
const answerOptions = null;
let startTime = null;

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const servers = null;

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

function handleTrack(track) {
    if (!remoteVideo.srcObject) {
        trace('Remote peer connection received remote stream.');
        remoteVideo.srcObject = track.streams[0];
        remoteStream = track.streams[0];
    }
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