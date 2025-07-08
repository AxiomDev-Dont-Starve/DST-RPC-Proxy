import psList from 'ps-list';
import { fetchFastlistBinary, fetchAppId, fetchLatestVersion, version } from './assets.mjs';
import { startServer } from './server.mjs';
import { setupRPC, stopRPC } from './rpc.mjs';

console.log(`DST-Discord RPC Proxy ${version} by ArmoredFuzzball`);

async function shutdown() {
  console.log('Shutting down');
  await stopRPC();
  process.exit();
}

let gameStarted = false
async function checkProcessExists() {
  const processes = await psList();
  const exists = processes.some(proc => proc.name.toLowerCase().includes('dontstarve'));
  if (exists) gameStarted = true;
  else if (gameStarted) await shutdown();
}

async function main() {
  await fetchFastlistBinary();
  const appId = await fetchAppId();
  const latestVersion = await fetchLatestVersion();
  setupRPC(appId);
  await startServer(version, latestVersion);
  setInterval(checkProcessExists, 1e3);
}

main();

process.on('SIGINT', shutdown);
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));