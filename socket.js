const socket = io("http://172.30.42.158:8088");
let connected = false;

socket.on('connect', () => {
    connected = true;
    console.log('Connection etablished.');
});

socket.on('called', (data) => {
    callerName.value = data.username;
    lastCallStreamData = data.streamInfo;
    acceptCallButton.disabled = false;
    denyCallButton.disabled = false;
});

window.onbeforeunload = () => {
    socket.emit('unregister', { username: username.value });
};