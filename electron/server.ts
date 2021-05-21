import { powerSaveBlocker } from "electron";

const shortid = require('shortid');
const express = require('express');
const app = express();
const Enum = require('enum');

const server = require('http').createServer(app);
const io = require('socket.io').listen(server, {
    serveClient: false,
    // below are engine.IO options
    cookie: false
});
const PORT = 3000;
var localServer;
var openSockets = {};

// function logMsg(msg) {
//     console.log(msg);
// }
// logMsg('Server started on port ' + PORT);
let clients: object = {};
let maxDesktopConnections = 1;
let maxHeadsetConnections = 1;
let ClientType = {
    Desktop: 'Desktop',
    Headset: 'Headset'
};

exports.closeLocalServer = (logMsg) => {
    try { 
        console.log('CLOSING SERVER')
        localServer.close();
        // Destroy all open sockets
        for (var socketId in openSockets) {
            console.log('socket', socketId, 'destroyed');
            openSockets[socketId].destroy();
        }
    } catch {
        console.log('something went wrong when trying to close the server')
    }
}

exports.runLocalServer = (logMsg) => {
    // this.logMsg = logFunction;
    localServer = server.listen(PORT, '0.0.0.0');
    console.log('starting Tachyon server at 0.0.0.0 @', PORT);
    io.on('connection', (socket) => {
        // console.log(socket)
        const clientId = shortid.generate();
        const client = {
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


        socket.on('updateClientType', (clientData) => {
            /* -----logging region----- */
            logMsg('------------------------------------------------->>');
            logMsg('updating client type...');
            logMsg(`remaining desktop connections is: ${maxDesktopConnections}`);
            logMsg(`remaining headset connections is: ${maxHeadsetConnections}`);
            /* -----logging region----- */

            client.clientType = clientData.clientType;

            if (client.clientType !== ClientType.Desktop && client.clientType !== ClientType.Headset) {
                /* -----logging region----- */
                logMsg(`>>>>> client is being rejected!... <<<< ${client.clientType}`);
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
                } else {
                    /* -----logging region----- */
                    logMsg(`>>>> rejecting Desktop connection... ${maxDesktopConnections}`);
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
                } else {
                    /* -----logging region----- */
                    logMsg(`>>>> rejecting Headset connection...${maxHeadsetConnections}`);
                    /* -----logging region----- */

                    socket.emit('connectionRejected');
                    client.rejected = true;
                    // socket.disconnect();
                    // return;
                }
            }

            /* -----logging region----- */
            logMsg(`remaining desktop connections is: ${maxDesktopConnections}`);
            logMsg(`remaining headset connections is: ${maxHeadsetConnections}`);
            /* -----logging region----- */

            if (maxDesktopConnections === 0 && maxHeadsetConnections === 0) {

                const moduleName = client.moduleName;
                let roomReady = true;
                for (const [_, value] of Object.entries(clients)) {
                    if (value.rejected) { continue; }

                    roomReady = roomReady && (value.moduleName === moduleName);
                }

                /* -----logging region----- */
                logMsg('setting up room');
                /* -----logging region----- */

                if (roomReady) {
                    logMsg('devices are on same module');
                    io.sockets.emit('roomReady');
                } else {
                    logMsg('devices are on different modules');
                }
            }

            /* -----logging region----- */
            logMsg(`Clients: ${JSON.stringify(clients)}`);
            logMsg('<<--------------------------------');
            /* -----logging region----- */
        });

        socket.on('updateModuleName', (clientData) => {
            logMsg('---------------------------------->>');
            /* -----logging region----- */
            logMsg(`updating module name...${clientData.moduleName}`);
            /* -----logging region----- */
            client.moduleName = clientData.moduleName;
            logMsg('<<----------------------------------');
        });

        socket.on('disconnect', () => {
            logMsg('--------------------------------------------->>');
            logMsg(`| disconnecting client.....${clientId}`);
            socket.broadcast.emit('clientDisconnected');

            if (client.clientType === ClientType.Desktop) {
                if (client.rejected === false) {
                    maxDesktopConnections++;
                }
            } else if (client.clientType === ClientType.Headset) {
                if (client.rejected === false) {
                    maxHeadsetConnections++;
                }
            }

            delete openSockets[clientId];
            delete clients[clientId];

            logMsg('------------------------------');
            logMsg(`| clients left: ${clientId}`);
            logMsg('------------------------------');
            logMsg(`remaining desktop connections is: ${maxDesktopConnections}`);
            logMsg(`remaining headset connections is: ${maxHeadsetConnections}`);
            logMsg(`Clients: ${JSON.stringify(clients)}`);
            logMsg('<<----------------------------------------');
        });

        socket.on('fireFunction', (data) => {
            io.sockets.emit(data.functionName, data);
            logMsg(data.functionName + ' fired!');
        });

        socket.on('registerControllerRotation', (data) => {
            // console.log('registering rotation for ' + data.controllerName);
            socket.on(data.controllerName + 'Rotation', justSyncControllerRotation);
            logMsg(`registerControllerRotation::${data.controllerName}: ${JSON.stringify(data)}`);
        });
    
        const justSyncControllerRotation = (data) => {
            // console.log('Controller Rotation', data);
            socket.broadcast.emit('updateControllerRotation' + data.controllerName, data);
            logMsg(`justSyncControllerRotation::${data.controllerName}: ${JSON.stringify(data)}`);
        };
    
        socket.on('registerControllerPosition', (data) => {
            // console.log('registering position for ' + data.controllerName);
            socket.on(data.controllerName + 'Position', justSyncControllerPosition);
            logMsg(`registerControllerPosition::${data.controllerName}: ${JSON.stringify(data)}`);
        });
    
        const justSyncControllerPosition = (data) => {
            // console.log('Controller Position', data);
            socket.broadcast.emit('updateControllerPosition' + data.controllerName, data);
            logMsg(`justSyncControllerPosition::${data.controllerName}: ${JSON.stringify(data)}`);
        };

        socket.on('registerFunction', (data) => {
            // console.log('registering function for ' + data.controllerName);
            socket.on(data.functionName, justSyncFunction)
            logMsg(`registerFunction::${data.functionName}: ${JSON.stringify(data)}`);
        });
    
        const justSyncFunction = (data) => {
            io.sockets.emit(data.functionName, data);
            logMsg(`justSyncFunction::${data.functionName}: ${JSON.stringify(data)}`);
        }

        socket.on('changeControllerRotation', (data) => {
            socket.broadcast.emit('updateControllerRotation' + data.controllerName, data);
            logMsg(`changeControllerRotation::${data.controllerName}: ${JSON.stringify(data)}`);
        });

        socket.on('changeControllerPosition', (data) => {
            socket.broadcast.emit('updateControllerPosition' + data.controllerName, data);
            logMsg(`updateControllerPosition::${data.controllerName}: ${JSON.stringify(data)}`);
        });
        // broadcast: https://github.com/socketio/socket.io/blob/master/docs/API.md#flag-broadcast
    });
};


