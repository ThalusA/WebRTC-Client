const { app, BrowserWindow } = require('electron');
const prompt = require('electron-prompt');

function createWindow (addr) {
    let win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true,
            //additionalArguments: [addr]
        }
    });
    win.loadFile('index.html');
    win.on('closed', () => {
        win = null;
    });
}

function getSignalingServerAddr () {
    return (prompt({
        title: 'Signaling server address',
        label: 'Network address:', 
        value: 'http://',
        inputAttrs: {
            type: 'url'
        },
        type: 'input'
    }));
}

app.on('ready', createWindow);
/*
app.on('ready', () => getSignalingServerAddr().then(addr => {
    createWindow(addr);
}));
*/
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});