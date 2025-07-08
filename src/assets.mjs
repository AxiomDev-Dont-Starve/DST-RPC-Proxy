import { existsSync, readFileSync, writeFileSync, createWriteStream, mkdirSync } from 'fs';
import { Readable } from 'stream';
import packageInfo from '../package.json' with { type: 'json' };

export const version = 'v' + packageInfo.version;

if (!existsSync('rpc')) {
    console.log('Creating rpc directory');
    mkdirSync('rpc');
}

export async function fetchLatestVersion() {
    try {
        const response = await fetch('https://api.github.com/repos/AxiomDev-Dont-Starve/DST-RPC-Proxy/releases/latest');
        if (!response.ok) throw new Error(`Failed to fetch latest version: ${response.status} ${response.statusText}`);
        const data = await response.json();
        const latestVersion = data.tag_name;
        if (version !== latestVersion) {
            console.warn('==================================================================================================');
            console.warn(`HEY! You are running an outdated version of the proxy. Please update to the latest version: ${latestVersion}`);
            console.warn('Download here: https://github.com/AxiomDev-Dont-Starve/DST-RPC-Proxy/releases/latest');
            console.warn('==================================================================================================');
        } else console.log('You are running the latest version of the proxy.');
        return latestVersion;
    } catch (error) {
        console.error('Failed to fetch latest version:', error);
        return "[Fetch error]";
    }
}

export async function fetchFastlistBinary() {
    if (process.platform !== 'win32' || existsSync(`rpc/fastlist-0.3.0-x64.exe`)) return;
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

export async function fetchAppId() {
    if (existsSync('rpc/appid.txt')) return readFileSync('rpc/appid.txt', 'utf8');
    console.log('Downloading Discord application id. This will only happen once.');
    try {
        const response = await fetch('https://axiomdev.net/dst/rpc/appid');
        if (!response.ok) throw new Error(`Failed to fetch application id: ${response.status} ${response.statusText}`);
        const appId = (await response.text()).trim();
        if (!appId) throw new Error('Application id is empty?');
        writeFileSync('rpc/appid.txt', appId);
        return appId;
    } catch (error) {
        console.error('Failed to fetch application id:', error);
        console.error('Central server may be down, will try again in 60s.');
        await new Promise(res => setTimeout(res, 60000));
        return fetchAppId();
    }
}