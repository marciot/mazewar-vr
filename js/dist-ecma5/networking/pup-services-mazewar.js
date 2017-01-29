var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
MazeWars VR
Copyright (C) 2016 Marcio Teixeira

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

(function (namespace) {
    namespace.PupMazeWarDirections = {
        EAST: 0x00,
        WEST: 0x01,
        SOUTH: 0x02,
        NORTH: 0x03
    };

    ParticipantState = Object.freeze({
        waitingForNetwork: 0,
        waitingForBroadcastReply: 1,
        waitingForInvitation: 2,
        iAmTheDuke: 3,
        iAmParticipant: 4
    });

    var PupMazeWarPackets = function () {
        function PupMazeWarPackets() {
            _classCallCheck(this, PupMazeWarPackets);
        }

        _createClass(PupMazeWarPackets, null, [{
            key: "decodeRatStatus",

            /* From mazedefs.mesa:
                MaxRats: CARDINAL = 8;
                RatId: TYPE = CARDINAL [0..MaxRats);
                RatStatus: TYPE = POINTER TO RatCb;
                RatCb: TYPE = RECORD [
                    dukeRat: RatId,
                    rats: ARRAY RatId OF RatObject];
                RatObject: TYPE = RECORD [
                    playing: BOOLEAN,
                    xLoc, yLoc: Loc,
                    dir: Direction,
                    score: Score,
                    addr: PupDefs.PupAddress,
                    name: RatName],
             */
            value: function decodeRatStatus(frameReader, ratStatus) {
                var maxRats = 8;
                ratStatus.dukeRat = frameReader.word;
                for (var i = 0; i < maxRats; i++) {
                    PupMazeWarPackets.decodeRatObject(frameReader, ratStatus.rats[i]);
                }
            }
        }, {
            key: "encodeRatStatus",
            value: function encodeRatStatus(frameWriter, ratStatus) {
                var maxRats = 8;
                frameWriter.word = ratStatus.dukeRat;
                for (var i = 0; i < maxRats; i++) {
                    PupMazeWarPackets.encodeRatObject(frameWriter, ratStatus.rats[i]);
                }
            }

            /* From mazedefs.mesa:
                RatObject: TYPE = RECORD [
                    playing: BOOLEAN,
                    xLoc, yLoc: Loc,
                    dir: Direction,
                    score: Score,
                    addr: PupDefs.PupAddress,
                    name: RatName],
             */

        }, {
            key: "decodeRatObject",
            value: function decodeRatObject(frameReader, ratObject) {
                var header = frameReader.word;
                ratObject.score = frameReader.byte << 16 | frameReader.word;
                ratObject.addr = frameReader.byte;
                var maze = frameReader.str(4);
                ratObject.name = frameReader.str(20).trim();
                ratObject.score = ratObject.score << 8 >> 8; // Fix sign
                ratObject.playing = header & 32768;
                ratObject.yLoc = (header & 32256) >> 9;
                ratObject.xLoc = (header & 504) >> 3;
                ratObject.dir = header & 7;
            }
        }, {
            key: "encodeRatObject",
            value: function encodeRatObject(frameWriter, ratObject) {
                frameWriter.word = (ratObject.playing ? 32768 : 0) | ratObject.yLoc << 9 | ratObject.xLoc << 3 | ratObject.dir;
                frameWriter.byte = (ratObject.score & 0xFF0000) >> 16;
                frameWriter.word = ratObject.score & 0x00FFFF;
                frameWriter.byte = ratObject.addr;
                frameWriter.str = "MAZE";
                frameWriter.str = ratObject.name + " ".repeat(20 - ratObject.name.length);
            }

            /* From mazedefs.mesa:
                AqRatNew: TYPE = RECORD [
                pass: CARDINAL,
                xLoc: Loc,
                yLoc: Loc,
                dir: Direction,
                addr: PupDefs.PupAddress,
                name: RatName];
            */

        }, {
            key: "decodeRatNew",
            value: function decodeRatNew(frameReader, ratNew) {
                ratNew.pass = frameReader.word;
                var header = frameReader.word;
                var skip = frameReader.byte;
                ratNew.addr = frameReader.byte;
                var maze = frameReader.str(4);
                ratNew.name = frameReader.str(20);
                ratNew.yLoc = (header & 64512) >> 10;
                ratNew.xLoc = (header & 1008) >> 4;
                ratNew.dir = header & 15;
            }
        }, {
            key: "encodeRatNew",
            value: function encodeRatNew(frameWriter, ratNew) {
                frameWriter.word = ratNew.pass;
                frameWriter.word = ratNew.yLoc << 10 | ratNew.xLoc << 4 | ratNew.dir;
                frameWriter.byte = 0;
                frameWriter.byte = ratNew.addr;
                frameWriter.str = "MAZE";
                frameWriter.str = ratNew.name + " ".repeat(20 - ratNew.name.length);
            }

            /*
              Packet Payload: 6 bytes
              From mazedefs.mesa:
                AqRatLocation: TYPE = RECORD [
                    ratId: RatId,
                    xLoc: Loc,
                    yLoc: Loc,
                    dir: Direction,
                    score: Score];
            */

        }, {
            key: "decodeRatLocation",
            value: function decodeRatLocation(frameReader, ratLoc) {
                // First four bytes of ratLoc look just like ratKill
                PupMazeWarPackets.decodeRatKill(frameReader, ratLoc);
                ratLoc.score = frameReader.word;
                ratLoc.score = ratLoc.score << 16 >> 16; // Fix sign
            }
        }, {
            key: "encodeRatLocation",
            value: function encodeRatLocation(frameWriter, ratLoc) {
                PupMazeWarPackets.encodeRatKill(frameWriter, ratLoc);
                frameWriter.word = ratLoc.score;
            }

            /*
              Packet Payload: 4 bytes
                AqRatKill: TYPE = RECORD [
                    ratId: RatId,
                    xLoc: Loc,
                    yLoc: Loc,
                    dir: Direction];
            */

        }, {
            key: "decodeRatKill",
            value: function decodeRatKill(frameReader, ratKill) {
                var header = frameReader.word;
                ratKill.dir = frameReader.word;
                ratKill.ratId = (header & 57344) >> 13;
                ratKill.yLoc = (header & 8064) >> 7;
                ratKill.xLoc = header & 127;
            }
        }, {
            key: "encodeRatKill",
            value: function encodeRatKill(frameWriter, ratKill) {
                frameWriter.word = ratKill.ratId << 13 | ratKill.yLoc << 7 | ratKill.xLoc;
                frameWriter.word = ratKill.dir;
            }

            /*
              Packet Payload: 2 bytes
                AqRatDead: TYPE = RECORD [
                    ratId: RatId,
                    killedBy: RatId];
            */

        }, {
            key: "decodeRatDead",
            value: function decodeRatDead(frameReader, ratDead) {
                var header = frameReader.word;
                ratDead.ratId = (header & 56) >> 3;
                ratDead.killedBy = header & 7;
            }
        }, {
            key: "encodeRatDead",
            value: function encodeRatDead(frameWriter, ratDead) {
                frameWriter.word = ratDead.ratId << 3 | ratDead.killedBy;
            }

            /*
              Packet Payload: 2 bytes
                AqRatQuery: TYPE = RECORD [
                    ratId: RatId];
            */

        }, {
            key: "decodeRatQuery",
            value: function decodeRatQuery(frameReader, ratQuery) {
                ratQuery.ratId = frameReader.word;
            }
        }, {
            key: "encodeRatQuery",
            value: function encodeRatQuery(frameWriter, ratQuery) {
                frameWriter.word = ratQuery.ratId;
            }

            /*
              Packet Payload: 2 bytes
                AqRatGone: TYPE = RECORD [
                    ratId: RatId];
            */

        }, {
            key: "decodeRatGone",
            value: function decodeRatGone(frameReader, ratGone) {
                ratGone.ratId = frameReader.word;
            }
        }, {
            key: "encodeRatGone",
            value: function encodeRatGone(frameWriter, ratGone) {
                frameWriter.word = ratGone.ratId;
            }
        }]);

        return PupMazeWarPackets;
    }();

    namespace.PupMazeWarServices = function (_namespace$PupService) {
        _inherits(_class, _namespace$PupService);

        function _class(initialPlayer, useRealNames) {
            _classCallCheck(this, _class);

            var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this));

            _this.eventListeners = {
                newGame: [],
                ratUpdate: [],
                ratKill: [],
                ratDead: [],
                ratGone: []
            };

            _this.SocketVersion20 = 0x4d415a45;
            _this.SocketVersion35 = 0x4d415a49;
            _this.MazeWarPassword = 0xA72E;
            _this.MazeWarBroadcast = parseInt('100', 8); // 30  bytes
            _this.MazeWarRatLocation = parseInt('170', 8); // 6 bytes
            _this.MazeWarRatKill = parseInt('171', 8); // 4 bytes
            _this.MazeWarRatDead = parseInt('172', 8); // 2 bytes
            _this.MazeWarRatStatus = parseInt('173', 8); // 242 bytes
            _this.MazeWarRatNew = parseInt('174', 8); // 30 bytes
            _this.MazeWarRatGone = parseInt('175', 8); // 2 bytes
            _this.MazeWarRatQuery = parseInt('176', 8); // 2 bytes
            _this.MazeWarRatQueryReply = parseInt('177', 8); // 2 bytes

            _this.MazeWarRatStatusSize = 242;
            _this.MazeWarRatNewSize = 30;
            _this.MazeWarRatLocationSize = 6;
            _this.MazeWarRatKillSize = 4;
            _this.MazeWarRatDeadSize = 2;
            _this.MazeWarRatGoneSize = 2;
            _this.MazeWarRatQuerySize = 2;
            _this.MazeWarRatQueryReplySize = 2;

            _this.state = ParticipantState.waitingForNetwork;
            _this.initialPlayer = initialPlayer;

            // If useRealNames is set to false, then players will be assigned
            // ficticious names based on their ratId.
            _this.useRealNames = useRealNames;
            _this.ficticiousRatNames = ["Bomber", "Killer", "Sniper", "Blaster", "Gunner", "Slasher", "Crusher", "Bruiser"];

            // Initialize message buffers
            _this.initRatStatus();
            _this.ratLocation = {
                ratId: 0,
                xLoc: 1,
                yLoc: 1,
                dir: 0,
                score: 0
            };
            _this.ratKill = {
                ratId: 0,
                xLoc: 1,
                yLoc: 1,
                dir: 0
            };
            _this.ratDead = {
                ratId: 0,
                killedBy: 0
            };
            _this.ratNew = {
                pass: _this.MazeWarPassword,
                addr: 0,
                xLoc: 1,
                yLoc: 1,
                dir: 0,
                name: "nobody"
            };
            _this.ratGone = {
                ratId: 0
            };
            _this.ratQuery = {
                ratId: 0
            };

            // Keep track of time last message was received by rat to detect disconnected players
            _this.ratCheckInterval = 3000;
            _this.ratLastSeen = new Array(8);
            return _this;
        }

        _createClass(_class, [{
            key: "networkReady",
            value: function networkReady() {
                if (this.state === ParticipantState.waitingForNetwork) {
                    this.sendMazewarBroadcast();
                }
            }
        }, {
            key: "addEventListener",
            value: function addEventListener(eventStr, callback) {
                this.eventListeners[eventStr].push(callback);
            }
        }, {
            key: "dispatchEvent",
            value: function dispatchEvent(eventStr) {
                for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    args[_key - 1] = arguments[_key];
                }

                for (var i = 0; i < this.eventListeners[eventStr].length; i++) {
                    this.eventListeners[eventStr][i].apply(null, args);
                }
            }
        }, {
            key: "initRatStatus",
            value: function initRatStatus() {
                this.ratStatus = {
                    dukeRat: 0,
                    rats: []
                };
                for (var i = 0; i < 8; i++) {
                    this.ratStatus.rats[i] = {
                        playing: 0,
                        yLoc: 0,
                        xLoc: 0,
                        dir: 0,
                        score: 0,
                        addr: 0,
                        name: ""
                    };
                }
            }
        }, {
            key: "provideService",
            value: function provideService(requestObj) {
                switch (requestObj.dstSock) {
                    case this.SocketVersion20:
                        return this.provideService_v20(requestObj);
                        break;
                    case this.SocketVersion35:
                        console.log("TODO: Not implemented");
                        break;
                }
            }
        }, {
            key: "provideService_v20",
            value: function provideService_v20(requestObj) {
                var reply = null;
                switch (requestObj.pupType) {
                    case this.MazeWarBroadcast:
                        if (this.state === ParticipantState.iAmTheDuke) {
                            PupMazeWarPackets.decodeRatNew(requestObj.reader, this.ratNew);
                            this.replyToMazewarBroadcast(requestObj);
                        }
                        break;
                    case this.MazeWarRatLocation:
                        PupMazeWarPackets.decodeRatLocation(requestObj.reader, this.ratLocation);
                        this.updateFromRatLocation();
                        break;
                    case this.MazeWarRatKill:
                        PupMazeWarPackets.decodeRatKill(requestObj.reader, this.ratKill);
                        this.updateRatKill();
                        break;
                    case this.MazeWarRatDead:
                        PupMazeWarPackets.decodeRatDead(requestObj.reader, this.ratDead);
                        this.updateRatDead();
                        break;
                    case this.MazeWarRatStatus:
                        console.log("Receiving mazewar status");
                        PupMazeWarPackets.decodeRatStatus(requestObj.reader, this.ratStatus);
                        switch (this.state) {
                            case ParticipantState.waitingForBroadcastReply:
                                reply = this.makeInvitationRequest(requestObj);
                                break;
                            case ParticipantState.waitingForInvitation:
                                this.acceptInvitation();
                                break;
                            default:
                                this.updateFromStatus();
                                break;
                        }
                        break;
                    case this.MazeWarRatNew:
                        console.log("Received request to join game");
                        if (this.state === ParticipantState.iAmTheDuke) {
                            PupMazeWarPackets.decodeRatNew(requestObj.reader, this.ratNew);
                            reply = this.replyToInvitationRequest(requestObj);
                        }
                        break;
                    case this.MazeWarRatGone:
                        PupMazeWarPackets.decodeRatGone(requestObj.reader, this.ratGone);
                        this.updateRatGone();
                        break;
                    case this.MazeWarRatQuery:
                        PupMazeWarPackets.decodeRatQuery(requestObj.reader, this.ratQuery);
                        reply = this.replyToRatQuery(requestObj);
                        break;
                    case this.MazeWarRatQueryReply:
                        PupMazeWarPackets.decodeRatQuery(requestObj.reader, this.ratQuery);
                        this.updateRatLastSeen(this.ratQuery.ratId);
                        break;
                }
                return reply;
            }
        }, {
            key: "newMazeWarFrame",
            value: function newMazeWarFrame(replyType, payloadSize, dstAddr) {
                return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "newPupFrame", this).call(this, {
                    pupType: replyType,
                    pupIdentifier: 0,
                    dstId: dstAddr || 0,
                    dstNet: 0,
                    dstHost: dstAddr || 0,
                    dstSock: this.SocketVersion20,
                    srcId: this.server.pupServerAddr,
                    srcNet: this.server.pupServerNet,
                    srcHost: this.server.pupServerAddr,
                    srcSock: this.SocketVersion20
                }, payloadSize);
            }
        }, {
            key: "makeRatNewPacket",
            value: function makeRatNewPacket(requestObj) {
                var frameWriter = this.newPupReply(requestObj, this.MazeWarRatNew, this.MazeWarRatNewSize);
                PupMazeWarPackets.encodeRatNew(frameWriter, this.ratNew);
                return frameWriter;
            }
        }, {
            key: "forAllRats",
            value: function forAllRats(func, defaultValue) {
                for (var ratId = 0; ratId < 8; ratId++) {
                    var rat = this.ratStatus.rats[ratId];
                    var val = func(rat, ratId);
                    if (typeof val !== "undefined") {
                        return val;
                    }
                }
                return defaultValue;
            }
        }, {
            key: "getRatAddress",
            value: function getRatAddress(ratId) {
                return this.ratStatus.rats[ratId].addr;
            }
        }, {
            key: "findUnoccupiedRatId",
            value: function findUnoccupiedRatId() {
                return this.forAllRats(function (rat, ratId) {
                    if (!rat.playing) {
                        return ratId;
                    }
                }, -1);
            }
        }, {
            key: "findRatOtherThanMe",
            value: function findRatOtherThanMe() {
                var _this2 = this;

                return this.forAllRats(function (rat, ratId) {
                    if (rat.playing && rat.addr !== _this2.server.pupServerAddr) {
                        return ratId;
                    }
                }, -1);
            }
        }, {
            key: "findMyRatId",
            value: function findMyRatId() {
                var _this3 = this;

                return this.forAllRats(function (rat, ratId) {
                    if (rat.playing && rat.addr === _this3.server.pupServerAddr) {
                        return ratId;
                    }
                }, -1);
            }

            /* Game negotiation protocol:
             *
             * A new game is initiated as follows:
             *  1) A new client calls sendMazewarBroadcast()
             *  2) If there are any dukes in the network, they reply with status using replyToMazewarBroadcast()
             *     2a) If there are no replies, the client becomes the duke.
             *  3) On receiving status, client sends an invitation request to duke using makeInvitationRequest()
             *  4) Duke adds player to game and sends a status update to all using replyToInvitationRequest()
             */

        }, {
            key: "sendMazewarBroadcast",
            value: function sendMazewarBroadcast() {
                console.log("Sending out Maze War broadcast");
                this.ratNew.pass = this.MazeWarPassword;
                this.ratNew.addr = this.server.pupServerAddr;

                var frameWriter = this.newMazeWarFrame(this.MazeWarBroadcast, this.MazeWarRatNewSize);
                PupMazeWarPackets.encodeRatNew(frameWriter, this.ratNew);
                this.sendFrame(frameWriter.frame);

                // Wait for a reply to our broadcast

                function ifNoReply() {
                    if (this.state === ParticipantState.waitingForBroadcastReply) {
                        if (!this.useRealNames) {
                            this.initialPlayer.name = this.getFicticiousRatName(0);
                        }

                        var rat = this.ratStatus.rats[0];
                        rat.playing = 1;
                        rat.addr = this.server.pupServerAddr;
                        rat.name = this.initialPlayer.name;
                        rat.xLoc = this.initialPlayer.xLoc;
                        rat.yLoc = this.initialPlayer.yLoc;
                        rat.dir = this.initialPlayer.dir;

                        this.becomeTheDuke();
                        this.dispatchEvent("newGame", 0, rat);
                    }
                }
                this.state = ParticipantState.waitingForBroadcastReply;
                setTimeout(ifNoReply.bind(this), 5000);
            }
        }, {
            key: "replyToMazewarBroadcast",
            value: function replyToMazewarBroadcast(requestObj) {
                if (this.state === ParticipantState.iAmTheDuke) {
                    console.log("Responding to broadcast with participant list");
                    this.sendRatStatus(requestObj.srcHost);
                }
            }
        }, {
            key: "makeInvitationRequest",
            value: function makeInvitationRequest(requestObj) {
                var ratId = this.findUnoccupiedRatId();
                if (ratId === -1) {
                    console.log("Ignoring offer, game is full");
                    return;
                }

                if (!this.useRealNames) {
                    this.initialPlayer.name = this.getFicticiousRatName(ratId);
                }

                console.log("Requesting to join available game");
                this.state = ParticipantState.waitingForInvitation;
                this.ratNew.pass = this.MazeWarPassword;
                this.ratNew.addr = this.server.pupServerAddr;
                this.ratNew.xLoc = this.initialPlayer.xLoc;
                this.ratNew.yLoc = this.initialPlayer.yLoc;
                this.ratNew.dir = this.initialPlayer.dir;
                this.ratNew.name = this.initialPlayer.name;
                return this.makeRatNewPacket(requestObj);
            }
        }, {
            key: "replyToInvitationRequest",
            value: function replyToInvitationRequest(requestObj) {
                var ratId = this.findUnoccupiedRatId();
                if (ratId === -1) {
                    return;
                }

                console.log("Joining player to game");
                var rat = this.ratStatus.rats[ratId];
                rat.playing = 1;
                rat.addr = this.ratNew.addr;
                rat.xLoc = this.ratNew.xLoc;
                rat.yLoc = this.ratNew.yLoc;
                rat.dir = this.ratNew.dir;
                rat.name = this.ratNew.name;
                this.dispatchEvent("ratUpdate", ratId, rat);
                this.updateRatLastSeen(ratId);

                // Send updated rat status to all players
                this.sendRatStatus();
            }
        }, {
            key: "acceptInvitation",
            value: function acceptInvitation() {
                var ratId = this.findMyRatId();
                if (ratId === -1) {
                    return;
                }
                console.log("I am now a game participant with ratId", ratId);
                this.state = ParticipantState.iAmParticipant;
                var rat = this.ratStatus.rats[ratId];
                this.dispatchEvent("newGame", ratId, rat);
                this.updateFromStatus();
            }
        }, {
            key: "becomeTheDuke",
            value: function becomeTheDuke() {
                console.log("I am now the duke");
                this.state = ParticipantState.iAmTheDuke;
                this.periodicRatCheckTask();
            }

            // Methods for replying to rat queries

        }, {
            key: "makeRatQueryPacket",
            value: function makeRatQueryPacket(requestObj) {
                var frameWriter = this.newPupReply(requestObj, this.MazeWarRatQueryReply, this.MazeWarRatQueryReplySize);
                PupMazeWarPackets.encodeRatQuery(frameWriter, this.ratQuery);
                return frameWriter;
            }
        }, {
            key: "replyToRatQuery",
            value: function replyToRatQuery(requestObj) {
                this.ratQuery.ratId = this.findMyRatId();
                return this.makeRatQueryPacket(requestObj);
            }
        }, {
            key: "sendRatQuery",
            value: function sendRatQuery(ratId) {
                this.ratQuery.ratId = this.findMyRatId();
                var frameWriter = this.newMazeWarFrame(this.MazeWarRatQuery, this.MazeWarRatQuerySize, this.getRatAddress(ratId));
                PupMazeWarPackets.encodeRatQuery(frameWriter, this.ratQuery);
                this.sendFrame(frameWriter.frame);
            }
        }, {
            key: "updateRatLastSeen",
            value: function updateRatLastSeen(ratId) {
                this.ratLastSeen[ratId] = performance.now();
            }
        }, {
            key: "periodicRatCheckTask",
            value: function periodicRatCheckTask() {
                if (this.state === ParticipantState.iAmTheDuke) {
                    this.lastRatCheck = performance.now();
                    if (!this.boundRatCheckTask) {
                        this.boundRatCheckTask = this.ratCheckTask.bind(this);
                        this.boundPeriodicTask = this.periodicRatCheckTask.bind(this);
                    }
                    this.forAllRats(this.boundRatCheckTask);
                    window.setTimeout(this.boundPeriodicTask, this.ratCheckInterval);
                }
            }
        }, {
            key: "ratCheckTask",
            value: function ratCheckTask(rat, ratId) {
                if (rat.playing && rat.addr !== this.server.pupServerAddr && this.ratLastSeen[ratId]) {
                    var timeSinceLastSeen = this.lastRatCheck - this.ratLastSeen[ratId];
                    if (timeSinceLastSeen > this.ratCheckInterval * 5) {
                        console.log("Rat with id", ratId, "vanished due to network timeout.");
                        this.removeRat(ratId);

                        // Inform other players that the rat is gone
                        this.sendRatGone(ratId);
                        this.sendRatStatus();
                    } else if (timeSinceLastSeen > this.ratCheckInterval) {
                        this.sendRatQuery(ratId);
                    }
                }
            }

            // Methods to receive state updates

        }, {
            key: "updateFromRatLocation",
            value: function updateFromRatLocation() {
                var ratId = this.ratLocation.ratId;
                var rat = this.ratStatus.rats[ratId];
                rat.xLoc = this.ratLocation.xLoc;
                rat.yLoc = this.ratLocation.yLoc;
                rat.dir = this.ratLocation.dir;
                rat.score = this.ratLocation.score;
                this.dispatchEvent("ratUpdate", ratId, rat);
                this.updateRatLastSeen(ratId);
            }
        }, {
            key: "updateFromStatus",
            value: function updateFromStatus() {
                var _this4 = this;

                this.forAllRats(function (rat, ratId) {
                    if (!_this4.useRealNames) {
                        rat.name = _this4.getFicticiousRatName(ratId);
                    }
                    if (rat.playing && rat.addr !== _this4.server.pupServerAddr) {
                        _this4.dispatchEvent("ratUpdate", ratId, rat);
                    }
                });

                if (this.ratStatus.rats[this.ratStatus.dukeRat].addr === this.server.pupServerAddr) {
                    console.log("I've been promoted to duke");
                    this.becomeTheDuke();
                }
            }
        }, {
            key: "updateRatKill",
            value: function updateRatKill() {
                var ratId = this.ratKill.ratId;
                var rat = this.ratStatus.rats[ratId];
                this.dispatchEvent("ratKill", ratId, rat);
            }
        }, {
            key: "updateRatDead",
            value: function updateRatDead() {
                var ratId = this.ratDead.ratId;
                var killedBy = this.ratDead.killedBy;
                this.dispatchEvent("ratDead", ratId, killedBy);
            }
        }, {
            key: "updateRatGone",
            value: function updateRatGone() {
                var ratId = this.ratGone.ratId;
                console.log("Rat Gone:", ratId);
                this.removeRat(ratId);
            }
        }, {
            key: "removeRat",
            value: function removeRat(ratId) {
                this.dispatchEvent("ratGone", ratId);
                this.ratStatus.rats[ratId].playing = false;
            }

            // Methods to send state updates

        }, {
            key: "setRatPosition",
            value: function setRatPosition(ratId, xLoc, yLoc) {
                var rat = this.ratStatus.rats[ratId];
                rat.xLoc = xLoc;
                rat.yLoc = yLoc;
                this.sendRatLocation(ratId);
            }
        }, {
            key: "setRatDirection",
            value: function setRatDirection(ratId, dir) {
                var rat = this.ratStatus.rats[ratId];
                rat.dir = dir;
                this.sendRatLocation(ratId);
            }
        }, {
            key: "ratShoots",
            value: function ratShoots(ratId) {
                var rat = this.ratStatus.rats[ratId];
                this.sendRatKill(ratId);
            }
        }, {
            key: "ratKilled",
            value: function ratKilled(ratId, killedBy) {
                var rat = this.ratStatus.rats[ratId];
                this.sendRatDead(ratId, killedBy);
            }
        }, {
            key: "sendRatLocation",
            value: function sendRatLocation(ratId) {
                var rat = this.ratStatus.rats[ratId];
                this.ratLocation.ratId = ratId;
                this.ratLocation.xLoc = rat.xLoc;
                this.ratLocation.yLoc = rat.yLoc;
                this.ratLocation.dir = rat.dir;
                this.ratLocation.score = rat.score;

                var frameWriter = this.newMazeWarFrame(this.MazeWarRatLocation, this.MazeWarRatLocationSize);
                PupMazeWarPackets.encodeRatLocation(frameWriter, this.ratLocation);
                this.multicastFrame(frameWriter.frame, this.multicastAddresses);
            }
        }, {
            key: "sendRatKill",
            value: function sendRatKill(ratId) {
                var rat = this.ratStatus.rats[ratId];
                this.ratKill.ratId = ratId;
                this.ratKill.xLoc = rat.xLoc;
                this.ratKill.yLoc = rat.yLoc;
                this.ratKill.dir = rat.dir;

                var frameWriter = this.newMazeWarFrame(this.MazeWarRatKill, this.MazeWarRatKillSize);
                PupMazeWarPackets.encodeRatKill(frameWriter, this.ratKill);
                this.multicastFrame(frameWriter.frame, this.multicastAddresses);
            }
        }, {
            key: "sendRatDead",
            value: function sendRatDead(ratId, killedBy) {
                this.ratDead.ratId = ratId;
                this.ratDead.killedBy = killedBy;

                var frameWriter = this.newMazeWarFrame(this.MazeWarRatDead, this.MazeWarRatDeadSize);
                PupMazeWarPackets.encodeRatDead(frameWriter, this.ratDead);
                this.multicastFrame(frameWriter.frame, this.multicastAddresses);
            }
        }, {
            key: "sendRatStatus",
            value: function sendRatStatus(address) {
                var frameWriter = this.newMazeWarFrame(this.MazeWarRatStatus, this.MazeWarRatStatusSize);
                PupMazeWarPackets.encodeRatStatus(frameWriter, this.ratStatus);
                this.multicastFrame(frameWriter.frame, address ? [address] : this.multicastAddresses);
            }
        }, {
            key: "sendRatGone",
            value: function sendRatGone(ratId) {
                this.ratGone.ratId = ratId;

                var frameWriter = this.newMazeWarFrame(this.MazeWarRatGone, this.MazeWarRatGoneSize);
                PupMazeWarPackets.encodeRatGone(frameWriter, this.ratGone);
                this.multicastFrame(frameWriter.frame, this.multicastAddresses);
            }
        }, {
            key: "getFicticiousRatName",
            value: function getFicticiousRatName(ratId) {
                return this.ficticiousRatNames[ratId];
            }

            // Routines for leaving the game gracefully

        }, {
            key: "electNewDuke",
            value: function electNewDuke() {
                var eligibleRat = this.findRatOtherThanMe();
                if (eligibleRat > -1) {
                    this.ratStatus.dukeRat = eligibleRat;
                    this.state = ParticipantState.iAmParticipant;
                }
            }
        }, {
            key: "endGame",
            value: function endGame() {
                console.log("Leaving network game.");
                var myRatId = this.findMyRatId();
                this.sendRatGone(myRatId);
                if (this.state === ParticipantState.iAmTheDuke) {
                    this.ratStatus.rats[myRatId].playing = false;
                    this.electNewDuke();
                    this.sendRatStatus();
                }
                this.server.stopServices(true);
            }
        }, {
            key: "multicastAddresses",
            get: function () {
                var _this5 = this;

                var addrs = [];
                this.forAllRats(function (rat, ratId) {
                    if (rat.playing && rat.addr !== _this5.server.pupServerAddr) {
                        addrs.push(rat.addr);
                    }
                });
                return addrs;
            }
        }]);

        return _class;
    }(namespace.PupService);
})(window.RetroWeb = window.RetroWeb || {});