const addr = 'http://172.30.42.150:8088';
const socket = io(addr);
let connected = false;

socket.on('connect', () => {
    connected = true;
    console.log('Connection etablished.');
});

socket.on('called', (data) => {
    callerName.value = data.username;
    acceptCallButton.disabled = false;
    denyCallButton.disabled = false;
});

socket.on('call info', (data) => {
    console.log(data);
    peerConnection.setRemoteDescription(data.streamInfo) // WHERE IT CRASH
        .then(() => peerConnection.createAnswer(answerOptions))
        .then(peerConnection.setLocalDescription)
        .then(() => {
            socket.emit('call answer', { caller: username.value, responder: nameToCall.value, streamInfo: peerConnection.localDescription.toJSON() });
            data.candidates.forEach(candidate => peerConnection.addIceCandidate(candidate));
        })
        .catch(err => console.log(err));
});

socket.on('call answer', (data) => {
    console.log(data);
    peerConnection.setRemoteDescription(data.streamInfo)
        .then(() => data.candidates.forEach(candidate => peerConnection.addIceCandidate(candidate)))
        .catch(err => console.log(err));

});

socket.on('ice receive', (data) => {
    peerConnection.addIceCandidate(data.candidate);
});

socket.on('call denied', (data) => {
    if (data.username == nameToCall.value) {
        nameToCall.value = '';
    }
});

socket.on('hangup', (data) => {
    if (data.username == username.value)
        hangupAction();
});

window.onbeforeunload = () => {
    socket.emit('unregister', { username: username.value });
};