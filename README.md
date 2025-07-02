# DST-Discord RPC Proxy

This is the backend proxy component for the [DST-RPC mod](https://github.com/AxiomDev-Dont-Starve/DST-RPC-Mod). <br>
It is required to bridge the presence mod to Discord's RPC server due to the restrictive nature of Dont Starve Together's mod sandbox.

## Installation
First, download the latest release of the proxy executable for your OS from the [releases page](https://github.com/AxiomDev-Dont-Starve/DST-RPC-Proxy/releases/latest).

You can now choose to start the proxy server manually by double-clicking or running it. <br>
The proxy will need to be started each time you launch Don't Starve Together, and will stop automatically when the game closes.
Read on to see how to fully automate the starting of the proxy server.

## Full Automation
To start the proxy automatically, you must do three things:
* If you are using Steam to launch DST: right-click the game in your Steam library; click properties, general, and in the `launch options` field, add the following line (or equivalent on Linux): <br>
```
start.bat %COMMAND%
```
* Next, still in the properties menu, go to installed files, and click `Browse...`.
* Go into the `bin64` folder (or `bin` for 32-bit DST).
* Now, take the proxy executable you downloaded earlier, and place it inside this folder.
* Still in this folder, create a new file called `start.bat`. Inside this file, paste the following batch script:
```
@echo off
start dontstarve_steam_x64.exe
dst-rpc-proxy-win.exe
exit
```
Where `dst-rpc-proxy-win.exe` will be changed out for your specific executable.


And you're done! Now when you launch DST, the proxy server will automatically come up alongside it. <br>
When DST shuts down, so does the proxy server. Enjoy your completely automated rich presence!