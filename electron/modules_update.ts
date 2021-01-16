
import { ipcMain, dialog } from 'electron';
import * as path from 'path';

const { Store } = require('./store');
const UPDATES_EVENTS = {
  reset_all_installed_modules: 'reset-all-installed-modules',
  reset_installed_module: 'reset-installed-module',
  module_latest_version: 'module-latest-version',
  new_module_version_available_to_download: 'new-module-version-available-to-download',
  new_module_version_available_to_install: 'new-module-version-available-to-install',
  download_new_module_version: 'download-new-module-version',
  install_new_module_version: 'install-new-module-version',
  module_version_size: 'module-version-size',
  module_version_downloading_progress: 'module-version-downloading-progress',
  module_version_downloaded: 'module-version-downloaded',
  module_version_installed: 'module-version-installed',
  module_version_pause_downloading: 'module-version-pause-downloading',
  module_version_resume_downloading: 'module-version-resume-downloading',
  module_version_cancel_downloading: 'module-version-cancel-downloading',
  module_version_download_error: 'module-version-download-error',
  module_version_install_error: 'module-version-install-error',
  close_main_win: 'close-main-win'
};

let store;
let sendEvToWin;
let logMsg;
const modulesDir = 'modules';
const modulesResponses = {};

const showDialog = async (title, message, detail, buttons = ['Ok']) => {
  const dialogOpts = {
    type: 'info', buttons, title, message, detail
  };
  const returnValue = await dialog.showMessageBox(dialogOpts);
  return returnValue.response;
};

const checkRunningUpdates = () => {
  return store.getAllValues().some((moduleVersion: any) => moduleVersion.downloading);
};

const cancelDownloadinModuleUpdates = (moduleVersion, versionId = null) => {
  if (!moduleVersion || !moduleVersion.downloading) { return; }

  if (versionId) { modulesResponses[versionId].pause(); }
  store.removeFile(moduleVersion.downloading);
  moduleVersion.downloading = null;
  store.set(moduleVersion.vr_module_id, moduleVersion);
};

const ignoreRunningUpdates = () => {
  const currenModulesVersions: any[] = store.getAllValues();
  currenModulesVersions.filter((moduleVersion: any) => moduleVersion.downloading ).forEach((moduleVersion: any) => {
    cancelDownloadinModuleUpdates(moduleVersion);
  });
};

const informUserWithRunningUpdates = async () => {
  const response = await showDialog(
    'Running Updating',
    'Some of your modules still updating',
    '',
    ['Quit', 'Continue Updating']);
  if (response === 0) {
    ignoreRunningUpdates();
    ipcMain.emit(UPDATES_EVENTS.close_main_win);
  }
};

exports.checkModulesUpdate = (logMsgFn, sendEvToWinFn) => {
  sendEvToWin = sendEvToWinFn;
  logMsg = logMsgFn;
  store = new Store({
    logMsg,
    configName: 'modules-versions',
    defaults: {}
  });
  SetupEventsListeners();
};

exports.windowWillClose = (ev) => {
  if (checkRunningUpdates()) {
    console.log('close preventDefault....');
    ev.preventDefault();
    informUserWithRunningUpdates();
  }
};

function getModulePath(moduleID) {
  return  path.join(
    modulesDir, moduleID.toString()
  );
}

function compareModuleVersions(latestVesionData) {
  const currentVersionData = store.get(latestVesionData.vr_module_id) || {};
  if (currentVersionData.downloading) { return; }
  if (currentVersionData.id === latestVesionData.id && currentVersionData.installed) { return; }
  if (currentVersionData.id === latestVesionData.id && currentVersionData.downloaded) {
    return sendEvToWin(UPDATES_EVENTS.new_module_version_available_to_install, currentVersionData);
  }

  logMsg(`You don't have the latest version.... ${JSON.stringify(currentVersionData)}`, 'updates');
  sendEvToWin(UPDATES_EVENTS.new_module_version_available_to_download, latestVesionData);
}

function downloadNewVersion(latestVesionData) {
  logMsg(`Will download..... ${latestVesionData.name}`, 'updates');
  const moduleId = latestVesionData.vr_module_id;
  const currentVersionData = store.get(moduleId) || { vr_module_id: moduleId};
  const downoadCB = {
    cb: downloadNewVersionDoneCallback, cbOptions: latestVesionData,
    responseCB: downloadResponseCallback
  };
  const downloadPath = path.join(
    getModulePath(latestVesionData.vr_module_id), latestVesionData.name
  );
  console.log('Downloading from URL', latestVesionData.build.url);
  console.log('Downloading at', downloadPath)
  currentVersionData.downloading = store.downloadV2(latestVesionData.build.url, downloadPath, downoadCB);
  store.set(moduleId, currentVersionData);
}

function downloadResponseCallback(res, versionData) {
  versionData.size = parseInt(res.headers['content-length'], 10);

  sendEvToWin(UPDATES_EVENTS.module_version_size, versionData);
  modulesResponses[versionData.id] = res;

  res.on('data', chunk => {
    versionData.data = chunk.length;
    sendEvToWin(UPDATES_EVENTS.module_version_downloading_progress, versionData);
  });
  res.on('end', () => {
    logMsg(`end res..... ${versionData.name}`, 'updates');
  });
}

function downloadNewVersionDoneCallback(downloadedFile, versionData) {
  if (!downloadedFile) {
    return versionDownloadError(versionData);
  }

  versionData.downloaded = true;
  versionData.downloaded_file = downloadedFile;
  sendEvToWin(UPDATES_EVENTS.module_version_downloaded, versionData);
  store.set(versionData.vr_module_id, versionData);
  installDownloadedVersion(versionData);
}

function installDownloadedVersion(versionData) {
  if (!versionData.downloaded_file) { return logMsg('No file to install..', 'error'); }

  logMsg(`will install..... ${versionData.name}`, 'updates');
  const installCB = {
    cb: versionInstallCallback, 
    cbOptions: versionData
  };
  store.unzipFile(versionData.downloaded_file, installCB);
}

function versionInstallCallback(unzipedDir, versionData) {
  if (!unzipedDir) {
    logMsg('Version is not installed..', 'error'); 
    return versionInstallError(versionData);
  }

  versionData.installed = true;
  versionData.installation_dir = unzipedDir;
  store.set(versionData.vr_module_id, versionData);
  sendEvToWin(UPDATES_EVENTS.module_version_installed, versionData);
}

function versionDownloadError(versionData) {
  logMsg('Version is not downloaded..', 'error');
  const moduleId = versionData.vr_module_id;
  const currentVersionData = store.get(moduleId);
  currentVersionData.downloading = null;
  store.set(moduleId, currentVersionData);
  sendEvToWin(UPDATES_EVENTS.module_version_download_error, versionData);
}

function versionInstallError(versionData) {
  sendEvToWin(UPDATES_EVENTS.module_version_install_error, versionData);
}

function SetupEventsListeners() {

  ipcMain.on(UPDATES_EVENTS.reset_all_installed_modules, (event) => {
    if (checkRunningUpdates()) { return; }

    store.removeDir(modulesDir);
    store.resetDefaults({});
  });

  ipcMain.on(UPDATES_EVENTS.reset_installed_module, (event, moduleId) => {
    store.removeDir(getModulePath(moduleId));
    store.set(moduleId, {});
  });

  ipcMain.on(UPDATES_EVENTS.module_latest_version, (event, latestVesionData) => {
    if (!latestVesionData) { return; }

    compareModuleVersions(latestVesionData);
  });

  ipcMain.on(UPDATES_EVENTS.download_new_module_version, (event, latestVesionData) => {
    if (!latestVesionData) { return; }

    downloadNewVersion(latestVesionData);
  });

  ipcMain.on(UPDATES_EVENTS.install_new_module_version, (event, latestVesionData) => {
    if (!latestVesionData) { return; }
    const currentVersionData = store.get(latestVesionData.vr_module_id) || {};

    installDownloadedVersion(currentVersionData);
  });

  ipcMain.on(UPDATES_EVENTS.module_version_pause_downloading, (event, versionData) => {
    if (!versionData || !modulesResponses[versionData.id]) { return; }

    modulesResponses[versionData.id].pause();
  });

  ipcMain.on(UPDATES_EVENTS.module_version_resume_downloading, (event, versionData) => {
    if (!versionData || !modulesResponses[versionData.id]) { return; }

    modulesResponses[versionData.id].resume();
  });

  ipcMain.on(UPDATES_EVENTS.module_version_cancel_downloading, (event, versionData) => {
    if (!versionData || !modulesResponses[versionData.id]) { return; }

    cancelDownloadinModuleUpdates(store.get(versionData.vr_module_id), versionData.id);
  });
}
