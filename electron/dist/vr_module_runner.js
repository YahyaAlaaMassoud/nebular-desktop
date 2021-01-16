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
var electron_2 = require("electron");
var adb = require("adbkit");
var Store = require('./store').Store;
var VrModuleRunner = /** @class */ (function () {
    function VrModuleRunner(opts) {
        this.MODULES_EVENTS = {
            error: 'main-error',
            run_module: 'run-module',
            desktop_module_deady: 'desktop-module-ready',
            install_android_module_to_headset: 'install-android-module-to-headset',
            installaling_android_module: 'installing-android-module',
            install_android_module_ready: 'install-android-module-ready'
        };
        this.logMsg = opts.logMsg;
        this.sendEvToWin = opts.sendEvToWin;
        this.SetupEventsListeners();
        this.client = adb.createClient();
    }
    VrModuleRunner.prototype.SetupEventsListeners = function () {
        var _this = this;
        electron_1.ipcMain.on(this.MODULES_EVENTS.run_module, function (event, options) {
            var modulePath = _this.getStoredModuleData(options.moduleId).installation_dir;
            if (!modulePath) {
                return _this.sendEvToWin(_this.MODULES_EVENTS.desktop_module_deady, {
                    ready: false, moduleName: options.moduleName,
                    err: 'Looks like the module is not downloaded yet, please try again later.'
                });
            }
            _this.startDesktopModule(options.moduleName, modulePath);
        });
        electron_1.ipcMain.on(this.MODULES_EVENTS.install_android_module_to_headset, function (event, options) {
            var module = options.module;
            var modulePath = _this.getStoredModuleData(module.id).installation_dir;
            console.log('modulePath', modulePath);
            if (!modulePath) {
                return _this.sendEvToWin(_this.MODULES_EVENTS.install_android_module_ready, {
                    ready: false,
                    module: module,
                    err: 'We could not find the module to install it'
                });
            }
            _this.pushAndroidModuleToHeadset(options, modulePath);
        });
    };
    VrModuleRunner.prototype.startDesktopModule = function (moduleName, modulePath) {
        var moduleFilePath = path.join(modulePath, moduleName, moduleName + ".exe");
        try {
            var opened = electron_2.shell.openExternal(moduleFilePath);
            this.sendEvToWin(this.MODULES_EVENTS.desktop_module_deady, { ready: opened, moduleName: moduleName });
        }
        catch (err) {
            var msg = 'Error...' + 'startDesktopModule > ' + moduleFilePath + JSON.stringify(err);
            this.logMsg(msg, 'error');
            this.sendEvToWin(this.MODULES_EVENTS.desktop_module_deady, {
                ready: false,
                moduleName: moduleName,
                err: 'We could not run the module!'
            });
        }
    };
    VrModuleRunner.prototype.pushAndroidModuleToHeadset = function (options, modulePath) {
        return __awaiter(this, void 0, void 0, function () {
            var module, headset, moduleApkPath, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        module = options.module;
                        headset = options.headset;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        this.sendEvToWin(this.MODULES_EVENTS.installaling_android_module, {
                            module: module,
                            msg: 'Installing the android module...'
                        });
                        moduleApkPath = path.join(modulePath, module.name, module.name + ".apk");
                        return [4 /*yield*/, this.client.install(headset.id, moduleApkPath)];
                    case 2:
                        _a.sent();
                        this.sendEvToWin(this.MODULES_EVENTS.install_android_module_ready, {
                            ready: true,
                            module: module,
                            msg: 'The android module is installed successfully'
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        console.log(err_1);
                        this.sendEvToWin(this.MODULES_EVENTS.install_android_module_ready, {
                            ready: false,
                            module: module,
                            err: "Error while installing the android module: " + err_1.stack
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    VrModuleRunner.prototype.getStoreData = function () {
        return new Store({
            logMsg: this.logMsg,
            configName: 'modules-versions',
            defaults: {}
        });
    };
    VrModuleRunner.prototype.getStoredModuleData = function (moduleId) {
        var store = this.getStoreData();
        return store.get(moduleId.toString()) || {};
    };
    return VrModuleRunner;
}());
module.exports.VrModuleRunner = VrModuleRunner;
//# sourceMappingURL=vr_module_runner.js.map