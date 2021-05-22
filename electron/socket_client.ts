// Include Nodejs' net module.
import * as  Net from 'net';
import * as  ip from 'ip';
import * as  find from 'local-devices';
import { BrowserWindow, ipcMain } from 'electron';
import { setInterval } from 'timers';
import { networkInterfaces } from 'os';
const log = require('electron-log');

class SocketClient {
  port = 8910;
  log: any;
  sendEvToWin: any;
  selectedSerial: string;
  authorizedHeadsets: any[] = [];
  onlineHeadsets: any[] = [];
  awaitingVrModuleToRun;
  connectedIP;
  findingServerInterval;
  clients = {};
  CLIENT_EVENTS = {
    error: 'main-error',
    connect_headset: 'connect-headset-wirelessly',
    no_headset_selected: 'no-headset-selected',
    wrong_module_detected: 'wrong-module-detected',
    finding_selected_headset: 'finding-selected-headset',
    some_headsets_found: 'some-headsets-found',
    offline_headset_ready: 'offline-headset-ready',
    headset_module_ready: 'headset-module-ready',
    authorized_devices_changed: 'authorized-devices-changed',
    online_devices_changed: 'online-devices-changed',
  };

  constructor(opts) {
    this.log = opts.logMsg;
    this.sendEvToWin = opts.sendEvToWin;
    this.SetupEventsListeners();
  }

  SetupEventsListeners() {
    // ipcMain.on(this.CLIENT_EVENTS.connect_headset, (event, options) => {
    //   if (options.awaitingVrModuleToRun) {
    //     this.awaitingVrModuleToRun = options.awaitingVrModuleToRun;
    //   }
    //   this.tryToConnect(options);
    // });

    ipcMain.on(this.CLIENT_EVENTS.authorized_devices_changed, (_event, options) => {
      this.authorizedHeadsets = options.authorized_devices;
    });

    this.tryToFindHeadsets();
  }

  tryToFindHeadsets() {
    // console.log('TRYING TO FIND HEADSET');
    this.setFindingIntervalV2();
  }

  async findLocalServers(portNumber) {
    try {
      const devices = await find();

      // console.log('online devices');
      // console.log(devices);
      // console.log('--------')
      devices.forEach((device) => {
        const host =  {
          ip: device.ip,
          port: portNumber
        }

        // console.log(device);

        if ( host.ip in this.clients ) {
          if ( this.clients[host.ip] != null ) {
            return;
          }    
        }

        const client = new Net.Socket();
        // Create a new TCP client.
        client.connect({ port: portNumber, host: host.ip }, () => { this.onConnect(client); });
        client.on('data', (chunk) => { this.onDataReceivedV2(chunk, client, host); });
        client.on('end', () => { this.onEnd(client, host); });
        client.on('error', (err) => { this.onError(err, client, host); });
      });
    } catch (err) {
      // console.log('findLocalServers. error..', err);
    }
  }

  onEnd(_client, host) {
    this.clients[host.ip] = null;
    // console.log('Requested an end to the TCP connection');
  }

  getWiFiIPAddress() {
    const nets = networkInterfaces();
    // const results = Object.create(null); // Or just '{}', an empty object

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family.toLowerCase() === 'ipv4' && !net.internal) {
              var netName = name.toLowerCase()
              if ( netName.includes('wlan') || netName.includes('wi') || netName.includes('enp13s0') ) {
                return net.address;
              }
            }
        }
    }
    // console.log(results)
    return '';
  }

  setFindingIntervalV2() {
    this.findLocalServers(this.port);
    this.findingServerInterval = setTimeout(() => this.setFindingIntervalV2(), 500);
  }

  onConnect(client) {
    // console.log('TCP connection established with the server...');
    // const requestObj = JSON.stringify({
    //   type: 'requestInfo',
    //   need: 'info'
    // });
    client.write('requestInfo');
  }

  onError(_err, client, host) {
    // console.log('connect error...', _err.stack);
    // Remove clients that are already there but now we cannot connect with them
    for ( var i = 0; i < this.onlineHeadsets.length; i++) {
      if ( this.onlineHeadsets[i].headsetIP == host.ip ) {
        // console.log('REMOVING', this.onlineHeadsets[i]);
        this.sendEvToWin(this.CLIENT_EVENTS.online_devices_changed, {
          newHeadsetFound: false,
          onlineHeadsetObj: this.onlineHeadsets[i],
        });
        // console.log('-------------')
        this.onlineHeadsets.splice(i, 1);
      }
    }
    this.clients[host.ip] = null;
    client.end();
  }

  onDataReceivedV2(chunk, client, host) {
    // console.log(`Data received from the server: ${chunk.toString()}.`);

    const data = chunk.toString().split(' ');
    // const data = JSON.parse(chunk);
    // console.log(data);
    var receivedObj = {
      headsetIP: host.ip,
      headsetPort: host.port,
      headsetSerial: '',
      headsetModuleName: '',
      headsetName: '',
    }

    for ( var i = 0; i < data.length; i++ ) {
      if ( data[i] == 'headsetSerial' ) {
        receivedObj.headsetSerial = data[i + 1];
        const authorizedHeadset = this.authorizedHeadsets.some(el => el.serial == receivedObj.headsetSerial);
        if ( !authorizedHeadset ) {
          console.log('UNAUTHORIZED HEADSET', receivedObj.headsetSerial)
          client.end();
          return;
        } else {
          const headsetIdx = this.authorizedHeadsets.findIndex(el => el.serial == receivedObj.headsetSerial);
          receivedObj.headsetName = this.authorizedHeadsets[headsetIdx].name
        }
      } else if ( data[i] == 'headsetModuleName' ) {
        receivedObj.headsetModuleName = data[i + 1];
      } else if ( data[i] == 'gotServerUrl' ) {
        console.log('GOT IT ALREADY!');
        // client.end();
        return;
      }
    }

    if ( receivedObj.headsetModuleName == '' || receivedObj.headsetSerial == '' || receivedObj.headsetName == '' ) {
      console.log(data);
      console.log(receivedObj);
      console.log('EMPTY STUFF');
      client.end();
      return;
    }

    var found = false;
    if ( this.onlineHeadsets.length != 0 ) {
      found = this.onlineHeadsets.some(el => 'headsetSerial' in el && el.headsetSerial == receivedObj.headsetSerial);
    }
    if ( !found ) {
      // console.log('ADD', receivedObj)
      this.onlineHeadsets.push(receivedObj); // dont need that
      // console.log('ADDING', receivedObj)
      this.sendEvToWin(this.CLIENT_EVENTS.online_devices_changed, {
        newHeadsetFound: true,
        onlineHeadsetObj: receivedObj
      });
      // console.log('-------------')
      // const response = JSON.stringify({
      //   type: 'response',
      //   IP: ip.address()
      // });
      console.log('IP ' + ip.address());
      const ipAddress = this.getWiFiIPAddress();
      if ( ipAddress.length > 0 ) {
        this.clients[host.ip] = client;
        client.write('IP ' + ipAddress);  
      } else {
        console.log('WIFI IP WAS NOT FOUND!')
        client.end();
      }
    } else {
      // console.log('IGNOER');
    }
    // client.end();
    // console.log(this.onlineHeadsets);
  }

  onDataReceivedV1(chunk, client, selectedSerial=null) {
    console.log(`Data received from the server: ${chunk.toString()}.`);

    const data = chunk.toString().split(' ');
    if (data[0] === 'serial') {
      const serial = data[1];
      if (selectedSerial && serial === selectedSerial) {
        client.write('moduleName');
        this.sendEvToWin(this.CLIENT_EVENTS.finding_selected_headset, {
          msg: `selected headset is available around you, and we are verifying the module '${this.awaitingVrModuleToRun.moduleName}'...`,
          running: true, serial
        });
      } else {
        // store SERIAL in dict (array)
      }
    } else if (data[0] === 'moduleName') {
      const moduleName = data[1];
      if (selectedSerial && moduleName === this.awaitingVrModuleToRun.packageName) {
        client.write('connect ' + ip.address());
        this.sendEvToWin(this.CLIENT_EVENTS.finding_selected_headset, {
          msg: `The module '${this.awaitingVrModuleToRun.moduleName}' is verified now on the headset and the IP has sent to it.`,
          running: true, serial: selectedSerial
        });
      } else {
        // store MODULE_NAME in dict with SERIAL
      }
    } else if (data[0] === 'gotServerUrl') {
      this.headsetIsConnectedSuccessfully(client);
    }
  }

  clearFindingInterval(selectedSerial) {
    if (!this.findingServerInterval) { return; }

    clearInterval(this.findingServerInterval);
    this.findingServerInterval = null;
    this.endAllClientsConnections();
    this.sendEvToWin(this.CLIENT_EVENTS.finding_selected_headset, {
      msg: `Seems the headset is not around, we stopped the searching now: ${selectedSerial}`,
      running: false, selectedSerial
    });
  }

  headsetIsConnectedSuccessfully(client) {
    this.connectedIP = client;
    this.clearFindingInterval(this.selectedSerial);
    this.sendEvToWin(this.CLIENT_EVENTS.offline_headset_ready, { ready: true, headsetDevice: { id: this.selectedSerial } });
    if (this.awaitingVrModuleToRun) {
      this.sendEvToWin(this.CLIENT_EVENTS.headset_module_ready, {
        ready: true, headsetDevice: { id: this.selectedSerial }, ...this.awaitingVrModuleToRun
      });
      this.awaitingVrModuleToRun = null;
    }
  }

  endAllClientsConnections() {
    Object.values(this.clients).forEach((client: any) => client.end());
    this.clients = {};
  }
}

module.exports.SocketClient = SocketClient;
