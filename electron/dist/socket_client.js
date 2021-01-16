"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// Include Nodejs' net module.
var Net = require("net");
var ip = require("ip");
var find = require("local-devices");
var electron_1 = require("electron");
var timers_1 = require("timers");
var os_1 = require("os");
var log = require('electron-log');
var SocketClient = /** @class */ (function () {
    function SocketClient(opts) {
        this.port = 8910;
        this.authorizedHeadsets = [];
        this.onlineHeadsets = [];
        this.clients = {};
        this.CLIENT_EVENTS = {
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
        this.log = opts.logMsg;
        this.sendEvToWin = opts.sendEvToWin;
        this.SetupEventsListeners();
    }
    SocketClient.prototype.SetupEventsListeners = function () {
        // ipcMain.on(this.CLIENT_EVENTS.connect_headset, (event, options) => {
        //   if (options.awaitingVrModuleToRun) {
        //     this.awaitingVrModuleToRun = options.awaitingVrModuleToRun;
        //   }
        //   this.tryToConnect(options);
        // });
        var _this = this;
        electron_1.ipcMain.on(this.CLIENT_EVENTS.authorized_devices_changed, function (_event, options) {
            _this.authorizedHeadsets = options.authorized_devices;
        });
        this.tryToFindHeadsets();
    };
    SocketClient.prototype.tryToFindHeadsets = function () {
        // console.log('TRYING TO FIND HEADSET');
        this.setFindingIntervalV2();
    };
    SocketClient.prototype.tryToConnect = function (options) {
        // if (!options.selectedSerial) {
        //   return this.sendEvToWin(this.CLIENT_EVENTS.no_headset_selected, {
        //     msg: 'Please, select one of your headsets'
        //   });
        // }
        // if (!this.authorizedHeadsets.includes(options.selectedSerial)) {
        //   return this.sendEvToWin(this.CLIENT_EVENTS.wrong_headset_selected, {
        //     msg: `We cannot find this headset in your authorized headsets: ${options.selectedSerial}`,
        //     selectedSerial: options.selectedSerial
        //   });
        // }
        this.setFindingIntervalV1(options.selectedSerial);
    };
    SocketClient.prototype.findLocalServers = function (portNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var devices, err_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, find()];
                    case 1:
                        devices = _a.sent();
                        // console.log('online devices');
                        // console.log(devices);
                        // console.log('--------')
                        devices.forEach(function (device) {
                            var host = {
                                ip: device.ip,
                                port: portNumber
                            };
                            // console.log(host);
                            var client = new Net.Socket();
                            _this.clients[host.ip] = client;
                            // Create a new TCP client.
                            client.connect({ port: portNumber, host: host.ip }, function () { _this.onConnect(client); });
                            client.on('data', function (chunk) { _this.onDataReceivedV2(chunk, client, host); });
                            client.on('end', function () { _this.onEnd(client); });
                            client.on('error', function (err) { _this.onError(err, client, host); });
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        console.log('findLocalServers. error..', err_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    SocketClient.prototype.findLocalServersBySerial = function (selectedSerial) {
        return __awaiter(this, void 0, void 0, function () {
            var devices, err_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.selectedSerial = selectedSerial;
                        return [4 /*yield*/, find()];
                    case 1:
                        devices = _a.sent();
                        console.log('findLocalServersBySerial...', this.selectedSerial, devices);
                        this.sendEvToWin(this.CLIENT_EVENTS.online_devices_changed, {
                            newHeadsetFound: false,
                            onlineHeadsetObj: null
                        });
                        /*
                        [
                          { name: '?', ip: '192.168.0.10', mac: '...' },
                        ]
                        */
                        devices.forEach(function (device) {
                            var host = device.ip;
                            var client = new Net.Socket();
                            _this.clients[host] = client;
                            // Create a new TCP client.
                            client.connect({ port: _this.port, host: host }, function () { _this.onConnect(client); });
                            client.on('data', function (chunk) { _this.onDataReceivedV1(chunk, client, _this.selectedSerial); });
                            client.on('end', function () { _this.onEnd(client); });
                            client.on('error', function (err) { _this.onError(err, client, host); });
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        err_2 = _a.sent();
                        console.log('findLocalServersBySerial. error..', this.selectedSerial, err_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    SocketClient.prototype.onEnd = function (_client) {
        // console.log('Requested an end to the TCP connection');
    };
    SocketClient.prototype.getWiFiIPAddress = function () {
        var nets = os_1.networkInterfaces();
        // const results = Object.create(null); // Or just '{}', an empty object
        for (var _i = 0, _a = Object.keys(nets); _i < _a.length; _i++) {
            var name_1 = _a[_i];
            for (var _b = 0, _c = nets[name_1]; _b < _c.length; _b++) {
                var net = _c[_b];
                // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                if (net.family === 'IPv4' && !net.internal) {
                    // if (!results[name]) {
                    //     results[name] = [];
                    // }
                    if (name_1 === 'Wi-Fi') {
                        return net.address;
                    }
                    // results[name].push(net.address);
                }
            }
        }
        // console.log(results)
        return '';
    };
    SocketClient.prototype.setFindingIntervalV2 = function () {
        var _this = this;
        this.findLocalServers(this.port);
        this.findingServerInterval = setTimeout(function () { return _this.setFindingIntervalV2(); }, 500);
    };
    SocketClient.prototype.setFindingIntervalV1 = function (selectedSerial) {
        var _this = this;
        this.connectedIP = null;
        this.findLocalServersBySerial(selectedSerial);
        this.findingServerInterval = timers_1.setInterval(function () { return _this.findLocalServersBySerial(selectedSerial); }, 5000);
        setTimeout(function () { return _this.clearFindingInterval(selectedSerial); }, 15000);
        this.sendEvToWin(this.CLIENT_EVENTS.finding_selected_headset, {
            msg: "We are trying to find this headset around...: " + selectedSerial,
            running: true,
            selectedSerial: selectedSerial
        });
    };
    SocketClient.prototype.onConnect = function (client) {
        // console.log('TCP connection established with the server...');
        // const requestObj = JSON.stringify({
        //   type: 'requestInfo',
        //   need: 'info'
        // });
        client.write('requestInfo');
    };
    SocketClient.prototype.onError = function (_err, client, host) {
        // console.log('connect error...', _err.stack);
        for (var i = 0; i < this.onlineHeadsets.length; i++) {
            if (this.onlineHeadsets[i].headsetIP == host.ip) {
                // console.log('REMOVING', this.onlineHeadsets[i]);
                this.sendEvToWin(this.CLIENT_EVENTS.online_devices_changed, {
                    newHeadsetFound: false,
                    onlineHeadsetObj: this.onlineHeadsets[i],
                });
                // console.log('-------------')
                this.onlineHeadsets.splice(i, 1);
            }
        }
        client.end();
    };
    SocketClient.prototype.onDataReceivedV2 = function (chunk, client, host) {
        // console.log(`Data received from the server: ${chunk.toString()}.`);
        var data = chunk.toString().split(' ');
        // const data = JSON.parse(chunk);
        // console.log(data);
        var receivedObj = {
            headsetIP: host.ip,
            headsetPort: host.port,
            headsetSerial: '',
            headsetModuleName: '',
            headsetName: '',
        };
        for (var i = 0; i < data.length; i++) {
            if (data[i] == 'headsetSerial') {
                receivedObj.headsetSerial = data[i + 1];
                var authorizedHeadset = this.authorizedHeadsets.some(function (el) { return el.serial == receivedObj.headsetSerial; });
                if (!authorizedHeadset) {
                    console.log('UNAUTHORIZED HEADSET', receivedObj.headsetSerial);
                    client.end();
                    return;
                }
                else {
                    var headsetIdx = this.authorizedHeadsets.findIndex(function (el) { return el.serial == receivedObj.headsetSerial; });
                    receivedObj.headsetName = this.authorizedHeadsets[headsetIdx].name;
                }
            }
            else if (data[i] == 'headsetModuleName') {
                receivedObj.headsetModuleName = data[i + 1];
            }
            else if (data[i] == 'gotServerUrl') {
                console.log('GOT IT ALREADY!');
                // client.end();
                return;
            }
        }
        if (receivedObj.headsetModuleName == '' || receivedObj.headsetSerial == '' || receivedObj.headsetName == '') {
            console.log(data);
            console.log(receivedObj);
            console.log('EMPTY STUFF');
            client.end();
            return;
        }
        // if ( data.type == 'info' && 'serial' in data && 'moduleName' in data ) {
        //   const authorizedHeadset = this.authorizedHeadsets.some(el => el.serial == data.serial);
        //   if ( authorizedHeadset ) {
        //     receivedObj = {
        //       headsetSerial: data.serial,
        //       headsetModuleName: data.moduleName,
        //       headsetIP: host.ip,
        //       headsetPort: host.port
        //     };
        //   } else {
        //     console.log('UNAUTHORIZED HEADSET', data.serial)
        //     client.end();
        //     return;
        //   }
        // } else {
        //   client.end();
        //   return;
        // }
        var found = false;
        if (this.onlineHeadsets.length != 0) {
            found = this.onlineHeadsets.some(function (el) { return 'headsetSerial' in el && el.headsetSerial == receivedObj.headsetSerial; });
        }
        if (!found) {
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
            var ipAddress = this.getWiFiIPAddress();
            if (ipAddress.length > 0) {
                client.write('IP ' + ipAddress);
            }
            else {
                console.log('WIFI IP WAS NOT FOUND!');
                client.end();
            }
        }
        else {
            // console.log('IGNOER');
        }
        // client.end();
        // console.log(this.onlineHeadsets);
    };
    SocketClient.prototype.onDataReceivedV1 = function (chunk, client, selectedSerial) {
        if (selectedSerial === void 0) { selectedSerial = null; }
        console.log("Data received from the server: " + chunk.toString() + ".");
        var data = chunk.toString().split(' ');
        if (data[0] === 'serial') {
            var serial = data[1];
            if (selectedSerial && serial === selectedSerial) {
                client.write('moduleName');
                this.sendEvToWin(this.CLIENT_EVENTS.finding_selected_headset, {
                    msg: "selected headset is available around you, and we are verifying the module '" + this.awaitingVrModuleToRun.moduleName + "'...",
                    running: true,
                    serial: serial
                });
            }
            else {
                // store SERIAL in dict (array)
            }
        }
        else if (data[0] === 'moduleName') {
            var moduleName = data[1];
            if (selectedSerial && moduleName === this.awaitingVrModuleToRun.packageName) {
                client.write('connect ' + ip.address());
                this.sendEvToWin(this.CLIENT_EVENTS.finding_selected_headset, {
                    msg: "The module '" + this.awaitingVrModuleToRun.moduleName + "' is verified now on the headset and the IP has sent to it.",
                    running: true, serial: selectedSerial
                });
            }
            else {
                // store MODULE_NAME in dict with SERIAL
            }
        }
        else if (data[0] === 'gotServerUrl') {
            this.headsetIsConnectedSuccessfully(client);
        }
    };
    SocketClient.prototype.clearFindingInterval = function (selectedSerial) {
        if (!this.findingServerInterval) {
            return;
        }
        clearInterval(this.findingServerInterval);
        this.findingServerInterval = null;
        this.endAllClientsConnections();
        this.sendEvToWin(this.CLIENT_EVENTS.finding_selected_headset, {
            msg: "Seems the headset is not around, we stopped the searching now: " + selectedSerial,
            running: false,
            selectedSerial: selectedSerial
        });
    };
    SocketClient.prototype.headsetIsConnectedSuccessfully = function (client) {
        this.connectedIP = client;
        this.clearFindingInterval(this.selectedSerial);
        this.sendEvToWin(this.CLIENT_EVENTS.offline_headset_ready, { ready: true, headsetDevice: { id: this.selectedSerial } });
        if (this.awaitingVrModuleToRun) {
            this.sendEvToWin(this.CLIENT_EVENTS.headset_module_ready, __assign({ ready: true, headsetDevice: { id: this.selectedSerial } }, this.awaitingVrModuleToRun));
            this.awaitingVrModuleToRun = null;
        }
    };
    SocketClient.prototype.endAllClientsConnections = function () {
        Object.values(this.clients).forEach(function (client) { return client.end(); });
        this.clients = {};
    };
    return SocketClient;
}());
module.exports.SocketClient = SocketClient;
//# sourceMappingURL=socket_client.js.map