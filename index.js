const express    = require('express');
const bodyParser = require('body-parser');
const RPC        = require('discord-rpc');
const exec       = require('child_process').exec;

console.log("DST-Discord RPC Proxy v0.2.0 by ArmoredFuzzball");

const app = express();
app.use(bodyParser.raw({ type: 'application/json', inflate: true, limit: '2kb' }));

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

let presenceData = {
    largeImageKey: 'large-image',
    largeImageText: 'DST-RPC on GitHub',
    details: 'Loading...'
};

app.post('/update', (req, res) => {
    const clean = req.body.toString().replace(/\n/g, '').replace(/\\/g, '');
    const json = JSON.parse(clean);
    presenceData = { ...presenceData, ...json };
    for (const key in presenceData) if (json[key] == '') delete presenceData[key];
    // console.log(presenceData);
});

app.listen(4747, () => console.log('Proxy is listening for updates from DST'));


setInterval(() => {
    if (!appId) return;
    handleRPCConnection();
    handleProcessCheck();
}, 800);

function handleRPCConnection() {
    if (rpc && connected) rpc.setActivity(presenceData);
}

function handleProcessCheck() {
    exec('tasklist', (err, stdout, stderr) => {
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
    presenceData.startTimestamp = Date.now();
}

function deleteRPC() {
    if (!rpc) return;
    connected = false;
    rpc.destroy();
    rpc = null;
    console.log('Disconnected from Discord RPC');
    presenceData = {
        largeImageKey: 'large-image',
        largeImageText: 'DST-RPC-Mod on GitHub',
        details: 'Loading...'
    };
    process.exit();
}

process.on('SIGINT', () => {
    console.log('Shutting down');
    deleteRPC();
    process.exit();
});

process.on('unhandledRejection', (reason, promise) => console.error('Unhandled Rejection at:', promise, 'reason:', reason));