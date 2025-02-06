const express = require('express');
const RPC     = require('discord-rpc');
const exec    = require('child_process').exec;
const fs      = require('fs');

/**
 * @typedef {import('discord-rpc').Client} Client
 */

console.log("DST-Discord RPC Proxy v1.0.1 by ArmoredFuzzball");
console.log("Check for updates at https://github.com/AxiomDev-Dont-Starve/DST-RPC-Proxy/releases");

const app = express();
app.use(express.json());

let appId;
getAppId();

async function getAppId() {
    appId = await fetch('https://axiomdev.net/dst/rpc/appid').then(res => res.status === 200 && res.text()).catch(() => false);
    appId = appId && appId.trim();
    if (appId) {
        console.log('Fetched the application id');
        fs.writeFileSync('./appid.txt', appId);
    } else if (fs.existsSync('./appid.txt')) {
        appId = fs.readFileSync('./appid.txt', 'utf8');
        console.log('Fetch failed, loaded the application id from backup');
    } else {
        console.error('Failed to fetch or load the application id. Central server may be down, will try again automatically.');
        setTimeout(() => getAppId(), 60000);
    }
}

const ACTIVITY = {
    largeImageKey: 'large-image',
    largeImageText: 'DST-RPC-Mod on GitHub'
};

let resolver;
const readyPromise = new Promise(res => resolver = res);
app.post('/update', (req, res) => {
    for (const [key, value] of Object.entries(req.body)) {
        if (value == "") delete ACTIVITY[key];
        else ACTIVITY[key] = value;
    }
    // console.log(ACTIVITY);
    resolver();
    res.end();
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
    const command = process.platform === 'win32' ? 'tasklist' : 'ps aux';
    exec(command, (err, stdout, stderr) => {
        if (err || stderr) return console.error(err || stderr);
        if (stdout.includes('dontstarve')) createRPC();
        else deleteRPC();
    });
}

let connected = false;
/** @type {Client} */ let rpc;

async function createRPC() {
    if (rpc || connected) return;
    rpc = new RPC.Client({ transport: 'ipc' });
    await readyPromise; // delay so we don't start before DST's built-in presence
    rpc.login({ clientId: appId }).catch(console.error);
    await new Promise(res => rpc.on('ready', res));
    connected = true;
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