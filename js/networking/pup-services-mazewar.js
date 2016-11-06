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

(function(namespace){
    namespace.PupMazeWarDirections = {
        EAST:  0x00,
        WEST:  0x01,
        SOUTH: 0x02,
        NORTH: 0x03
    };

    ParticipantState = Object.freeze({
        waitingForNetwork:             0,
        waitingForBroadcastReply:      1,
        waitingForInvitation:  2,
        iAmTheDuke:            3,
        iAmParticipant:        4
    });

    class PupMazeWarPackets {
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
        static decodeRatStatus(frameReader, ratStatus) {
            const maxRats     = 8;
            ratStatus.dukeRat = frameReader.word;
            for(var i = 0; i < maxRats; i++) {
                PupMazeWarPackets.decodeRatObject(frameReader, ratStatus.rats[i]);
            }
        }

        static encodeRatStatus(frameWriter, ratStatus) {
            const maxRats     = 8;
            frameWriter.word = ratStatus.dukeRat;
            for(var i = 0; i < maxRats; i++) {
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
        static decodeRatObject(frameReader, ratObject) {
            var header      = frameReader.word;
            ratObject.score = (frameReader.byte << 16) | frameReader.word;
            ratObject.addr  = frameReader.byte;
            var maze        = frameReader.str(4);
            ratObject.name  = frameReader.str(20).trim();
            ratObject.score = (ratObject.score << 8) >> 8; // Fix sign
            ratObject.playing = (header & 0b1000000000000000);
            ratObject.yLoc    = (header & 0b0111111000000000) >> 9;
            ratObject.xLoc    = (header & 0b0000000111111000) >> 3;
            ratObject.dir     = (header & 0b0000000000000111);
        }

        static encodeRatObject(frameWriter, ratObject) {
            frameWriter.word = (ratObject.playing ? 0b1000000000000000 : 0) |
                               (ratObject.yLoc << 9) |
                               (ratObject.xLoc << 3) |
                               (ratObject.dir);
            frameWriter.byte = (ratObject.score & 0xFF0000) >> 16;
            frameWriter.word = (ratObject.score & 0x00FFFF);
            frameWriter.byte = ratObject.addr;
            frameWriter.str  = "MAZE";
            frameWriter.str  = ratObject.name + " ".repeat(20 - ratObject.name.length);
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
        static decodeRatNew(frameReader, ratNew) {
            ratNew.pass = frameReader.word;
            var header  = frameReader.word;
            var skip    = frameReader.byte;
            ratNew.addr = frameReader.byte;
            var maze    = frameReader.str(4);
            ratNew.name = frameReader.str(20);
            ratNew.yLoc = (header & 0b1111110000000000) >> 10;
            ratNew.xLoc = (header & 0b0000001111110000) >> 4;
            ratNew.dir  = (header & 0b0000000000001111);
        }

        static encodeRatNew(frameWriter, ratNew) {
            frameWriter.word = ratNew.pass;
            frameWriter.word = (ratNew.yLoc   << 10)  |
                               (ratNew.xLoc   << 4)   |
                               (ratNew.dir);
            frameWriter.byte = 0;
            frameWriter.byte = ratNew.addr;
            frameWriter.str  = "MAZE";
            frameWriter.str  = ratNew.name + " ".repeat(20 - ratNew.name.length);
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
        static decodeRatLocation(frameReader, ratLoc) {
            // First four bytes of ratLoc look just like ratKill
            PupMazeWarPackets.decodeRatKill(frameReader, ratLoc);
            ratLoc.score  = frameReader.word;
            ratLoc.score  = (ratLoc.score << 16) >> 16; // Fix sign
        }

        static encodeRatLocation(frameWriter, ratLoc) {
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
        static decodeRatKill(frameReader, ratKill) {
            var header    = frameReader.word;
            ratKill.dir   = frameReader.word;
            ratKill.ratId = (header & 0b1110000000000000) >> 13;
            ratKill.yLoc  = (header & 0b0001111110000000) >> 7;
            ratKill.xLoc  = (header & 0b0000000001111111);
        }

        static encodeRatKill(frameWriter, ratKill) {
            frameWriter.word = (ratKill.ratId << 13) |
                               (ratKill.yLoc   << 7) |
                               (ratKill.xLoc);
            frameWriter.word = ratKill.dir;
        }

        /*
          Packet Payload: 2 bytes
            AqRatDead: TYPE = RECORD [
                ratId: RatId,
                killedBy: RatId];
        */
        static decodeRatDead(frameReader, ratDead) {
            var header       = frameReader.word;
            ratDead.ratId    = (header & 0b00111000) >> 3;
            ratDead.killedBy = (header & 0b00000111);
        }

        static encodeRatDead(frameWriter, ratDead) {
            frameWriter.word = (ratDead.ratId << 3) |
                                ratDead.killedBy;
        }

        /*
          Packet Payload: 2 bytes
            AqRatQuery: TYPE = RECORD [
                ratId: RatId];
        */
        static decodeRatQuery(frameReader, ratQuery) {
            ratQuery.ratId   = frameReader.word;
        }

        static encodeRatQuery(frameWriter, ratQuery) {
            frameWriter.word = ratQuery.ratId;
        }

        /*
          Packet Payload: 2 bytes
            AqRatGone: TYPE = RECORD [
                ratId: RatId];
        */
        static decodeRatGone(frameReader, ratGone) {
            ratGone.ratId = frameReader.word;
        }

        static encodeRatGone(frameWriter, ratGone) {
            frameWriter.word = ratGone.ratId;
        }
    }

    namespace.PupMazeWarServices = class extends namespace.PupService {
        constructor(initialPlayer) {
            super();

            this.eventListeners = {
                newGame:    [],
                ratUpdate:  [],
                ratKill:    [],
                ratDead:    []
            };

            this.SocketVersion20          = 0x4d415a45;
            this.SocketVersion35          = 0x4d415a49;
            this.MazeWarPassword          = 0xA72E;
            this.MazeWarBroadcast         = parseInt('100', 8); // 30  bytes
            this.MazeWarRatLocation       = parseInt('170', 8); // 6 bytes
            this.MazeWarRatKill           = parseInt('171', 8); // 4 bytes
            this.MazeWarRatDead           = parseInt('172', 8); // 2 bytes
            this.MazeWarRatStatus         = parseInt('173', 8); // 242 bytes
            this.MazeWarRatNew            = parseInt('174', 8); // 30 bytes
            this.MazeWarRatGone           = parseInt('175', 8); // 4 bytes
            this.MazeWarRatQuery          = parseInt('176', 8); // 2 bytes
            this.MazeWarRatQueryReply     = parseInt('177', 8); // 2 bytes

            this.MazeWarRatStatusSize     = 242;
            this.MazeWarRatNewSize        = 30;
            this.MazeWarRatLocationSize   = 6;
            this.MazeWarRatKillSize       = 4;
            this.MazeWarRatDeadSize       = 2;
            this.MazeWarRatQueryReplySize = 2;

            this.state = ParticipantState.waitingForNetwork;
            this.initialPlayer = initialPlayer;

            // Initialize message buffers
            this.initRatStatus();
            this.ratLocation = {
                ratId:      0,
                xLoc:       1,
                yLoc:       1,
                dir:        0,
                score:      0
            };
            this.ratKill     = {
                ratId:      0,
                xLoc:       1,
                yLoc:       1,
                dir:        0
            };
            this.ratDead     = {
                ratId:      0,
                killedBy:   0
            };
            this.ratNew      = {
                pass:       this.MazeWarPassword,
                addr:       0,
                xLoc:       1,
                yLoc:       1,
                dir:        0,
                name:       "nobody"
            };
            this.ratGone     = {
                ratId:      0
            }
            this.ratQuery    = {
                radId:      0
            };
        }

        networkReady() {
            if(this.state === ParticipantState.waitingForNetwork) {
                this.sendMazewarBroadcast();
            }
        }

        addEventListener(eventStr, callback) {
            this.eventListeners[eventStr].push(callback);
        }

        dispatchEvent(eventStr, ...args) {
            for(var i = 0; i < this.eventListeners[eventStr].length; i++) {
                this.eventListeners[eventStr][i].apply(null, args);
            }
        }

        initRatStatus() {
            this.ratStatus = {
                dukeRat: 0,
                rats: []
            };
            for(var i = 0; i < 8; i++) {
                this.ratStatus.rats[i] = {
                    playing: 0,
                    yLoc:    0,
                    xLoc:    0,
                    dir:     0,
                    score:   0,
                    addr:    0,
                    name:    ""
                };
            }
        }

        provideService(requestObj) {
            switch(requestObj.dstSock) {
                case this.SocketVersion20:
                    return this.provideService_v20(requestObj);
                    break;
                case this.SocketVersion35:
                    console.log("TODO: Not implemented");
                    break;
            }
        }

        provideService_v20(requestObj) {
            var reply = null;
            switch(requestObj.pupType) {
                case this.MazeWarBroadcast:
                    if(this.state === ParticipantState.iAmTheDuke) {
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
                    switch(this.state) {
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
                    if(this.state === ParticipantState.iAmTheDuke) {
                        PupMazeWarPackets.decodeRatNew(requestObj.reader, this.ratNew);
                        reply = this.replyToInvitationRequest(requestObj);
                    }
                    break;
                case this.MazeWarRatGone:
                    PupMazeWarPackets.decodeRatGone(requestObj.reader, this.ratGone);
                    console.log("Rat Gone:", this.ratGone);
                    break;
                case this.MazeWarRatQuery:
                    PupMazeWarPackets.decodeRatQuery(requestObj.reader, this.ratQuery);
                    reply = this.replyToRatQuery(requestObj);
                    break;
                case this.MazeWarRatQueryReply:
                    PupMazeWarPackets.decodeRatQuery(requestObj.reader, this.ratQuery);
                    console.log("Rat Query Reply:", this.ratQuery);
                    break;
            }
            return reply;
        }

        newMazeWarFrame(replyType, payloadSize) {
            return super.newPupFrame({
                    pupType:       replyType,
                    pupIdentifier: 0,
                    dstId:         0,
                    dstNet:        0,
                    dstHost:       0,
                    dstSock:       this.SocketVersion20,
                    srcId:         this.server.pupServerAddr,
                    srcNet:        this.server.pupServerNet,
                    srcHost:       this.server.pupServerAddr,
                    srcSock:       this.SocketVersion20
                },
                payloadSize
            );
        }

        makeRatNewPacket(requestObj) {
            var frameWriter = this.newPupReply(
                requestObj,
                this.MazeWarRatNew,
                this.MazeWarRatNewSize
            );
            PupMazeWarPackets.encodeRatNew(frameWriter, this.ratNew);
            return frameWriter;
        }

        forAllRats(func, defaultValue) {
            for(var ratId = 0; ratId < 8; ratId++) {
                var rat = this.ratStatus.rats[ratId];
                var val = func(rat, ratId);
                if(val) {
                    return val;
                }
            }
            return defaultValue;
        }

        get multicastAddresses() {
            var addrs = [];
            this.forAllRats((rat, ratId) => {
                if(rat.playing && rat.addr !== this.server.pupServerAddr) {
                    addrs.push(rat.addr);
                }
            });
            return addrs;
        }

        findUnoccupiedRatId() {
            return this.forAllRats((rat, ratId) => {
                if(!rat.playing) {
                    return ratId;
                }
            }, -1);
        }

        findMyRatId() {
            return this.forAllRats((rat, ratId) => {
                if(rat.playing && rat.addr === this.server.pupServerAddr) {
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

        sendMazewarBroadcast() {
            console.log("Sending out Maze War broadcast");
            this.ratNew.pass = this.MazeWarPassword;
            this.ratNew.addr = this.server.pupServerAddr;

            var frameWriter = this.newMazeWarFrame(this.MazeWarBroadcast, this.MazeWarRatNewSize);
            PupMazeWarPackets.encodeRatNew(frameWriter, this.ratNew);
            this.sendFrame(frameWriter.frame);

            // Wait for a reply to our broadcast

            function ifNoReply() {
                if(this.state === ParticipantState.waitingForBroadcastReply) {
                    var rat     = this.ratStatus.rats[0];
                    rat.playing = 1;
                    rat.addr    = this.server.pupServerAddr;
                    rat.name    = this.initialPlayer.name;
                    rat.xLoc    = this.initialPlayer.xLoc;
                    rat.yLoc    = this.initialPlayer.yLoc;
                    rat.dir     = this.initialPlayer.dir;

                    console.log("I am now the duke");
                    this.state = ParticipantState.iAmTheDuke;
                    this.dispatchEvent("newGame", 0, rat);
                }
            }
            this.state = ParticipantState.waitingForBroadcastReply;
            setTimeout(ifNoReply.bind(this), 5000);
        }

        replyToMazewarBroadcast(requestObj) {
            if(this.state === ParticipantState.iAmTheDuke) {
                console.log("Responding to broadcast with participant list");
                this.sendRatStatus(requestObj.srcHost);
            }
        }

        makeInvitationRequest(requestObj) {
            var ratId = this.findUnoccupiedRatId();
            if(ratId === -1) {
                console.log("Ignoring offer, game is full");
                return;
            }

            console.log("Requesting to join available game");
            this.state = ParticipantState.waitingForInvitation;
            this.ratNew.pass = this.MazeWarPassword;
            this.ratNew.addr = this.server.pupServerAddr;
            this.ratNew.xLoc = this.initialPlayer.xLoc;
            this.ratNew.yLoc = this.initialPlayer.yLoc;
            this.ratNew.dir  = this.initialPlayer.dir;
            this.ratNew.name = this.initialPlayer.name;
            return this.makeRatNewPacket(requestObj);
        }

        replyToInvitationRequest(requestObj) {
            var ratId = this.findUnoccupiedRatId();
            if(ratId === -1) {
                return;
            }

            console.log("Joining player to game");
            var rat = this.ratStatus.rats[ratId];
            rat.playing = 1;
            rat.addr    = this.ratNew.addr;
            rat.xLoc    = this.ratNew.xLoc;
            rat.yLoc    = this.ratNew.yLoc;
            rat.dir     = this.ratNew.dir;
            rat.name    = this.ratNew.name;
            this.dispatchEvent("ratUpdate", ratId, rat);

            // Send updated rat status to all players
            this.sendRatStatus();
        }

        acceptInvitation() {
            var ratId = this.findMyRatId();
            if(ratId === -1) {
                return;
            }
            console.log("I am now a game participant with ratId", ratId);
            this.state = ParticipantState.iAmParticipant;
            var rat = this.ratStatus.rats[ratId];
            this.dispatchEvent("newGame", ratId, rat);
            this.updateFromStatus();
        }

        // Methods for replying to rat queries

        makeRatQueryPacket(requestObj) {
            var frameWriter = this.newPupReply(
                requestObj,
                this.MazeWarRatQueryReply,
                this.MazeWarRatQueryReplySize
            );
            PupMazeWarPackets.encodeRatQuery(frameWriter, this.ratQuery);
            return frameWriter;
        }

        replyToRatQuery(requestObj) {
            console.log("Replying to rat query");
            var ratId = this.findMyRatId();
            this.ratQuery.ratId = this.ratId;
            return this.makeRatQueryPacket(requestObj);
        }

        // Methods to receive state updates

        updateFromRatLocation() {
            var ratId = this.ratLocation.ratId;
            var rat   = this.ratStatus.rats[ratId];
            rat.xLoc  = this.ratLocation.xLoc;
            rat.yLoc  = this.ratLocation.yLoc;
            rat.dir   = this.ratLocation.dir;
            rat.score = this.ratLocation.score;
            this.dispatchEvent("ratUpdate", ratId, rat);
        }

        updateFromStatus() {
            this.forAllRats((rat, ratId) => {
                if(rat.playing && rat.addr !== this.server.pupServerAddr) {
                    this.dispatchEvent("ratUpdate", ratId, rat);
                }
            });

            if(this.ratStatus.rats[this.ratStatus.dukeRat].addr === this.server.pupServerAddr) {
                console.log("I've been promoted to duke");
                this.state = ParticipantState.iAmTheDuke;
            }
        }

        updateRatKill() {
            var ratId = this.ratKill.ratId;
            var rat   = this.ratStatus.rats[ratId];
            this.dispatchEvent("ratKill", ratId, rat);
        }

        updateRatDead() {
            var ratId     = this.ratDead.ratId;
            var killedBy  = this.ratDead.killedBy;
            this.dispatchEvent("ratDead", ratId, killedBy);
        }

        // Methods to send state updates

        setRatPosition(ratId, xLoc, yLoc) {
            var rat = this.ratStatus.rats[ratId];
            rat.xLoc  = xLoc;
            rat.yLoc  = yLoc;
            this.sendRatLocation(ratId);
        }

        setRatDirection(ratId, dir) {
            var rat = this.ratStatus.rats[ratId];
            rat.dir  = dir;
            this.sendRatLocation(ratId);
        }

        ratShoots(ratId) {
            var rat = this.ratStatus.rats[ratId];
            this.sendRatKill(ratId);
        }

        ratKilled(ratId, killedBy) {
            var rat = this.ratStatus.rats[ratId];
            this.sendRatDead(ratId, killedBy);
        }

        sendRatLocation(ratId) {
            var rat = this.ratStatus.rats[ratId];
            this.ratLocation.ratId = ratId;
            this.ratLocation.xLoc  = rat.xLoc;
            this.ratLocation.yLoc  = rat.yLoc;
            this.ratLocation.dir   = rat.dir;
            this.ratLocation.score = rat.dir;

            var frameWriter = this.newMazeWarFrame(this.MazeWarRatLocation, this.MazeWarRatLocationSize);
            PupMazeWarPackets.encodeRatLocation(frameWriter, this.ratLocation);
            this.multicastFrame(frameWriter.frame, this.multicastAddresses);
        }

        sendRatKill(ratId) {
            var rat = this.ratStatus.rats[ratId];
            this.ratKill.ratId = ratId;
            this.ratKill.xLoc  = rat.xLoc;
            this.ratKill.yLoc  = rat.yLoc;
            this.ratKill.dir   = rat.dir;

            var frameWriter = this.newMazeWarFrame(this.MazeWarRatKill, this.MazeWarRatKillSize);
            PupMazeWarPackets.encodeRatKill(frameWriter, this.ratKill);
            this.multicastFrame(frameWriter.frame, this.multicastAddresses);
        }

        sendRatDead(ratId, killedBy) {
            this.ratDead.ratId    = ratId;
            this.ratDead.killedBy = killedBy;

            var frameWriter = this.newMazeWarFrame(this.MazeWarRatDead, this.MazeWarRatDeadSize);
            PupMazeWarPackets.encodeRatDead(frameWriter, this.ratDead);
            this.multicastFrame(frameWriter.frame, this.multicastAddresses);
        }

        sendRatStatus(address) {
            var frameWriter = this.newMazeWarFrame(this.MazeWarRatStatus, this.MazeWarRatStatusSize);
            PupMazeWarPackets.encodeRatStatus(frameWriter, this.ratStatus);
            this.multicastFrame(frameWriter.frame, address ? [address] : this.multicastAddresses);
        }
    }
})(window.RetroWeb = window.RetroWeb || {});