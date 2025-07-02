import express from 'express';
import RPC from 'discord-rpc';
import { existsSync, readFileSync, writeFileSync, createWriteStream } from 'fs';
// import { performance } from 'perf_hooks';
import psList from 'ps-list';
import { Readable } from 'stream';
import lodash from 'lodash';

/** @typedef {import('discord-rpc').Client} Client */

const version = 'v2.0.0';
console.log(`DST-Discord RPC Proxy ${version} by ArmoredFuzzball`);

fetchLatestVersion();
async function fetchLatestVersion() {
    try {
        const response = await fetch('https://api.github.com/repos/AxiomDev-Dont-Starve/DST-RPC-Proxy/releases/latest');
        if (!response.ok) throw new Error(`Failed to fetch latest version: ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (data.tag_name !== version) {
            console.warn('==================================================================================================');
            console.warn(`HEY! You are running an outdated version of the proxy. Please update to the latest version: ${data.tag_name}`);
            console.warn('Download here: https://github.com/AxiomDev-Dont-Starve/DST-RPC-Proxy/releases/latest');
            console.warn('==================================================================================================');
        } else console.log('You are running the latest version of the proxy.');
    } catch (error) {
        console.error('Failed to fetch latest version:', error);
    }
}

if (process.platform === 'win32' && !existsSync(`fastlist-0.3.0-x64.exe`)) fetchFastlistBinary();
async function fetchFastlistBinary() {
    console.log('Downloading Fastlist binary for optimized Windows process checking. This will only happen once.');
    try {
        const file = await fetch(`https://github.com/MarkTiedemann/fastlist/releases/download/v0.3.0/fastlist-0.3.0-x64.exe`);
        if (!file.ok) throw new Error(`Failed to fetch fastlist binary: ${file.status} ${file.statusText}`);
        let writer = createWriteStream(`fastlist-0.3.0-x64.exe`);
        Readable.fromWeb(file.body).pipe(writer);
    } catch (error) {
        console.error('Failed to download fastlist binary:', error);
        console.error('Please ensure you have a working internet connection and try again.');
        process.exit(1);
    }
}

let appId;
fetchAppId();
async function fetchAppId() {
    appId = await fetch('https://axiomdev.net/dst/rpc/appid').then(res => res.status === 200 && res.text()).catch(() => false);
    appId = appId && appId.trim();
    if (appId) {
        console.log('Fetched the application id');
        writeFileSync('appid.txt', appId);
    } else if (existsSync('appid.txt')) {
        appId = readFileSync('appid.txt', 'utf8');
        console.log('Fetch failed, loaded the application id from backup');
    } else {
        console.error('Failed to fetch or load the application id. Central server may be down, will try again automatically.');
        setTimeout(() => fetchAppId(), 60000);
    }
}

const ACTIVITY = {
    largeImageKey: 'large-image',
    largeImageText: 'DST-RPC-Mod on GitHub'
};

const app = express();
app.use(express.json());

let previousActivity;
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
    // const start = performance.now();
    if (!appId) return;
    checkProcessExists();
    attemptActivityUpdate();
    // console.log(`Section took ${(performance.now() - start).toFixed(2)}ms`);
}, 800);

let lastUpdateTime = 0;
function attemptActivityUpdate() {
    if (Date.now() - lastUpdateTime < 15e3) return; // prevent spamming Discord
    if (lodash.isEqual(previousActivity, ACTIVITY)) return;
    // console.log('Updating activity with new data');
    if (rpc && connected) {
        lastUpdateTime = Date.now();
        previousActivity = { ...ACTIVITY };
        rpc.setActivity(ACTIVITY);
    }
}

function checkProcessExists() {
    psList().then(processes => {
        const exists = processes.some(proc => proc.name.toLowerCase().includes('dontstarve'));
        if (exists) createRPC();
        else        deleteRPC();
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
    attemptActivityUpdate();
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

process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection at:', reason));