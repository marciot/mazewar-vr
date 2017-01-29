var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
RetroWeb Networking Components
Copyright (C) 2016 Marcio Teixeira

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/

(function (namespace) {
    /* Please get your free PeerJS Cloud API key from http://peerjs.com and
       uncomment the following:
         namespace.peerJSConfig = {key: 'your-api-key'}
    */

    namespace.PeerNetwork = function () {
        function _class(peerOptions, networkDataCallback, stateChangedCallback) {
            _classCallCheck(this, _class);

            this.peerOptions = peerOptions;
            this.networkDataCallback = networkDataCallback;
            this.stateChangedCallback = stateChangedCallback;
            this.verbose = true;
            this.peerPrefix = "retroweb_";
            this.reset();

            this.eventListeners = {
                allPeersConnected: []
            };
        }

        _createClass(_class, [{
            key: 'reset',
            value: function reset() {
                if (this.peer) {
                    var peer = this.peer;
                    this.peer = null;
                    peer.disconnect();
                    peer.destroy();
                }
                this.joinInitiated = false;
                this.isJoined = false;
                this.fullyConnected = false;
                this.isMaster = false;
                this.roomId = null;
                this.masterId = null;
                this.myPeerId = null;
                this.onceJoinedCallback = null;
                this.connections = {};
                this._setState('offline');
            }
        }, {
            key: 'leaveRoom',
            value: function leaveRoom() {
                this.reset();
            }
        }, {
            key: '_getMasterPeerId',
            value: function _getMasterPeerId(roomId) {
                var sanitized = roomId ? roomId.replace(/[^0-9a-zA-Z]/g, '').toLowerCase() : null;
                var id = this.peerPrefix + (sanitized ? sanitized : 'lobby');
                this._info("retroweb-network: Generated master id", id);
                return id;
            }

            /* joinRoom attempts to join a room as a participant (leave
             * roomId blank for the lobby). If the peer which is the room
             * master does not exist, then become the master.
             */

        }, {
            key: 'joinRoom',
            value: function joinRoom(roomId) {
                var me = this;

                function errorFunc(err) {
                    if (err.type == 'peer-unavailable') {
                        /* The peer-id is unavailable, this means we need to become
                           the master */
                        window.setTimeout(me._joinAsMaster.bind(me, me.roomId), 10);
                    } else {
                        me._setState('error', err.type);
                    }
                }

                this.roomId = roomId;
                this.masterId = this._getMasterPeerId(this.roomId);

                // Start new Peer as a participant in the room
                this.peer = new Peer(this.peerOptions);
                this.peer.on('error', errorFunc);
                this.peer.on('open', function (id) {
                    me.myPeerId = id;
                });

                // Initiate connection to master
                function connectedToMaster() {
                    me._info("retroweb-network: I am member of the network. My id is", me.myPeerId);
                }
                this._info("retroweb-network: Trying to connect to master", this.masterId);
                try {
                    this._processConnection(connectedToMaster, this.peer.connect(this.masterId));
                } catch (e) {}
                // Under iOS, peer.connect throws an exception after errorFunc fires, so
                // this allows us to recover.


                // Handle subsequent connections from new peers
                function connectionOpenFunc() {
                    me._checkIfFullyConnected();
                }
                this.peer.on('connection', this._processConnection.bind(this, connectionOpenFunc));
            }

            /* _joinAsMaster attempts to start a new room as the master (leave blank for lobby).
             * If that room is already started, then attempt to join as a member.
             */

        }, {
            key: '_joinAsMaster',
            value: function _joinAsMaster(roomId, onceJoinedCallback) {
                var me = this;

                function errorFunc(err) {
                    if (err.type == 'unavailable-id') {
                        /* The peer-id is unavailable, this means a master already exists */
                        window.setTimeout(me.joinRoom.bind(me, me.roomId), 10);
                    } else {
                        me._setState('error', err.type);
                    }
                }

                function peerOpenFunc(id) {
                    me._info("retroweb-network: I am the master of network. My id is", id);
                    me._setState('joined');
                    me.isJoined = true;
                    me.isMaster = true;
                    me.myPeerId = id;
                    if (onceJoinedCallback) {
                        onceJoinedCallback();
                    }
                    me._checkIfFullyConnected();
                }

                this.roomId = roomId;
                this.masterId = this._getMasterPeerId(this.roomId);

                // Start new Peer as a master for the room
                this.peer = new Peer(this.masterId, this.peerOptions);
                this.peer.on('error', errorFunc);
                this.peer.on('open', peerOpenFunc);

                // Handle subsequent connections from new peers
                function connectionOpenFunc() {
                    // As the master I am responsible for broadcasting the
                    // peer list when a new peer joins the network.
                    me._sendPeerList();
                    me._checkIfFullyConnected();
                }
                this.peer.on('connection', this._processConnection.bind(this, connectionOpenFunc));
            }
        }, {
            key: '_processConnection',
            value: function _processConnection(callback, newConnection) {
                if (!this.peer) {
                    // Ignore closed connections after peer is destroyed
                    return;
                }
                this.fullyConnected = false;
                var peer = newConnection.peer;
                var me = this;
                function openCallback() {
                    if (me.connections[peer]) {
                        /* If we are already connected, reject the new connection */
                        me._error("retroweb-network: Redundant connection from", peer, "; already connected");
                    } else {
                        me._info("retroweb-network: Accepting connection from", peer);
                        me.connections[peer] = newConnection;
                        callback();
                    }
                }
                newConnection.on('data', function (obj) {
                    me._receivedNetworkObject(peer, obj);
                });
                newConnection.on('close', function () {
                    me._connectionClosed(peer);
                });
                newConnection.on('open', openCallback);
            }
        }, {
            key: '_checkIfFullyConnected',
            value: function _checkIfFullyConnected() {
                var participantIsFullyConnected = this.peerList && this.peerList.length === Object.keys(this.connections).length;

                if (this.isMaster || participantIsFullyConnected) {
                    this._info("Network complete. All peers connected.");

                    if (!this.isJoined) {
                        this._setState('joined');
                        this.isJoined = true;
                    }

                    if (!this.fullyConnected) {
                        this.fullyConnected = true;
                        this.dispatchEvent("allPeersConnected");
                    }
                } else {
                    this.fullyConnected = false;
                    this._info("Network incomplete. Waiting for peers to connect.");
                }
            }

            /* To reconnect as a master, we save a list of connected peers, destroy the current Peer object,
             * rejoin (which creates a new Peer object) and re-establish the connections we had before.
             */

        }, {
            key: '_reconnectAsMaster',
            value: function _reconnectAsMaster() {
                var peers = Object.getOwnPropertyNames(this.connections);
                this.leaveRoom();
                this._joinAsMaster(this.roomId, this._connectToPeers.bind(this, peers));
            }

            /* When a connection is closed, we remove it from the connections list. However, if the master
             * closes a connection, then the first member in the peers list must take over as a master.
             */

        }, {
            key: '_connectionClosed',
            value: function _connectionClosed(peer) {
                this._info("retroweb-network: Connection closed:", peer);
                if (!this.peer) {
                    // Ignore closed connections after peer is destroyed
                    return;
                }
                delete this.connections[peer];
                if (this.peerList) {
                    // Remove peer from peer list
                    var index = this.peerList.indexOf(peer);
                    if (index > -1) {
                        this.peerList.splice(index, 1);
                    }
                    // Check to see if I need to promote myself to master
                    if (peer == this.masterId && this.myPeerId == this.peerList[0]) {
                        this._info("retroweb-network: Master closed connection. Will promoting myself to master in 3 seconds.");
                        // Note: Delay before reconnecting, as it takes a bit of time
                        // for the peerjs server to release the id for reuse.
                        window.setTimeout(this._reconnectAsMaster.bind(this), 3000);
                    }
                }
            }

            /* Sends a list of peers as a broadcast. This is only ever done by the master
             * of the room. Upon receipt of the peerList, a peer makes connections to all
             * other peers.
             */

        }, {
            key: '_sendPeerList',
            value: function _sendPeerList() {
                var peers = Object.getOwnPropertyNames(this.connections);
                this._info("retroweb-network: Sending peers list:", peers);
                this.sendObjectToAll({ peerList: peers });
            }
        }, {
            key: '_isConnectedTo',
            value: function _isConnectedTo(peer) {
                return this.connections[peer];
            }

            /* Make sure we have an open connection to all peers in the list. If a filterFunc
             * is provided, then a connection is made only if that function returns true.
            */

        }, {
            key: '_connectToPeers',
            value: function _connectToPeers(peerList, filterFunc) {
                var me = this;
                function connectionOpenFunc() {
                    me._checkIfFullyConnected();
                }

                for (var i = 0; i < peerList.length; i++) {
                    var peer = peerList[i];
                    if (!this._isConnectedTo(peer) && peer != this.myPeerId && (filterFunc ? filterFunc(peer) : true)) {
                        this._info("retroweb-network: Connecting to new peer", peer);
                        this._processConnection(connectionOpenFunc, this.peer.connect(peer));
                    }
                }
            }
        }, {
            key: '_receivedNetworkObject',
            value: function _receivedNetworkObject(peer, obj) {
                if (obj.hasOwnProperty("peerList")) {
                    /* All peers will receive the peerList updates. To avoid two peers from
                     * trying to make redundant connections to each other, we impose a rule
                     * where only a peer with the higher ID connects to the peer with the
                     * lower ID */
                    var connectionSieve = function (peer) {
                        return this.myPeerId > peer;
                    };

                    this._info("retroweb-network: Receiving updated peer list", obj.peerList);
                    this.peerList = obj.peerList;
                    this._checkIfFullyConnected();
                    this._connectToPeers(this.peerList, connectionSieve.bind(this));
                } else {
                    this.receivedNetworkObject(peer, obj);
                }
            }
        }, {
            key: 'receivedNetworkObject',
            value: function receivedNetworkObject(peer, object) {
                this.networkDataCallback(peer, object);
            }
        }, {
            key: 'sendObjectToAll',
            value: function sendObjectToAll(obj) {
                var peers = this.peers;
                for (var i = 0; i < peers.length; i++) {
                    this.connections[peers[i]].send(obj);
                }
            }
        }, {
            key: 'sendObjectToPeer',
            value: function sendObjectToPeer(peer, obj) {
                if (this.connections[peer]) {
                    this.connections[peer].send(obj);
                } else {
                    this._error("retroweb-network: Trying to send to", peer, " to which we are not already connected. This should not happen");
                }
            }
        }, {
            key: '_setState',
            value: function _setState(state, info) {
                if (state === "error") {
                    this._error("retroweb-network: error: ", info);
                }
                if (this.stateChangedCallback) {
                    this.stateChangedCallback(state, info);
                }
            }
        }, {
            key: '_info',
            value: function _info() {
                if (this.verbose) {
                    console.log.apply(console, arguments);
                }
            }
        }, {
            key: '_error',
            value: function _error() {
                console.log.apply(console, arguments);
            }
        }, {
            key: 'addEventListener',
            value: function addEventListener(eventStr, callback) {
                this.eventListeners[eventStr].push(callback);
            }
        }, {
            key: 'dispatchEvent',
            value: function dispatchEvent(eventStr) {
                for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    args[_key - 1] = arguments[_key];
                }

                for (var i = 0; i < this.eventListeners[eventStr].length; i++) {
                    this.eventListeners[eventStr][i].apply(null, args);
                }
            }
        }, {
            key: 'peers',
            get: function () {
                return Object.getOwnPropertyNames(this.connections);
            }
        }, {
            key: 'isPrivateRoom',
            get: function () {
                return !!this.roomId;
            }
        }]);

        return _class;
    }();

    var ShortIntegerToPeerMap = function () {
        function ShortIntegerToPeerMap() {
            _classCallCheck(this, ShortIntegerToPeerMap);

            this.map = [];
        }

        _createClass(ShortIntegerToPeerMap, [{
            key: 'learnNodeIdToPeerMapping',
            value: function learnNodeIdToPeerMapping(nodeId, peer) {
                if (peer != this.map[nodeId]) {
                    this.map[nodeId] = peer;
                }
            }
        }, {
            key: 'forgetPeer',
            value: function forgetPeer(peer) {
                for (var i = 0; i < this.map.length; i++) {
                    if (this.map[i] === peer) {
                        delete this.map[i];
                    }
                }
            }
        }, {
            key: 'nodeIdToPeer',
            value: function nodeIdToPeer(nodeId) {
                return this.map[nodeId];
            }
        }, {
            key: 'peerToNodeId',
            value: function peerToNodeId(peer) {
                for (var i = 0; i < this.map.length; i++) {
                    if (this.map[i] === peer) {
                        return i;
                    }
                }
            }
        }]);

        return ShortIntegerToPeerMap;
    }();

    /* BinarySwitchedNetwork build upon PeerNetwork for implementing a network that is suitable
     * for tunneling binary data link protocols.
     *
     *   1) A linkType can be used, in addition to roomIds, to keep incompatible traffic separate.
     *        LocalTalk - Legacy LocalTalk frames
     *        Alto      - Legacy Ethernet v1/PARC Universal Packet
     *   2) A new sendFrame method works with source and destination addresses native to the
     *      tunneled protocol and the map from addresses to connected peers is learned automatically.
     *   3) sendFrame takes in a Uint8Array (possibly a view into a larger buffer) and trims it to
     *      an appropriately sized ArrayBuffer for transmission.
     */


    namespace.BinarySwitchedNetwork = function (_namespace$PeerNetwor) {
        _inherits(_class2, _namespace$PeerNetwor);

        function _class2(linkType, peerOptions, networkDataCallback, stateChangedCallback) {
            _classCallCheck(this, _class2);

            var _this = _possibleConstructorReturn(this, (_class2.__proto__ || Object.getPrototypeOf(_class2)).call(this, peerOptions, networkDataCallback, stateChangedCallback));

            _this.broadcastDstId = "*";
            switch (linkType.toUpperCase()) {
                case "LOCALTALK":
                    _this.peerPrefix = "retroweb_lt_";break;
                case "ALTO":
                    _this.peerPrefix = "retroweb_al_";break;
                default:
                    _this.peerPrefix = "retroweb_" + linkType.toLowerCase() + "_";
                    _this._error("retroweb-network: Unknown link type", linkType);
                    break;
            }
            /* Attempt to pre-populate the peerMap by requesting node id updates from all peers */
            function queryAddresses() {
                this.sendObjectToAll({ command: "queryNodeId" });
            }
            setTimeout(queryAddresses.bind(_this), 600);
            return _this;
        }

        _createClass(_class2, [{
            key: 'reset',
            value: function reset() {
                _get(_class2.prototype.__proto__ || Object.getPrototypeOf(_class2.prototype), 'reset', this).call(this);
                this.peerMap = new ShortIntegerToPeerMap();
                this.forwardingPeer = null;
            }
        }, {
            key: 'receivedNetworkObject',
            value: function receivedNetworkObject(peer, obj) {
                if (obj.hasOwnProperty("command")) {
                    switch (obj.command) {
                        case "forwardFrame":
                            delete obj.command;
                            this.peerMap.learnNodeIdToPeerMapping(obj.src, peer);
                            this.forwardFrame(obj.dst, obj.src, obj.frame);
                            if (this.isMonitoring) {
                                this.networkDataCallback(obj.dst, obj.src, new Uint8Array(obj.frame));
                            }
                            break;
                        case "requestForwardMode":
                            this._setForwardMode(peer, obj.state);
                            break;
                        case "queryNodeId":
                            this.sendObjectToPeer(peer, { command: "nodeIdUpdate", src: this.myNodeId });
                            break;
                        case "nodeIdUpdate":
                            if (obj.src) {
                                this.peerMap.learnNodeIdToPeerMapping(obj.src, peer);
                            }
                            break;
                        default:
                            this._info("Received unknown command", obj.command);
                    }
                } else if (obj.hasOwnProperty("frame")) {
                    this._info("Received frame of", obj.frame.byteLength, "bytes from", obj.src, "(0" + obj.src.toString(8) + "B)");
                    this.peerMap.learnNodeIdToPeerMapping(obj.src, peer);
                    this.networkDataCallback(obj.dst, obj.src, new Uint8Array(obj.frame));
                }
            }
        }, {
            key: '_setForwardMode',
            value: function _setForwardMode(peer, state) {
                if (!state) {
                    this.forwardingPeer = null;
                } else if (peer !== this.forwardingPeer && confirm('A peer is requesting to monitor all communications. Allow?')) {
                    this.forwardingPeer = peer;
                }
            }
        }, {
            key: '_connectionClosed',
            value: function _connectionClosed(peer) {
                _get(_class2.prototype.__proto__ || Object.getPrototypeOf(_class2.prototype), '_connectionClosed', this).call(this, peer);
                if (peer == this.forwardingPeer) {
                    this.forwardingPeer = null;
                }
                this.peerMap.forgetPeer(peer);
            }
        }, {
            key: '_learnMyOwnNodeId',
            value: function _learnMyOwnNodeId(nodeId) {
                if (this.myNodeId !== nodeId) {
                    this.myNodeId = nodeId;
                    this.sendObjectToAll({ command: "nodeIdUpdate", src: nodeId });
                }
            }
        }, {
            key: 'sendFrame',
            value: function sendFrame(dstId, srcId, uint8Array) {
                this._learnMyOwnNodeId(srcId);
                /* It is necessary to clone the ArrayBuffer, as a uint8Array may only be subset
                 * of a much larger buffer which we don't want to serialize and transmit */
                var frame = new ArrayBuffer(uint8Array.length);
                var array = new Uint8Array(frame);
                array.set(uint8Array);

                this.forwardFrame(dstId, srcId, frame);
            }
        }, {
            key: 'forwardFrame',
            value: function forwardFrame(dstId, srcId, uint8Array) {
                /* The destination and source address are copied into the
                 * object as the receiving end may not know how to decode
                 * the frame */
                var obj = { dst: dstId, src: srcId, frame: uint8Array };

                if (this.forwardingPeer) {
                    /* Some node has requested to inspect my traffic. Direct all my
                     * outgoing frames to that node for inspection and forwarding. */
                    obj.command = "forwardFrame";
                    this.sendObjectToPeer(this.forwardingPeer, obj);
                } else {
                    var peer = this.peerMap.nodeIdToPeer(dstId);
                    if (peer === this.broadcastDstId || !peer) {
                        /* Send the frame to everyone when the frame is to
                         * the broadcast address or it is directed to a node
                         * for which we do not know the peer */
                        this.sendObjectToAll(obj);
                    } else {
                        this.sendObjectToPeer(peer, obj);
                    }
                }
            }
        }, {
            key: 'enableMonitoring',
            value: function enableMonitoring(peer) {
                if (peer) {
                    this.sendObjectToPeer(peer, { command: "requestForwardMode", state: true });
                } else {
                    this.sendObjectToAll({ command: "requestForwardMode", state: true });
                }
                this.isMonitoring = true;
                this.forwardingPeer = null;
            }
        }, {
            key: 'disableMonitoring',
            value: function disableMonitoring() {
                this.sendObjectToAll({ command: "requestForwardMode", state: false });
                this.isMonitoring = false;
            }
        }, {
            key: 'broadcastId',
            set: function (id) {
                this.broadcastDstId = id;
                this.peerMap.learnNodeIdToPeerMapping(this.broadcastDstId, this.broadcastDstId);
            }
        }]);

        return _class2;
    }(namespace.PeerNetwork);

    namespace.RetrowebNetwork = function (_namespace$BinarySwit) {
        _inherits(_class3, _namespace$BinarySwit);

        function _class3(linkType, peerOptions, networkDataCallback, stateChangedCallback) {
            _classCallCheck(this, _class3);

            return _possibleConstructorReturn(this, (_class3.__proto__ || Object.getPrototypeOf(_class3)).call(this, linkType, peerOptions, networkDataCallback, stateChangedCallback));
        }

        return _class3;
    }(namespace.BinarySwitchedNetwork);
})(window.RetroWeb = window.RetroWeb || {});