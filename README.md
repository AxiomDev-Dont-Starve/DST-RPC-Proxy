# DST-Discord RPC Proxy

This is the backend proxy component for the [DST-RPC mod](https://github.com/AxiomDev-Dont-Starve/DST-RPC-Mod). <br>
It is required to bridge the presence mod to Discord's RPC server due to the restrictive nature of Dont Starve Together's mod sandbox.

## Installation
Installing the proxy server is more involved than the presence mod.

* Firstly, the proxy server currently requires [Node.js](https://nodejs.org/) (any modern version) to be installed on your machine.
* Download the latest build of the proxy server by clicking the green `<> Code` button and hit "Download ZIP."
* Unzip the file and run `npm install` in the unzipped folder to download the necessary packages. Remember where you unzipped it.

You can now choose to start the proxy server manually with the included ``start.bat`` file (or equivalent). <br>
The proxy will need to be started each time you launch Don't Starve Together, and will stop automatically when the game closes.
Read on to see how to fully automate the starting of the proxy server.

## Full Automation
To start the proxy automatically, you must do two things:
* If you are using Steam to launch DST: right click the game in Steam, go to properties, general, and in the `launch options` field, add the following line: <br>
```
start.bat %COMMAND%
```
* Next, still in the properties menu, go to installed files, and click `Browse...`.
* Go into the `bin64` folder (or `bin` for 32-bit DST) and create a new file called `start.bat`.
* Inside this file, paste the following batch script:
```
@echo off
start dontstarve_steam_x64.exe
cmd /c start /min node "C:\Path\to\the\proxy\server\index.mjs"
exit
```
Where `"C:\Path\to\the\proxy\server\index.mjs"` will be changed out for your specific path from earlier.

And you're done! Now when you launch DST, the proxy server will automatically come up alongside it. <br>
When DST shuts down, so does the proxy server. Enjoy your completely automated rich presence!