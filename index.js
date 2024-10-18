const express = require('express');
const RPC     = require('discord-rpc');
const exec    = require('child_process').exec;

console.log("DST-Discord RPC Proxy v0.3.0 by ArmoredFuzzball");
console.log("Check for updates at https://github.com/AxiomDev-Dont-Starve/DST-RPC-Proxy/releases");

const app = express();
app.use(express.raw({ type: 'application/json', limit: '2kb' }));

let appId;
getAppId();

//fetch the official application id
async function getAppId() {
    appId = await fetch('https://axiomdev.net/dst/rpc/appid').then(res => res.text());
    if (!appId) {
        console.error('Failed to fetch the application id. Central server may be down, will try again automatically.');
        setTimeout(getAppId, 60000);
    } else console.log('Fetched the application id');
}

const ACTIVITY = {
    largeImageKey: 'large-image',
    largeImageText: 'DST-RPC-Mod on GitHub'
};

app.post('/update', (req, res) => {
    const clean = req.body.toString().replace(/\n/g, '').replace(/\\/g, '');
    const json = JSON.parse(clean);
    for (const [key, value] of Object.entries(json)) {
        if (value == "") delete ACTIVITY[key];
        else ACTIVITY[key] = value;
    }
    // console.log(ACTIVITY);
});

app.listen(4747, () => console.log('Proxy is listening for updates from DST'));


setInterval(() => {
    if (!appId) return;
    setActivity();
    checkProcessExists();
}, 800);

function setActivity() {
    if (rpc && connected) rpc.setActivity(ACTIVITY);
}

function checkProcessExists() {
    exec('tasklist', (err, stdout, stderr) => {
        if (err) return console.error(err);
        if (stderr) return console.error(stderr);
        let exists = false
        for (const process of stdout.split('\n')) {
            if (process.includes('dontstarve')) {
                exists = true;
                if (!rpc && !connected) createRPC();
            }
        }
        if (!exists) deleteRPC();
    });
}

let connected = false;
let rpc;
async function createRPC() {
    if (connected) return;
    rpc = new RPC.Client({ transport: 'ipc' });
    rpc.login({ clientId: appId }).catch(console.error);
    await new Promise(res => rpc.on('ready', res));
    connected = true; //race condition because of await, maybe add a connecting check
    console.log('Connected to Discord RPC');
    ACTIVITY.startTimestamp = Date.now();
}

function deleteRPC() {
    if (!rpc) return;
    connected = false;
    rpc.destroy();
    rpc = null;
    console.log('Disconnected from Discord RPC');
    process.exit();
}

process.on('SIGINT', () => {
    console.log('Shutting down');
    deleteRPC();
    process.exit();
});

process.on('unhandledRejection', (reason, promise) => console.error('Unhandled Rejection at:', promise, 'reason:', reason));