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
var path = require("path");
var Store = require('./store').Store;
var UPDATES_EVENTS = {
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
var store;
var sendEvToWin;
var logMsg;
var modulesDir = 'modules';
var modulesResponses = {};
var showDialog = function (title, message, detail, buttons) {
    if (buttons === void 0) { buttons = ['Ok']; }
    return __awaiter(void 0, void 0, void 0, function () {
        var dialogOpts, returnValue;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dialogOpts = {
                        type: 'info',
                        buttons: buttons, title: title, message: message, detail: detail
                    };
                    return [4 /*yield*/, electron_1.dialog.showMessageBox(dialogOpts)];
                case 1:
                    returnValue = _a.sent();
                    return [2 /*return*/, returnValue.response];
            }
        });
    });
};
var checkRunningUpdates = function () {
    return store.getAllValues().some(function (moduleVersion) { return moduleVersion.downloading; });
};
var cancelDownloadinModuleUpdates = function (moduleVersion, versionId) {
    if (versionId === void 0) { versionId = null; }
    if (!moduleVersion || !moduleVersion.downloading) {
        return;
    }
    if (versionId) {
        modulesResponses[versionId].pause();
    }
    store.removeFile(moduleVersion.downloading);
    moduleVersion.downloading = null;
    store.set(moduleVersion.vr_module_id, moduleVersion);
};
var ignoreRunningUpdates = function () {
    var currenModulesVersions = store.getAllValues();
    currenModulesVersions.filter(function (moduleVersion) { return moduleVersion.downloading; }).forEach(function (moduleVersion) {
        cancelDownloadinModuleUpdates(moduleVersion);
    });
};
var informUserWithRunningUpdates = function () { return __awaiter(void 0, void 0, void 0, function () {
    var response;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, showDialog('Running Updating', 'Some of your modules still updating', '', ['Quit', 'Continue Updating'])];
            case 1:
                response = _a.sent();
                if (response === 0) {
                    ignoreRunningUpdates();
                    electron_1.ipcMain.emit(UPDATES_EVENTS.close_main_win);
                }
                return [2 /*return*/];
        }
    });
}); };
exports.checkModulesUpdate = function (logMsgFn, sendEvToWinFn) {
    sendEvToWin = sendEvToWinFn;
    logMsg = logMsgFn;
    store = new Store({
        logMsg: logMsg,
        configName: 'modules-versions',
        defaults: {}
    });
    SetupEventsListeners();
};
exports.windowWillClose = function (ev) {
    if (checkRunningUpdates()) {
        console.log('close preventDefault....');
        ev.preventDefault();
        informUserWithRunningUpdates();
    }
};
function getModulePath(moduleID) {
    return path.join(modulesDir, moduleID.toString());
}
function compareModuleVersions(latestVesionData) {
    var currentVersionData = store.get(latestVesionData.vr_module_id) || {};
    if (currentVersionData.downloading) {
        return;
    }
    if (currentVersionData.id === latestVesionData.id && currentVersionData.installed) {
        return;
    }
    if (currentVersionData.id === latestVesionData.id && currentVersionData.downloaded) {
        return sendEvToWin(UPDATES_EVENTS.new_module_version_available_to_install, currentVersionData);
    }
    logMsg("You don't have the latest version.... " + JSON.stringify(currentVersionData), 'updates');
    sendEvToWin(UPDATES_EVENTS.new_module_version_available_to_download, latestVesionData);
}
function downloadNewVersion(latestVesionData) {
    logMsg("Will download..... " + latestVesionData.name, 'updates');
    var moduleId = latestVesionData.vr_module_id;
    var currentVersionData = store.get(moduleId) || { vr_module_id: moduleId };
    var downoadCB = {
        cb: downloadNewVersionDoneCallback, cbOptions: latestVesionData,
        responseCB: downloadResponseCallback
    };
    var downloadPath = path.join(getModulePath(latestVesionData.vr_module_id), latestVesionData.name);
    console.log('Downloading from URL', latestVesionData.build.url);
    console.log('Downloading at', downloadPath);
    currentVersionData.downloading = store.downloadV2(latestVesionData.build.url, downloadPath, downoadCB);
    store.set(moduleId, currentVersionData);
}
function downloadResponseCallback(res, versionData) {
    versionData.size = parseInt(res.headers['content-length'], 10);
    sendEvToWin(UPDATES_EVENTS.module_version_size, versionData);
    modulesResponses[versionData.id] = res;
    res.on('data', function (chunk) {
        versionData.data = chunk.length;
        sendEvToWin(UPDATES_EVENTS.module_version_downloading_progress, versionData);
    });
    res.on('end', function () {
        logMsg("end res..... " + versionData.name, 'updates');
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
    if (!versionData.downloaded_file) {
        return logMsg('No file to install..', 'error');
    }
    logMsg("will install..... " + versionData.name, 'updates');
    var installCB = {
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
    var moduleId = versionData.vr_module_id;
    var currentVersionData = store.get(moduleId);
    currentVersionData.downloading = null;
    store.set(moduleId, currentVersionData);
    sendEvToWin(UPDATES_EVENTS.module_version_download_error, versionData);
}
function versionInstallError(versionData) {
    sendEvToWin(UPDATES_EVENTS.module_version_install_error, versionData);
}
function SetupEventsListeners() {
    electron_1.ipcMain.on(UPDATES_EVENTS.reset_all_installed_modules, function (event) {
        if (checkRunningUpdates()) {
            return;
        }
        store.removeDir(modulesDir);
        store.resetDefaults({});
    });
    electron_1.ipcMain.on(UPDATES_EVENTS.reset_installed_module, function (event, moduleId) {
        store.removeDir(getModulePath(moduleId));
        store.set(moduleId, {});
    });
    electron_1.ipcMain.on(UPDATES_EVENTS.module_latest_version, function (event, latestVesionData) {
        if (!latestVesionData) {
            return;
        }
        compareModuleVersions(latestVesionData);
    });
    electron_1.ipcMain.on(UPDATES_EVENTS.download_new_module_version, function (event, latestVesionData) {
        if (!latestVesionData) {
            return;
        }
        downloadNewVersion(latestVesionData);
    });
    electron_1.ipcMain.on(UPDATES_EVENTS.install_new_module_version, function (event, latestVesionData) {
        if (!latestVesionData) {
            return;
        }
        var currentVersionData = store.get(latestVesionData.vr_module_id) || {};
        installDownloadedVersion(currentVersionData);
    });
    electron_1.ipcMain.on(UPDATES_EVENTS.module_version_pause_downloading, function (event, versionData) {
        if (!versionData || !modulesResponses[versionData.id]) {
            return;
        }
        modulesResponses[versionData.id].pause();
    });
    electron_1.ipcMain.on(UPDATES_EVENTS.module_version_resume_downloading, function (event, versionData) {
        if (!versionData || !modulesResponses[versionData.id]) {
            return;
        }
        modulesResponses[versionData.id].resume();
    });
    electron_1.ipcMain.on(UPDATES_EVENTS.module_version_cancel_downloading, function (event, versionData) {
        if (!versionData || !modulesResponses[versionData.id]) {
            return;
        }
        cancelDownloadinModuleUpdates(store.get(versionData.vr_module_id), versionData.id);
    });
}
//# sourceMappingURL=modules_update.js.map