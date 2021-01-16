"use strict";
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
var electron_1 = require("electron");
var autoUpdater = require('electron-updater').autoUpdater;
var path = require("path");
var url = require("url");
var fs = require("fs");
var internalIp = require("internal-ip");
var adb = require("adbkit");
var capcon = require("capture-console");
var log = require('electron-log');
var netLog = require('electron').netLog;
var Store = require('./store').Store;
var SocketClient = require('./socket_client').SocketClient;
var VrModuleRunner = require('./vr_module_runner').VrModuleRunner;
autoUpdater.logger = log;
var server = require('./server');
var modulesUpdate = require('./modules_update');
var desktopAutoUpdate = require('./auto_update');
var MAIN_EVENTS = {
    error: 'main-error',
    offline_headset_ready: 'offline-headset-ready',
    device_connected: 'device-connected',
    device_disconnected: 'device-disconnected',
    unauthorized_device_connected: 'unauthorized-device-connected',
    authorized_devices: 'authorized-devices',
    authorized_devices_changed: 'authorized-devices-changed',
    console_log: 'console-log',
    show_console_log: 'show-console-log',
    send_console_log: 'send-console-log',
    close_main_win: 'close-main-win',
    online_devices_changed: 'online-devices-changed',
};
var appVersion = electron_1.app.getVersion();
var client;
var colors = {
    error: 'red',
    info: 'turquoise',
    debug: 'gold',
    updates: 'lightskyblue'
};
var headsetDevice;
var authorizedHeadsets = [];
var win;
var consoleWin;
var logWinOpen = false;
var storeHelper;
var vrModuleRunnerHelper;
var socketClientHelper;
var logMsg = function (msg, type) {
    if (type === void 0) { type = 'debug'; }
    if (!consoleWin) {
        return;
    }
    msg = "[" + appVersion + "] " + msg;
    consoleWin.webContents.send(MAIN_EVENTS.console_log, { msg: msg, color: colors[type] });
};
var sendEvToWin = function (evName, options) {
    if (!win) {
        return;
    }
    win.webContents.send(evName, options);
};
electron_1.ipcMain.on(MAIN_EVENTS.authorized_devices, function (event, newAuthorizedHeadsets) {
    authorizedHeadsets = newAuthorizedHeadsets;
    headsetDevice = null;
    authorizeConnectedHeadsets();
    sendEvToWin(MAIN_EVENTS.authorized_devices_changed, authorizedHeadsets);
});
electron_1.ipcMain.on(MAIN_EVENTS.show_console_log, function (event, show) {
    if (!consoleWin) {
        console.log('IT HAS BEEN DESTROYED');
        createConsoleWindow();
    }
    console.log('CONSOLE SHOW STATUS', logWinOpen);
    if (logWinOpen) {
        consoleWin.hide();
    }
    else {
        consoleWin.show();
    }
    logWinOpen = !logWinOpen;
    // show ? consoleWin.show() : consoleWin.hide();
});
electron_1.ipcMain.on(MAIN_EVENTS.send_console_log, function (event, msg) {
    logMsg(msg, 'info');
});
electron_1.ipcMain.on(MAIN_EVENTS.close_main_win, function (event, msg) {
    console.log('close_main_win....');
    win.close();
});
electron_1.app.on('window-all-closed', function () {
    console.log('window-all-closed.....');
    server.closeLocalServer(logMsg);
    electron_1.app.quit();
});
electron_1.app.on('ready', initDesktopApp);
electron_1.app.on('activate', function () {
    if (win === null) {
        initDesktopApp();
    }
});
electron_1.app.on('will-quit', function () {
    console.log('will-quit....');
});
function initDesktopApp() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            setupLogging();
            createConsoleWindow();
            createNeededHelpers();
            createWindow();
            trackDevices();
            server.runLocalServer(logMsg);
            desktopAutoUpdate.SetupAutoUpdate(logMsg, sendEvToWin, storeHelper);
            modulesUpdate.checkModulesUpdate(logMsg, sendEvToWin);
            createIpFile();
            return [2 /*return*/];
        });
    });
}
function createWindow() {
    return __awaiter(this, void 0, void 0, function () {
        var mainWindowBounds;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, netLog.startLogging(log.transports.file.file)];
                case 1:
                    _a.sent();
                    mainWindowBounds = storeHelper.get('mainWindowBounds');
                    mainWindowBounds.webPreferences = { nodeIntegration: true };
                    mainWindowBounds.icon = path.join(__dirname, '/../../dist/vrapeutic-desktop/assets/icons/win/icon.png.png');
                    win = new electron_1.BrowserWindow(mainWindowBounds);
                    win.maximize();
                    win.show();
                    win.loadURL(url.format({
                        pathname: path.join(__dirname, "/../../dist/vrapeutic-desktop/index.html"),
                        protocol: 'file:',
                        slashes: true,
                    }));
                    // win.webContents.openDevTools();
                    win.on('closed', function () {
                        console.log('closed....');
                        if (consoleWin) {
                            consoleWin.close();
                        }
                        win = null;
                    });
                    win.on('resize', function () {
                        var _a = win.getBounds(), width = _a.width, height = _a.height;
                        mainWindowBounds.height = height;
                        mainWindowBounds.width = width;
                        storeHelper.set('mainWindowBounds', mainWindowBounds);
                    });
                    win.on('close', function (ev) {
                        console.log('will close....');
                        modulesUpdate.windowWillClose(ev);
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function createConsoleWindow() {
    var consoleWindowBounds = { width: 800, height: 600, show: false };
    consoleWindowBounds.webPreferences = { nodeIntegration: true };
    // consoleWindowBounds.parent = win;
    consoleWin = new electron_1.BrowserWindow(consoleWindowBounds);
    consoleWin.loadURL(url.format({
        pathname: path.join(__dirname, "/../../dist/vrapeutic-desktop/assets/views/console.html"),
        protocol: 'file:',
        slashes: true,
    }));
    consoleWin.on('closed', function () {
        console.log('consoleWin closed....');
        logWinOpen = false;
        consoleWin = null;
        // console.log('consoleWin null....');
    });
}
function createNeededHelpers() {
    createStoreHelper();
    vrModuleRunnerHelper = new VrModuleRunner({ logMsg: logMsg, sendEvToWin: sendEvToWin });
    socketClientHelper = new SocketClient({ logMsg: logMsg, sendEvToWin: sendEvToWin });
}
function createStoreHelper() {
    storeHelper = new Store({
        logMsg: logMsg,
        configName: 'user-preferences',
        defaults: {
            mainWindowBounds: { width: 800, height: 700, center: true, show: false }
        }
    });
}
function setupLogging() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // the first parameter here is the stream to capture, and the
            // second argument is the function receiving the output
            capcon.startCapture(process.stdout, function (msg) {
                logMsg(msg, 'debug');
            });
            capcon.startCapture(process.stdout, function (msg) {
                logMsg(msg, 'debug');
            });
            capcon.startCapture(process.stderr, function (msg) {
                logMsg(msg, 'error');
            });
            // let logger = require('logger-electron');
            // logger = new logger({ fileName: 'looger_log'});
            // logger.enableLogging();
            log.transports.console.format = '{h}:{i}:{s} {text}';
            log.transports.file.format = '{h}:{i}:{s}:{ms} {text}';
            // Set maximum log size in bytes. When it exceeds, old log will be saved
            // as log.old.log file
            log.transports.file.maxSize = 5 * 1024 * 1024;
            log.transports.file.file = path.join(electron_1.app.getPath('userData'), 'log.log');
            // fs.createWriteStream options, must be set before first logging
            log.transports.file.streamConfig = { flags: 'w' };
            // set existed file stream
            log.transports.file.stream = fs.createWriteStream(log.transports.file.file);
            // Sometimes it's helpful to use electron-log instead of default console
            console.log = log.log;
            log.transports.file.level = 'silly';
            return [2 /*return*/];
        });
    });
}
function trackDevices() {
    return __awaiter(this, void 0, void 0, function () {
        var tracker, err_1, msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('PLATFORM', process.platform);
                    if (process.platform !== 'win32') {
                        return [2 /*return*/, logMsg(process.platform, 'debug')];
                    }
                    console.log('START TRACKING');
                    client = adb.createClient();
                    console.log('ADB CLIENT', client);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, client.trackDevices()];
                case 2:
                    tracker = _a.sent();
                    console.log(tracker);
                    tracker.on('add', function (device) {
                        console.log('NEW DEVICE ADDED', device);
                        authorizeHeadsetDevice(device);
                    });
                    tracker.on('remove', function (device) {
                        console.log('DEVICE REMOVED', device);
                        headsetDevice = null;
                        sendEvToWin(MAIN_EVENTS.device_disconnected, device);
                    });
                    tracker.on('end', function () {
                        console.log('Tracking stopped');
                    });
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.log('Error in tracking devices..', err_1);
                    msg = 'Error...' + 'trackDevices' + JSON.stringify(err_1);
                    logMsg(msg, 'error');
                    sendEvToWin(MAIN_EVENTS.error, err_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function authorizeHeadsetDevice(device) {
    if (!authorizedHeadsets.includes(device.id)) {
        return sendEvToWin(MAIN_EVENTS.unauthorized_device_connected, device);
    }
    headsetDevice = device;
    sendEvToWin(MAIN_EVENTS.device_connected, device);
    setTimeout(function () {
        prepareHeadsetOnOfflineMode();
    }, 5000);
}
function authorizeConnectedHeadsets() {
    return __awaiter(this, void 0, void 0, function () {
        var devices;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (process.platform !== 'win32') {
                        return [2 /*return*/, logMsg(process.platform, 'debug')];
                    }
                    return [4 /*yield*/, client.listDevices()];
                case 1:
                    devices = _a.sent();
                    devices.forEach(function (device) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            // const fet = await client.getFeatures(device.id);
                            authorizeHeadsetDevice(device);
                            return [2 /*return*/];
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    });
}
function prepareHeadsetOnOfflineMode() {
    return __awaiter(this, void 0, void 0, function () {
        var msg, ipFile, transfer, err_2, msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (process.platform !== 'win32') {
                        return [2 /*return*/, logMsg(process.platform, 'debug')];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    if (!headsetDevice) {
                        msg = 'Error: No Authorized Headset connected!';
                        logMsg(msg, 'error');
                        return [2 /*return*/, sendEvToWin(MAIN_EVENTS.offline_headset_ready, { ready: false, headsetDevice: headsetDevice, err: 'No Authorized Headset connected!' })];
                    }
                    ipFile = createIpFile();
                    return [4 /*yield*/, client.push(headsetDevice.id, ipFile, '/sdcard/Download/ip.json')];
                case 2:
                    transfer = _a.sent();
                    transfer.once('end', function () {
                        sendEvToWin(MAIN_EVENTS.offline_headset_ready, { ready: true, headsetDevice: headsetDevice });
                    });
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    sendEvToWin(MAIN_EVENTS.offline_headset_ready, {
                        ready: false,
                        headsetDevice: headsetDevice,
                        err: err_2.message || 'ADB Failure: Something went wrong while pushing file to connected headset',
                    });
                    msg = 'Error...' + 'prepareHeadsetOnOfflineMode' + JSON.stringify(err_2);
                    logMsg(msg, 'error');
                    sendEvToWin(MAIN_EVENTS.error, err_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function createIpFile() {
    var ipInfo = { ip: internalIp.v4.sync() };
    var fileName = 'ip.json';
    storeHelper.writeUserFile(fileName, ipInfo);
    return storeHelper.getFullUserFilePath(fileName);
}
function isNetworkError(errorObject) {
    return errorObject.message === 'net::ERR_INTERNET_DISCONNECTED' ||
        errorObject.message === 'net::ERR_PROXY_CONNECTION_FAILED' ||
        errorObject.message === 'net::ERR_CONNECTION_RESET' ||
        errorObject.message === 'net::ERR_CONNECTION_CLOSE' ||
        errorObject.message === 'net::ERR_NAME_NOT_RESOLVED' ||
        errorObject.message === 'net::ERR_CONNECTION_TIMED_OUT';
}
//# sourceMappingURL=main.js.map