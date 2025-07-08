import lodash from 'lodash';
import { forwardData } from './rpc.mjs';

const FORWARD_INTERVAL = 4500;

let latestData;
let pendingTimer;
let lastForwardTs = 0;

function scheduleForward() {
  const now = Date.now();
  const sinceLast = now - lastForwardTs;

  if (sinceLast >= FORWARD_INTERVAL) {
    lastForwardTs = now;
    forwardData(latestData);
    return;
  }

  if (pendingTimer) return
  const delay = FORWARD_INTERVAL - sinceLast;
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    lastForwardTs = Date.now();
    forwardData(latestData);
  }, delay);
}

export function setLatestData(incoming) {
  if (lodash.isEqual(incoming, latestData)) return;
  latestData = incoming;
  scheduleForward();
}