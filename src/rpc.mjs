import RPC from 'discord-rpc';

/** @type {import('discord-rpc').Client} */ let rpc;
let startTimestamp;
/** @type {Promise<void>} */
let readyPromise;
let appId;

export function setupRPC(appid) {
  appId = appid;
  rpc = new RPC.Client({ transport: 'ipc' });
  readyPromise = new Promise(res => rpc.once('ready', res));
}

let started = false;
export async function startRPC() {
  if (started) return readyPromise;
  started = true;
  rpc.login({ clientId: appId });
  await readyPromise;
  startTimestamp = Date.now();
  console.log('Connected to Discord RPC');
}

export async function stopRPC() {
  if (!rpc) return;
  await rpc.destroy();
  rpc = null;
  console.log('Disconnected from Discord RPC');
}

export async function forwardData(data) {
  if (!rpc) return;
  const activity = {
    largeImageKey: 'large-image',
    largeImageText: 'DST-RPC-Mod on GitHub',
    startTimestamp: startTimestamp
  };
  copyIfExists(activity, data, 'smallImageKey');
  copyIfExists(activity, data, 'smallImageText');
  copyIfExists(activity, data, 'details');
  copyIfExists(activity, data, 'state');
  // console.log('Updating activity with new data:', activity);
  await rpc.setActivity(activity);
}

function copyIfExists(target, source, key) {
  const value = source[key];
  if (value && value !== "") target[key] = source[key];
}