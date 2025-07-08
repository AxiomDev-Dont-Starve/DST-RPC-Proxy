import express from 'express';
import { startRPC } from './rpc.mjs';
import { setLatestData } from './activity.mjs';

const app = express();
app.use(express.json());

export async function startServer(version, latestVersion) {
  app.post('/update', async (req, res) => {
    await startRPC();
    setLatestData(req.body);
    res.send();
  });

  app.get('/version/current', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(version);
  });
  
  app.get('/version/latest', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(latestVersion);
  });

  await new Promise(res => app.listen(4747, res));
  console.log('Proxy is listening for updates from DST');
}