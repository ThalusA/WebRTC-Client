const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const stopButton = document.getElementById('stopButton');
const hangupButton = document.getElementById('hangupButton');
const nameToCall = document.getElementById('nameToCall');
const username = document.getElementById('username');
const acceptCallButton = document.getElementById('acceptCall');
const denyCallButton = document.getElementById('denyCall');
const callerName = document.getElementById('callerName');

function setupStates(startState = null, callState = null, stopState = null, hangupState = null, nameToCallState = null, usernameState = null) {
    if (startState !== null)
        startButton.disabled = startState;
    if (callState !== null)
        callButton.disabled = callState;
    if (stopState !== null)
        stopButton.disabled = stopState;
    if (hangupState !== null)
        hangupButton.disabled = hangupState;
    if (nameToCallState !== null)
        nameToCall.disabled = nameToCallState;
    if (usernameState !== null)
        username.disabled = usernameState;
}

// Handles start button action: creates local MediaStream.
function startAction() {
    navigator.getUserMedia(mediaStreamConstraints, (mediaStream) => {
        trace('Setting up media devices');
        setupMediaDevice(mediaStream);
        peerConnection.onsignalingstatechange = handleSignalingState;
        peerConnection.onnegotiationneeded = handleNegotiation;
        peerConnection.onaddstream = handleStream;
        peerConnection.onicecandidate = handleConnection;
        peerConnection.onnegotiationneeded = beginNegotiation;
        setupStates(true, false, false, true, false, true);
        localVideo.hidden = false;
        const videoDevice = mediaStream.getVideoTracks()[0];
        const audioDevice = mediaStream.getAudioTracks()[0];
        if (videoDevice) trace(`Using video device: ${videoDevice.label}.`);
        if (audioDevice) trace(`Using audio device: ${audioDevice.label}.`);
        socket.emit('register', { username: username.value });
    }, (error) => {
        trace(`navigator.getUserMedia error: ${error.toString()}.`);
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
    setupStates(true, false, false, true, false);
    socket.emit('hangup', { username: username.value });
    remoteVideo.hidden = true;
    nameToCall.value = '';
    trace('Ending call.');
}

function stopAction() {
    setupStates(false, true, true, true, true, false);
    localStream.getTracks().forEach((track) => {
        track.stop();
    });
    localStream = null;
    localVideo.srcObject = null;
    nameToCall.value = '';
    remoteVideo.hidden = true;
    localVideo.hidden = true;
    socket.emit('unregister', { username: username.value });
    trace('Stopping service.');
}

function acceptAction() {
    beginNegotiation();
    acceptCallButton.disabled = true;
    denyCallButton.disabled = true;  
}

function denyAction() {
    socket.emit('call deny', { caller: callerName.value, responder: username.value });
    lastCallStreamData = null;
    callerName.value = '';
    acceptCallButton.disabled = true;
    denyCallButton.disabled = true;
}

startButton.addEventListener("click", startAction);
callButton.addEventListener("click", callAction);
hangupButton.addEventListener("click", hangupAction);
stopButton.addEventListener("click", stopAction);
acceptCallButton.addEventListener("click", acceptAction);
denyCallButton.addEventListener("click", denyAction);