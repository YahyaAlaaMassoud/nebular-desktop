
import { ipcMain, dialog } from 'electron';
import * as path from 'path';
import { shell } from 'electron';
import * as adb from 'adbkit';

const { Store } = require('./store');

class VrModuleRunner {
  sendEvToWin;
  logMsg;
  client;
  MODULES_EVENTS = {
    error: 'main-error',
    run_module: 'run-module',
    desktop_module_deady: 'desktop-module-ready',
    install_android_module_to_headset: 'install-android-module-to-headset',
    installaling_android_module: 'installing-android-module',
    install_android_module_ready: 'install-android-module-ready'
  };

  constructor(opts) {
    this.logMsg = opts.logMsg;
    this.sendEvToWin = opts.sendEvToWin;
    this.SetupEventsListeners();
    this.client = adb.createClient();
  }

  SetupEventsListeners() {
    ipcMain.on(this.MODULES_EVENTS.run_module, (event, options) => {
      const modulePath = this.getStoredModuleData(options.moduleId).installation_dir;
      if (!modulePath) {
        return this.sendEvToWin(this.MODULES_EVENTS.desktop_module_deady, {
          ready: false, moduleName: options.moduleName,
          err: 'Looks like the module is not downloaded yet, please try again later.'
        });
      }
      this.startDesktopModule(options.moduleName, modulePath);
    });

    ipcMain.on(this.MODULES_EVENTS.install_android_module_to_headset, (event, options) => {
      const module = options.module;
      const modulePath = this.getStoredModuleData(module.id).installation_dir;
      console.log('modulePath', modulePath);
      if (!modulePath) {
        return this.sendEvToWin(this.MODULES_EVENTS.install_android_module_ready, {
          ready: false, module,
          err: 'We could not find the module to install it'
        });
      }
      this.pushAndroidModuleToHeadset(options, modulePath);
    });
  }

  startDesktopModule(moduleName, modulePath) {
    const moduleFilePath = path.join(modulePath, moduleName, `${moduleName}.exe`);
    try {
      const opened = shell.openExternal(moduleFilePath);
      this.sendEvToWin(this.MODULES_EVENTS.desktop_module_deady, { ready: opened, moduleName });
    } catch (err) {
      const msg = 'Error...' + 'startDesktopModule > ' + moduleFilePath + JSON.stringify(err);
      this.logMsg(msg, 'error');
      this.sendEvToWin(this.MODULES_EVENTS.desktop_module_deady, {
        ready: false, moduleName,
        err: 'We could not run the module!'
      });
    }
  }

  async pushAndroidModuleToHeadset(options, modulePath) {
    const module = options.module;
    const headset = options.headset;
    try {
      this.sendEvToWin(this.MODULES_EVENTS.installaling_android_module, {
        module, msg: 'Installing the android module...'
      });
      const moduleApkPath = path.join(modulePath, module.name, `${module.name}.apk`);
      await this.client.install(headset.id, moduleApkPath);
      this.sendEvToWin(this.MODULES_EVENTS.install_android_module_ready, {
        ready: true, module,
        msg: 'The android module is installed successfully'
      });
    } catch (err) {
      console.log(err);
      this.sendEvToWin(this.MODULES_EVENTS.install_android_module_ready, {
        ready: false, module,
        err: `Error while installing the android module: ${err.stack}`
      });
    }
  }

  getStoreData() {
    return new Store({
      logMsg: this.logMsg,
      configName: 'modules-versions',
      defaults: {}
    });
  }

  getStoredModuleData(moduleId) {
    const store = this.getStoreData();
    return store.get(moduleId.toString()) || {};
  }

}
module.exports.VrModuleRunner = VrModuleRunner;
