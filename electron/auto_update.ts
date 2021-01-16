
import { ipcMain, dialog } from 'electron';
const { autoUpdater } = require('electron-updater');
const baseFeedUrl = 'https://hazel-xi-seven.now.sh';

exports.SetupAutoUpdate = (logMsg, sendEvToWin, storeHelper) => {
  const UPDATES_EVENTS = {
  };

  function stopAskingToinstallToday() {
    const today = (new Date()).toLocaleDateString();
    logMsg('Remind me tomorrow for this update...' + today, 'info');
    storeHelper.set('stop_auto_update_install_today', today);
  }

  let platform: string = process.platform;
  if (platform.toLowerCase() === 'linux') {
    platform = 'AppImage';
  }

  // const feed: any = `${baseFeedUrl}/update/${platform}/${appVersion}`;
  // logMsg(feed, 'info');
  // autoUpdater.setFeedURL(feed);
  setTimeout(async () => {

    autoUpdater.on('checking-for-update', message => {
      logMsg('checking for update has been started...', 'info');
    });

    autoUpdater.on('update-available', message => {
      logMsg('There is an available update. The update is downloaded automatically.', 'info');
      logMsg(JSON.stringify(message), 'info');
    });

    autoUpdater.on('download-progress', message => {
      logMsg('download-progress....', 'info');
      logMsg(JSON.stringify(message), 'info');
    });

    autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
      const dialogOpts = {
        type: 'info',
        buttons: ['Restart', 'Later', 'Remind Me Tomorrow'],
        title: 'Application Update',
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: 'A new version has been downloaded. Restart the application to apply the updates.'
      };

      dialog.showMessageBox(dialogOpts).then((returnValue) => {
        const stopToday = storeHelper.get('stop_auto_update_install_today');
        if (returnValue.response === 2) { return stopAskingToinstallToday(); }
        if (returnValue.response === 0 && stopToday !== (new Date()).toLocaleDateString()) { autoUpdater.quitAndInstall(); }
      });
    });

    autoUpdater.on('before-quit-for-update', message => {
      logMsg('quit And Install...', 'info');
      logMsg(JSON.stringify(message), 'info');
    });

    autoUpdater.on('update-not-available', message => {
      logMsg('There is no available update.', 'info');
      logMsg(JSON.stringify(message), 'info');
    });

    autoUpdater.on('error', message => {
      logMsg('There was a problem updating the application', 'error');
      logMsg(JSON.stringify(message), 'error');
      // logMsg(autoUpdater.getFeedURL(), 'info');
      logMsg('info...' + JSON.stringify(autoUpdater.getUpdateInfoAndProvider()), 'info');
    });

    // logMsg(autoUpdater.getFeedURL(), 'info');
    logMsg('Check Done...' + JSON.stringify(await autoUpdater.checkForUpdatesAndNotify()), 'info');
    setInterval(async () => {
      logMsg('Check Done...' + JSON.stringify(await autoUpdater.checkForUpdatesAndNotify()), 'info');
    }, 60000 * 60);
  }, 60000);
};
