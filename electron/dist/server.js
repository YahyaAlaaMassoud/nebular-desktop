"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var shortid = require('shortid');
var express = require('express');
var app = express();
var Enum = require('enum');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server, {
    serveClient: false,
    // below are engine.IO options
    cookie: false
});
var PORT = 3000;
var localServer;
var openSockets = {};
// function logMsg(msg) {
//     console.log(msg);
// }
// logMsg('Server started on port ' + PORT);
var clients = {};
var maxDesktopConnections = 1;
var maxHeadsetConnections = 1;
var ClientType = {
    Desktop: 'Desktop',
    Headset: 'Headset'
};
exports.closeLocalServer = function (logMsg) {
    console.log('CLOSING SERVER');
    localServer.close();
    // Destroy all open sockets
    for (var socketId in openSockets) {
        console.log('socket', socketId, 'destroyed');
        openSockets[socketId].destroy();
    }
};
exports.runLocalServer = function (logMsg) {
    // this.logMsg = logFunction;
    localServer = server.listen(PORT, '0.0.0.0');
    console.log('starting Tachyon server at 0.0.0.0 @', PORT);
    io.on('connection', function (socket) {
        // console.log(socket)
        var clientId = shortid.generate();
        var client = {
            clientType: null,
            rejected: true,
            moduleName: null
        };
        openSockets[clientId] = socket;
        /* -----logging region----- */
        logMsg('+++++++++++++++++++++');
        logMsg('| client connected  |');
        logMsg('+++++++++++++++++++++');
        /* -----logging region----- */
        clients[clientId] = client;
        /* -----logging region----- */
        logMsg('registering client...');
        socket.emit('register', { id: clientId });
        /* -----logging region----- */
        /* -----logging region----- */
        logMsg('requesting module name...');
        socket.emit('requestModuleName');
        /* -----logging region----- */
        /* -----logging region----- */
        logMsg('requesting client type...');
        socket.emit('requestClientType');
        /* -----logging region----- */
        socket.on('updateClientType', function (clientData) {
            /* -----logging region----- */
            logMsg('------------------------------------------------->>');
            logMsg('updating client type...');
            logMsg("remaining desktop connections is: " + maxDesktopConnections);
            logMsg("remaining headset connections is: " + maxHeadsetConnections);
            /* -----logging region----- */
            client.clientType = clientData.clientType;
            if (client.clientType !== ClientType.Desktop && client.clientType !== ClientType.Headset) {
                /* -----logging region----- */
                logMsg(">>>>> client is being rejected!... <<<< " + client.clientType);
                /* -----logging region----- */
                client.rejected = true;
                socket.disconnect();
                return;
            }
            if (client.clientType === ClientType.Desktop) {
                if (maxDesktopConnections > 0) {
                    /* -----logging region----- */
                    logMsg('>>>> client Desktop accepted! <<<< ');
                    /* -----logging region----- */
                    client.rejected = false;
                    maxDesktopConnections--;
                }
                else {
                    /* -----logging region----- */
                    logMsg(">>>> rejecting Desktop connection... " + maxDesktopConnections);
                    socket.emit('connectionRejected');
                    client.rejected = true;
                    // socket.disconnect();
                    // return;
                }
            }
            if (client.clientType === ClientType.Headset) {
                if (maxHeadsetConnections > 0) {
                    /* -----logging region----- */
                    logMsg('>>>> client Headset accepted! <<<<');
                    /* -----logging region----- */
                    client.rejected = false;
                    maxHeadsetConnections--;
                }
                else {
                    /* -----logging region----- */
                    logMsg(">>>> rejecting Headset connection..." + maxHeadsetConnections);
                    /* -----logging region----- */
                    socket.emit('connectionRejected');
                    client.rejected = true;
                    // socket.disconnect();
                    // return;
                }
            }
            /* -----logging region----- */
            logMsg("remaining desktop connections is: " + maxDesktopConnections);
            logMsg("remaining headset connections is: " + maxHeadsetConnections);
            /* -----logging region----- */
            if (maxDesktopConnections === 0 && maxHeadsetConnections === 0) {
                var moduleName = client.moduleName;
                var roomReady = true;
                for (var _i = 0, _a = Object.entries(clients); _i < _a.length; _i++) {
                    var _b = _a[_i], _ = _b[0], value = _b[1];
                    if (value.rejected) {
                        continue;
                    }
                    roomReady = roomReady && (value.moduleName === moduleName);
                }
                /* -----logging region----- */
                logMsg('setting up room');
                /* -----logging region----- */
                if (roomReady) {
                    logMsg('devices are on same module');
                    io.sockets.emit('roomReady');
                }
                else {
                    logMsg('devices are on different modules');
                }
            }
            /* -----logging region----- */
            logMsg("Clients: " + JSON.stringify(clients));
            logMsg('<<--------------------------------');
            /* -----logging region----- */
        });
        socket.on('updateModuleName', function (clientData) {
            logMsg('---------------------------------->>');
            /* -----logging region----- */
            logMsg("updating module name..." + clientData.moduleName);
            /* -----logging region----- */
            client.moduleName = clientData.moduleName;
            logMsg('<<----------------------------------');
        });
        socket.on('disconnect', function () {
            logMsg('--------------------------------------------->>');
            logMsg("| disconnecting client....." + clientId);
            socket.broadcast.emit('clientDisconnected');
            if (client.clientType === ClientType.Desktop) {
                if (client.rejected === false) {
                    maxDesktopConnections++;
                }
            }
            else if (client.clientType === ClientType.Headset) {
                if (client.rejected === false) {
                    maxHeadsetConnections++;
                }
            }
            delete openSockets[clientId];
            delete clients[clientId];
            logMsg('------------------------------');
            logMsg("| clients left: " + clientId);
            logMsg('------------------------------');
            logMsg("remaining desktop connections is: " + maxDesktopConnections);
            logMsg("remaining headset connections is: " + maxHeadsetConnections);
            logMsg("Clients: " + JSON.stringify(clients));
            logMsg('<<----------------------------------------');
        });
        socket.on('fireFunction', function (data) {
            io.sockets.emit(data.functionName, data);
            logMsg(data.functionName + ' fired!');
        });
        socket.on('changeControllerRotation', function (data) {
            socket.broadcast.emit('updateControllerRotation' + data.controllerName, data);
            logMsg("changeControllerRotation::" + data.controllerName + ": " + JSON.stringify(data));
        });
        socket.on('changeControllerPosition', function (data) {
            socket.broadcast.emit('updateControllerPosition' + data.controllerName, data);
            logMsg("updateControllerPosition::" + data.controllerName + ": " + JSON.stringify(data));
        });
        // broadcast: https://github.com/socketio/socket.io/blob/master/docs/API.md#flag-broadcast
    });
};
//# sourceMappingURL=server.js.map