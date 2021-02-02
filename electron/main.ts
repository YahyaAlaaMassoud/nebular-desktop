import { app, BrowserWindow, ipcMain } from 'electron';
const { autoUpdater } = require('electron-updater');
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import * as internalIp from 'internal-ip';
import * as adb from 'adbkit';
import * as capcon from 'capture-console';
const log = require('electron-log');
const { netLog } = require('electron');
const { Store } = require('./store');
const { SocketClient } = require('./socket_client');
const { VrModuleRunner } = require('./vr_module_runner');

autoUpdater.logger = log;
const server = require('./server');
const modulesUpdate = require('./modules_update');
const desktopAutoUpdate = require('./auto_update');
const MAIN_EVENTS = {
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
  add_user_email: 'add-user-email',
  all_users_list_changed: 'all-users-list-changed',
  all_users_list_received: 'all-users-list-received'
};
const appVersion = app.getVersion();
let client;
const colors = {
  error: 'red',
  info: 'turquoise',
  debug: 'gold',
  updates: 'lightskyblue'
};

let headsetDevice;
let authorizedHeadsets = [];

let win: BrowserWindow;
let consoleWin: BrowserWindow;
let logWinOpen: boolean = false;
let sendAllUsersEmails: boolean = true;
let storeHelper: any;
let vrModuleRunnerHelper: any;
let socketClientHelper: any;
const logMsg = (msg, type = 'debug') => {
  if (!consoleWin) { return; }

  msg = `[${appVersion}] ${msg}`;
  consoleWin.webContents.send(MAIN_EVENTS.console_log, { msg, color: colors[type] });
};

const sendEvToWin = (evName, options) => {
  if (!win) { return; }

  win.webContents.send(evName, options);
};

ipcMain.on(MAIN_EVENTS.add_user_email, (event, userEmail) => {
  storeHelper.addUserToFile(userEmail);
})

ipcMain.on(MAIN_EVENTS.all_users_list_received, (event, data) => {
  sendAllUsersEmails = false
})

ipcMain.on(MAIN_EVENTS.authorized_devices, (event, newAuthorizedHeadsets) => {
  authorizedHeadsets = newAuthorizedHeadsets;
  headsetDevice = null;
  authorizeConnectedHeadsets();
  sendEvToWin(MAIN_EVENTS.authorized_devices_changed, authorizedHeadsets);
});

ipcMain.on(MAIN_EVENTS.show_console_log, (event, show) => {
  if ( !consoleWin ) {
    console.log('IT HAS BEEN DESTROYED');
    createConsoleWindow();
  }
  console.log('CONSOLE SHOW STATUS', logWinOpen)
  if ( logWinOpen ) {
    consoleWin.hide();
  } else {
    consoleWin.show();
  }
  logWinOpen = !logWinOpen;
  // show ? consoleWin.show() : consoleWin.hide();
});

ipcMain.on(MAIN_EVENTS.send_console_log, (event, msg) => {
  logMsg(msg, 'info');
});

ipcMain.on(MAIN_EVENTS.close_main_win, (event, msg) => {
  console.log('close_main_win....');
  console.log('closing server...')
  server.closeLocalServer(logMsg);
  win.close();
});

app.on('window-all-closed', () => {
  console.log('window-all-closed.....');
  console.log('closing server...')
  server.closeLocalServer(logMsg);
  app.quit();
});

app.on('ready', initDesktopApp);

app.on('activate', () => {
  if (win === null) {
    initDesktopApp();
  }
});

app.on('will-quit', () => {
  console.log('will-quit....');
});

async function initDesktopApp() {
  setupLogging();
  createConsoleWindow();
  createNeededHelpers();
  createWindow();
  trackDevices();
  server.runLocalServer(logMsg);
  desktopAutoUpdate.SetupAutoUpdate(logMsg, sendEvToWin, storeHelper);
  modulesUpdate.checkModulesUpdate(logMsg, sendEvToWin);
  createIpFile();
}

async function createWindow() {
  await netLog.startLogging(log.transports.file.file);

  const mainWindowBounds = storeHelper.get('mainWindowBounds');
  mainWindowBounds.webPreferences = { nodeIntegration: true };
  mainWindowBounds.icon = path.join(__dirname, '/../../dist/neb-desktop/assets/icons/win/icon.png.png');
  win = new BrowserWindow(mainWindowBounds);
  win.webContents.setZoomFactor(1.0);
  win.maximize();
  win.show();
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, `/../../dist/neb-desktop/index.html`),
      protocol: 'file:',
      slashes: true,
    })
  );

  // win.webContents.openDevTools();
  win.on('closed', () => {
    console.log('closed....');
    if (consoleWin) {
      consoleWin.close();
    }
    win = null;
  });

  win.on('resize', () => {
    const { width, height } = win.getBounds();
    mainWindowBounds.height = height;
    mainWindowBounds.width = width;
    storeHelper.set('mainWindowBounds', mainWindowBounds);
  });

  win.on('close', (ev) => {
    console.log('will close....');
    modulesUpdate.windowWillClose(ev);
  });

  sendUserEmails()
}

function sendUserEmails() {
  if ( sendAllUsersEmails ) {
    storeHelper.getUsersEmails();
    setTimeout(() => {
      sendUserEmails()
    }, 100);
  }
}

function createConsoleWindow() {
  const consoleWindowBounds: any = { width: 800, height: 600, show: false };
  consoleWindowBounds.webPreferences = { nodeIntegration: true };
  // consoleWindowBounds.parent = win;
  consoleWin = new BrowserWindow(consoleWindowBounds);
  consoleWin.loadURL(
    url.format({
      pathname: path.join(__dirname, `/../../dist/neb-desktop/assets/views/console.html`),
      protocol: 'file:',
      slashes: true,
    })
  );
  consoleWin.on('closed', () => {
    console.log('consoleWin closed....');
    logWinOpen = false;
    consoleWin = null;
    // console.log('consoleWin null....');
  });
}

function createNeededHelpers() {
  createStoreHelper();
  vrModuleRunnerHelper = new VrModuleRunner({ logMsg, sendEvToWin});
  socketClientHelper = new SocketClient({ logMsg, sendEvToWin });
}

function createStoreHelper() {
  storeHelper = new Store({
    logMsg: logMsg,
    configName: 'user-preferences',
    defaults: {
      mainWindowBounds: { width: 800, height: 700, center: true, show: false }
    },
    sendEvToWin: sendEvToWin
  });
}

async function setupLogging() {
  // the first parameter here is the stream to capture, and the
  // second argument is the function receiving the output
  capcon.startCapture(process.stdout, (msg) => {
    logMsg(msg, 'debug');
  });
  capcon.startCapture(process.stdout, (msg) => {
    logMsg(msg, 'debug');
  });

  capcon.startCapture(process.stderr, (msg) => {
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
  log.transports.file.file = path.join(app.getPath('userData'), 'log.log');
  // fs.createWriteStream options, must be set before first logging
  log.transports.file.streamConfig = { flags: 'w' };
  // set existed file stream
  log.transports.file.stream = fs.createWriteStream(log.transports.file.file);
  // Sometimes it's helpful to use electron-log instead of default console
  console.log = log.log;
  log.transports.file.level = 'silly';
}

async function trackDevices() {
  console.log('PLATFORM', process.platform);
  if (process.platform !== 'win32') { return logMsg(process.platform, 'debug'); }
  console.log('START TRACKING')
  client = adb.createClient();
  console.log('ADB CLIENT', client)
  try {
    const tracker = await client.trackDevices();
    console.log(tracker);
    tracker.on('add', (device) => {
      console.log('NEW DEVICE ADDED', device)
      authorizeHeadsetDevice(device);
    });
    tracker.on('remove', (device) => {
      console.log('DEVICE REMOVED', device)
      headsetDevice = null;
      sendEvToWin(MAIN_EVENTS.device_disconnected, device);
    });
    tracker.on('end', () => {
      console.log('Tracking stopped');
    });
  } catch (err) {
    console.log('Error in tracking devices..', err)
    const msg = 'Error...' + 'trackDevices' + JSON.stringify(err);
    logMsg(msg, 'error');

    sendEvToWin(MAIN_EVENTS.error, err);
  }
}

function authorizeHeadsetDevice(device) {

  if (!authorizedHeadsets.includes(device.id)) {
    return sendEvToWin(MAIN_EVENTS.unauthorized_device_connected, device);
  }

  headsetDevice = device;
  sendEvToWin(MAIN_EVENTS.device_connected, device);
  setTimeout(() => {
    prepareHeadsetOnOfflineMode();
  }, 5000);

}

async function authorizeConnectedHeadsets() {
  if (process.platform !== 'win32') { return logMsg(process.platform, 'debug'); }

  const devices = await client.listDevices();
  devices.forEach(async device => {
    // const fet = await client.getFeatures(device.id);
    authorizeHeadsetDevice(device);
  });

}

async function prepareHeadsetOnOfflineMode() {
  if (process.platform !== 'win32') { return logMsg(process.platform, 'debug'); }

  try {

    if (!headsetDevice) {
      const msg = 'Error: No Authorized Headset connected!';
      logMsg(msg, 'error');

      return sendEvToWin(
        MAIN_EVENTS.offline_headset_ready,
        { ready: false, headsetDevice, err: 'No Authorized Headset connected!' }
      );
    }
    const ipFile = createIpFile();
    const transfer = await client.push(headsetDevice.id, ipFile, '/sdcard/Download/ip.json');
    transfer.once('end', () => {
      sendEvToWin(MAIN_EVENTS.offline_headset_ready, { ready: true, headsetDevice });
    });

  } catch (err) {
    sendEvToWin(MAIN_EVENTS.offline_headset_ready, {
      ready: false, headsetDevice,
      err: err.message || 'ADB Failure: Something went wrong while pushing file to connected headset',
    });

    const msg = 'Error...' + 'prepareHeadsetOnOfflineMode' + JSON.stringify(err);
    logMsg(msg, 'error');
    sendEvToWin(MAIN_EVENTS.error, err);
  }
}

function createIpFile() {
  const ipInfo = { ip: internalIp.v4.sync() };
  const fileName = 'ip.json';
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
