const mediaStreamConstraints = { video: true };
const offerOptions = { offerToReceiveVideo: 1 };
let startTime = null;

const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const stopButton = document.getElementById('stopButton');
const hangupButton = document.getElementById('hangupButton');
const nameToCall = document.getElementById('nameToCall');
const username = document.getElementById('username');
const acceptCallButton = document.getElementById('acceptCall');
const denyCallButton = document.getElementById('denyCall');
const callerName = document.getElementById('callerName');

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let remoteStream;

let localPeerConnection;
let remotePeerConnection;

let lastCallStreamData;

// Define MediaStreams callbacks.

// Sets the MediaStream as the video element src.
function gotLocalMediaStream(mediaStream) {
    localVideo.srcObject = mediaStream;
    localStream = mediaStream;
    trace('Received local stream.');
}

// Handles error by logging a message to the console.
function handleLocalMediaStreamError(error) {
    trace(`navigator.getUserMedia error: ${error.toString()}.`);
}

// Handles remote MediaStream success by adding it as the remoteVideo src.
function gotRemoteMediaStream(event) {
    const mediaStream = event.stream;
    remoteVideo.srcObject = mediaStream;
    remoteStream = mediaStream;
    trace('Remote peer connection received remote stream.');
}

// Define RTC peer connection behavior.

// Connects with new peer candidate.
function handleConnection(event) {
    const peerConnection = event.target;
    const iceCandidate = event.candidate;

    if (iceCandidate) {
        const newIceCandidate = new RTCIceCandidate(iceCandidate);
        const otherPeer = getOtherPeer(peerConnection);

        otherPeer.addIceCandidate(newIceCandidate)
            .then(() => handleConnectionSuccess(peerConnection))
            .catch(error => handleConnectionFailure(peerConnection, error));

        trace(`${getPeerName(peerConnection)} ICE candidate:\n` +
            `${event.candidate.candidate}.`);
    }
}

function setupStates(startState = null, callState = null, stopState = null, hangupState = null, nameToCallState = null, usernameState = null) {
    if (startState !== null) {
        startButton.disabled = startState;
    }
    if (callState !== null) {
        callButton.disabled = callState;
    }
    if (stopState !== null) {
        stopButton.disabled = stopState;
    }
    if (hangupState !== null) {
        hangupButton.disabled = hangupState;
    }
    if (nameToCallState !== null) {
        nameToCall.disabled = nameToCallState;
    }
    if (usernameState !== null) {
        username.disabled = usernameState;
    }
}

// Logs that the connection succeeded.
function handleConnectionSuccess(peerConnection) {
    trace(`${getPeerName(peerConnection)} addIceCandidate success.`);
}

// Logs that the connection failed.
function handleConnectionFailure(peerConnection, error) {
    trace(`${getPeerName(peerConnection)} failed to add ICE Candidate:\n`+
        `${error.toString()}.`);
}

// Logs changes to the connection state.
function handleConnectionChange(event) {
    const peerConnection = event.target;
    console.log('ICE state change event: ', event);
    trace(`${getPeerName(peerConnection)} ICE state: ` +
        `${peerConnection.iceConnectionState}.`);
}

// Logs error when setting session description fails.
function setSessionDescriptionError(error) {
    trace(`Failed to create session description: ${error.toString()}.`);
}

// Logs success when setting session description.
function setDescriptionSuccess(peerConnection, functionName) {
    const peerName = getPeerName(peerConnection);
    trace(`${peerName} ${functionName} complete.`);
}

// Logs offer creation and sets peer connection session descriptions.
function createdOffer(description) {
    trace(`Offer from localPeerConnection:\n${description.sdp}`);

    trace('localPeerConnection setLocalDescription start.');
    localPeerConnection.setLocalDescription(description)
        .then(() => setDescriptionSuccess(localPeerConnection, 'setLocalDescription'))
        .catch(setSessionDescriptionError);
    trace('remotePeerConnection setRemoteDescription start.');
    remotePeerConnection.setRemoteDescription(description)
        .then(() => setDescriptionSuccess(remotePeerConnection, 'setRemoteDescription'))
        .catch(setSessionDescriptionError);
    socket.emit('register', {
        username: username.value,
        streamInfo: description 
    });
}

// Logs answer to offer creation and sets peer connection session descriptions.
function getAnswer(description) {
    trace(`Answer from remotePeerConnection:\n${description.sdp}.`);

    trace('remotePeerConnection setLocalDescription start.');
    remotePeerConnection.setLocalDescription(description)
        .then(() => setDescriptionSuccess(remotePeerConnection, 'setLocalDescription'))
        .catch(setSessionDescriptionError);

    trace('localPeerConnection setRemoteDescription start.');
    localPeerConnection.setRemoteDescription(description)
        .then(() => setDescriptionSuccess(localPeerConnection, 'setRemoteDescription'))
        .catch(setSessionDescriptionError);
}

// Handles start button action: creates local MediaStream.
function startAction() {
        navigator.getUserMedia(mediaStreamConstraints, (mediaStream) => {
            gotLocalMediaStream(mediaStream);
            setupStates(true, false, false, true, false, true);
            localVideo.hidden = false;
            const servers = null;
            const videoTracks = localStream.getVideoTracks();
            const audioTracks = localStream.getAudioTracks();
            if (videoTracks.length > 0) trace(`Using video device: ${videoTracks[0].label}.`);
            if (audioTracks.length > 0) trace(`Using audio device: ${audioTracks[0].label}.`);

            // Create peer connections and add behavior.
            localPeerConnection = new RTCPeerConnection(servers);
            trace('Created local peer connection object localPeerConnection.');
            remotePeerConnection = new RTCPeerConnection(servers);
            trace('Created remote peer connection object remotePeerConnection.');

            localPeerConnection.onicecandidate = handleConnection;
            localPeerConnection.oniceconnectionstatechange = handleConnectionChange;

            remotePeerConnection.onicecandidate = handleConnection;
            remotePeerConnection.oniceconnectionstatechange = handleConnectionChange;
            remotePeerConnection.onaddstream = gotRemoteMediaStream;
            
            localPeerConnection.addStream(localStream);
            trace('Added local stream to localPeerConnection.');
                
            trace('localPeerConnection createOffer start.');
            localPeerConnection.createOffer(offerOptions)
                .then(createdOffer)
                .catch(setSessionDescriptionError);

            trace('Requesting local stream.');
        }, (error) => {
            handleLocalMediaStreamError(error);
            trace('Requesting local stream.');
    });
}

// Handles call button action: creates peer connection.
function callAction() {

    setupStates(true, true, false, false, true);
    remoteVideo.hidden = false;
    trace('Starting call.');
    startTime = window.performance.now();

    socket.emit('call', { username: username.value, usernameToCall: nameToCall.value });
}

// Handles hangup action: ends up call, closes connections and resets peers.
function hangupAction() {
    if (localPeerConnection)
        localPeerConnection.close();
    if (remotePeerConnection)
        remotePeerConnection.close();
    setupStates(true, false, false, true, false);
    remoteVideo.hidden = true;
    nameToCall.value = '';
    localPeerConnection = null;
    remotePeerConnection = null;
    trace('Ending call.');
}

function stopAction() {
    if (localPeerConnection || remotePeerConnection)
        hangupAction();
    setupStates(false, true, true, true, true, false);
    localStream.getTracks().forEach((track) => {
        track.stop();
    });
    localStream = null;
    localVideo.srcObject = localStream;
    nameToCall.value = '';
    localVideo.hidden = true;
    socket.emit('unregister', { username: username.value });
    trace('Stopping service.');
}

function acceptAction() {
    getAnswer(lastCallStreamData);
    callerName.value = '';
    acceptCallButton.disabled = true;
    denyCallButton.disabled = true;
}

function denyAction() {
    lastCallStreamData = null;
    callerName.value = '';
    acceptCallButton.disabled = true;
    denyCallButton.disabled = true;
}

// Define helper functions.

// Gets the "other" peer connection.
function getOtherPeer(peerConnection) {
    return (peerConnection === localPeerConnection) ?
        remotePeerConnection : localPeerConnection;
}

// Gets the name of a certain peer connection.
function getPeerName(peerConnection) {
    return (peerConnection === localPeerConnection) ?
        'localPeerConnection' : 'remotePeerConnection';
}

// Logs an action (text) and the time when it happened on the console.
function trace(text) {
    text = text.trim();
    const now = (window.performance.now() / 1000).toFixed(3);

    console.log(now, text);
}

startButton.addEventListener("click", startAction);
callButton.addEventListener("click", callAction);
hangupButton.addEventListener("click", hangupAction);
stopButton.addEventListener("click", stopAction);
acceptCallButton.addEventListener("click", acceptAction);
denyCallButton.addEventListener("click", denyAction);