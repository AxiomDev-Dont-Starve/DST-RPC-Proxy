import express from 'express';
import RPC from 'discord-rpc';
import { existsSync, readFileSync, writeFileSync, createWriteStream, mkdirSync } from 'fs';
// import { performance } from 'perf_hooks';
import psList from 'ps-list';
import { Readable } from 'stream';
import lodash from 'lodash';
import packageInfo from '../package.json' with { type: 'json' };

/** @typedef {import('discord-rpc').Client} Client */

const version = 'v' + packageInfo.version;
console.log(`DST-Discord RPC Proxy ${version} by ArmoredFuzzball`);

if (!existsSync('rpc')) {
    console.log('Creating rpc directory');
    mkdirSync('rpc');
}

let latestVersion = "[Fetch error]";
fetchLatestVersion();
async function fetchLatestVersion() {
    try {
        const response = await fetch('https://api.github.com/repos/AxiomDev-Dont-Starve/DST-RPC-Proxy/releases/latest');
        if (!response.ok) throw new Error(`Failed to fetch latest version: ${response.status} ${response.statusText}`);
        const data = await response.json();
        latestVersion = data.tag_name;
        if (version !== latestVersion) {
            console.warn('==================================================================================================');
            console.warn(`HEY! You are running an outdated version of the proxy. Please update to the latest version: ${latestVersion}`);
            console.warn('Download here: https://github.com/AxiomDev-Dont-Starve/DST-RPC-Proxy/releases/latest');
            console.warn('==================================================================================================');
        } else console.log('You are running the latest version of the proxy.');
    } catch (error) {
        console.error('Failed to fetch latest version:', error);
    }
}

if (process.platform === 'win32' && !existsSync(`rpc/fastlist-0.3.0-x64.exe`)) fetchFastlistBinary();
async function fetchFastlistBinary() {
    console.log('Downloading Fastlist binary for optimized Windows process checking. This will only happen once.');
    try {
        const response = await fetch(`https://github.com/MarkTiedemann/fastlist/releases/download/v0.3.0/fastlist-0.3.0-x64.exe`);
        if (!response.ok) throw new Error(`Failed to fetch fastlist binary: ${response.status} ${response.statusText}`);
        const writer = createWriteStream(`rpc/fastlist-0.3.0-x64.exe`);
        Readable.fromWeb(response.body).pipe(writer);
    } catch (error) {
        console.error('Failed to download fastlist binary:', error);
        console.error('Please ensure you have a working internet connection and try again.');
        process.exit(1);
    }
}

let appId;
fetchAppId();
async function fetchAppId() {
    if (existsSync('rpc/appid.txt')) return appId = readFileSync('rpc/appid.txt', 'utf8');
    try {
        console.log('Downloading Discord application id. This will only happen once.');
        const response = await fetch('https://axiomdev.net/dst/rpc/appid');
        if (!response.ok) throw new Error(`Failed to fetch application id: ${response.status} ${response.statusText}`);
        appId = (await response.text()).trim();
        if (!appId) throw new Error('Application id is empty?');
        writeFileSync('rpc/appid.txt', appId);
    } catch (error) {
        console.error('Failed to fetch application id:', error);
        console.error('Central server may be down, will try again automatically.');
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
    // const start = performance.now();
    for (const [key, value] of Object.entries(req.body)) {
        if (value == "") delete ACTIVITY[key];
        else ACTIVITY[key] = value;
    }
    // console.log(ACTIVITY);
    resolver();
    attemptActivityUpdate();
    res.end();
    // console.log(`Section took ${(performance.now() - start).toFixed(2)}ms`);
});

app.get('/version/current', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(version);
});

app.get('/version/latest', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(latestVersion);
});

app.listen(4747, () => console.log('Proxy is listening for updates from DST'));

setInterval(() => { if (appId) checkProcessExists() }, 1e3);

let lastUpdateTime = 0;
function attemptActivityUpdate() {
    if (Date.now() - lastUpdateTime < 5e3) return; // prevent spamming Discord
    if (lodash.isEqual(previousActivity, ACTIVITY)) return;
    if (rpc && connected) {
        // console.log('Updating activity with new data');
        rpc.setActivity(ACTIVITY);
        previousActivity = { ...ACTIVITY };
        lastUpdateTime = Date.now();
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