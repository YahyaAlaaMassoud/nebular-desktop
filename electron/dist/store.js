"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var fs = require("fs");
var request = require("request");
var unzipper = require("unzipper");
var path = require("path");
var http = require("http");
var rimraf = require("rimraf");
var Store = /** @class */ (function () {
    function Store(opts) {
        // Renderer process has to get `app` module via `remote.app`, whereas the main process can get it directly
        // app.getPath('userData') will return a string of the user's app data directory path.
        this.log = opts.logMsg;
        this.userDataPath = electron_1.app.getPath('userData');
        console.log('userDataPath', this.userDataPath);
        // We'll use the `configName` property to set the file name and path.join to bring it all together as a string
        this.configPath = path.join(this.userDataPath, opts.configName + '.json');
        console.log('configPath', this.configPath);
        this.data = this.parseDataFile(this.configPath, opts.defaults);
        this.log("Saved Data is loaded... " + JSON.stringify(this.data));
    }
    // This will just return the property on the `data` object
    Store.prototype.get = function (key) {
        return this.data[key];
    };
    // ...and this will set it
    Store.prototype.set = function (key, val) {
        this.data[key] = val;
        // Wait, I thought using the node.js' synchronous APIs was bad form?
        // We're not writing a server so there's not nearly the same IO demand on the process
        // Also if we used an async API and our app was quit before the asynchronous write had a chance to complete,
        // we might lose that data. Note that in a real app, we would try/catch this.
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.data));
        }
        catch (err) {
            console.log(err);
        }
    };
    Store.prototype.getAllKeys = function () {
        return Object.keys(this.data);
    };
    Store.prototype.getAllValues = function () {
        return Object.values(this.data);
    };
    Store.prototype.resetDefaults = function (defaults) {
        this.data = defaults;
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.data));
        }
        catch (err) {
            console.log(err);
        }
    };
    Store.prototype.writeUserFile = function (filePath, data) {
        var userFilePath = path.join(this.userDataPath, filePath);
        fs.writeFileSync(userFilePath, JSON.stringify(data));
    };
    Store.prototype.getFullUserFilePath = function (filePath) {
        return path.join(this.userDataPath, filePath);
    };
    Store.prototype.downloadV2 = function (url, dest, options, ext) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (ext === void 0) { ext = 'zip'; }
        var destPath = path.join(this.userDataPath, (dest + '.' + ext));
        try {
            this.ensureDirExist(destPath);
            this.log("Try Downloading... " + destPath, 'info');
            var file_1 = fs.createWriteStream(destPath, { mode: 511 });
            file_1.on('open', function (fd) {
                request.get({
                    url: url,
                })
                    .on('response', function (res) {
                    if (options.responseCB) {
                        options.responseCB(res, options.cbOptions);
                    }
                })
                    .on('error', function (err) {
                    if (err.code === 'ETIMEDOUT') {
                        console.log("Timeout!");
                    }
                    destPath = null;
                    console.log('error happened', err);
                    _this.log("Downloading request Error... " + JSON.stringify(err), 'error');
                    _this.removeFile(dest); // Delete the file async. (But we don't check the result)
                    if (options.cb) {
                        options.cb(false, options.cbOptions);
                    }
                })
                    .pipe(file_1);
            });
            file_1.on('finish', function () {
                _this.log("Downloading Done... " + destPath, 'info');
                file_1.on('close', function () {
                    if (options.cb) {
                        options.cb(destPath, options.cbOptions);
                    }
                });
                file_1.close(); // close() is async, call cb after close completes.
            });
            return destPath;
        }
        catch (err) {
            destPath = null;
            console.log('error happened', err);
            this.log("Downloading Error... " + JSON.stringify(err));
            if (options.cb) {
                options.cb(false, options.cbOptions);
            }
        }
    };
    Store.prototype.download = function (url, dest, options, ext) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (ext === void 0) { ext = 'zip'; }
        var destPath = path.join(this.userDataPath, (dest + '.' + ext));
        try {
            this.ensureDirExist(destPath);
            this.log("Try Downloading... " + destPath, 'info');
            var file_2 = fs.createWriteStream(destPath, { mode: 511 });
            // You shouldn't call write on your tempFile write stream until you've received the 'open' event from the stream.
            // The file won't exist until you see that event.
            file_2.on('open', function (fd) {
                var req = http.get(url, function (response) {
                    response.pipe(file_2);
                    if (options.responseCB) {
                        options.responseCB(response, options.cbOptions);
                    }
                    file_2.on('finish', function () {
                        _this.log("Downloading Done... " + destPath, 'info');
                        file_2.on('close', function () {
                            if (options.cb) {
                                options.cb(destPath, options.cbOptions);
                            }
                        });
                        file_2.close(); // close() is async, call cb after close completes.
                    });
                }).on('error', function (err) {
                    destPath = null;
                    console.log('error happened', err);
                    _this.log("Downloading request Error... " + JSON.stringify(err), 'error');
                    _this.removeFile(dest); // Delete the file async. (But we don't check the result)
                    if (options.cb) {
                        options.cb(false, options.cbOptions);
                    }
                }).on('end', function (en) {
                    console.log('req end...', en);
                }).on('abort', function (en) {
                    console.log('req abort...', en);
                }).on('timeout', function (en) {
                    console.log('req timeout...', en);
                });
            });
            return destPath;
        }
        catch (err) {
            destPath = null;
            console.log('error happened', err);
            this.log("Downloading Error... " + JSON.stringify(err));
            if (options.cb) {
                options.cb(false, options.cbOptions);
            }
        }
    };
    Store.prototype.unzipFile = function (targetFile, options) {
        if (options === void 0) { options = {}; }
        var dist = options.dist || path.dirname(targetFile);
        fs.createReadStream(targetFile)
            .pipe(unzipper.Extract({ path: dist }))
            .on('close', function () {
            if (options.cb) {
                options.cb(dist, options.cbOptions);
            }
        }).on('error', function () {
            if (options.cb) {
                options.cb(false, options.cbOptions);
            }
        });
    };
    Store.prototype.ensureDirExist = function (filePath) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
    };
    Store.prototype.removeDir = function (dirName) {
        var dirPath = path.join(this.userDataPath, dirName);
        rimraf.sync(dirPath);
    };
    Store.prototype.moveDir = function (oldPath, newPath) {
        fs.renameSync(oldPath, newPath);
    };
    Store.prototype.removeFile = function (filePath) {
        fs.unlink(filePath, this.log); // Delete the file async. (But we don't check the result)
    };
    Store.prototype.parseDataFile = function (filePath, defaults) {
        // We'll try/catch it in case the file doesn't exist yet, which will be the case on the first application run.
        // `fs.readFileSync` will return a JSON string which we then parse into a Javascript object
        this.log("Will try to load Data... " + filePath);
        try {
            var content = fs.readFileSync(filePath);
            return JSON.parse(content);
        }
        catch (error) {
            // if there was some kind of error, return the passed in defaults instead.
            this.log("File not found... " + filePath, 'debug');
            return defaults;
        }
    };
    return Store;
}());
// expose the class
module.exports.Store = Store;
//# sourceMappingURL=store.js.map