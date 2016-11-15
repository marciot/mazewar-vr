var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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
    namespace.FrameWriter = function () {
        function _class(frame) {
            _classCallCheck(this, _class);

            this.frame = frame;
            this.index = 0;
        }

        _createClass(_class, [{
            key: "skip",
            value: function skip(bytes) {
                this.index += bytes;
            }
        }, {
            key: "seek",
            value: function seek(pos) {
                this.index = pos;
            }
        }, {
            key: "_checkRange",
            value: function _checkRange() {
                if (this.index >= this.frame.length) {
                    throw "Writing past end of frame";
                }
            }
        }, {
            key: "byte",
            set: function (val) {
                this._checkRange();
                this.frame[this.index++] = val;
            }
        }, {
            key: "word",
            set: function (val) {
                this._checkRange();
                this.frame[this.index++] = (val & 0xFF00) >> 8;
                this.frame[this.index++] = val & 0x00FF;
            }
        }, {
            key: "long",
            set: function (val) {
                this._checkRange();
                this.frame[this.index++] = (val & 0xFF000000) >> 24;
                this.frame[this.index++] = (val & 0x00FF0000) >> 16;
                this.frame[this.index++] = (val & 0x0000FF00) >> 8;
                this.frame[this.index++] = val & 0x000000FF;
            }
        }, {
            key: "char",
            set: function (c) {
                this.byte = c.charCodeAt(0);
            }
        }, {
            key: "str",
            set: function (str) {
                for (var i = 0; i < str.length; i++) {
                    this.byte = str.charCodeAt(i);
                }
            }
        }, {
            key: "hex",
            set: function (str) {
                for (var i = 0; i < str.length; i += 2) {
                    this.byte = parseInt(str.substr(i, 2), 16);
                }
            }
        }, {
            key: "offset",
            get: function () {
                return this.index;
            }
        }]);

        return _class;
    }();

    namespace.FrameReader = function () {
        function _class2(frame) {
            _classCallCheck(this, _class2);

            this.frame = frame;
            this.index = 0;
        }

        _createClass(_class2, [{
            key: "str",
            value: function str(len) {
                var str = "";
                for (var i = 0; i < len; i++) {
                    str += this.char;
                }
                return str;
            }
        }, {
            key: "skip",
            value: function skip(bytes) {
                this.index += bytes;
            }
        }, {
            key: "seek",
            value: function seek(pos) {
                this.index = pos;
            }
        }, {
            key: "_checkRange",
            value: function _checkRange() {
                if (this.index >= this.frame.length) {
                    throw "Reading past end of frame";
                }
            }
        }, {
            key: "byte",
            get: function () {
                this._checkRange();
                return this.frame[this.index++];
            }
        }, {
            key: "word",
            get: function () {
                this._checkRange();
                return this.frame[this.index++] << 8 | this.frame[this.index++];
            }
        }, {
            key: "long",
            get: function () {
                this._checkRange();
                return this.frame[this.index++] << 24 | this.frame[this.index++] << 16 | this.frame[this.index++] << 8 | this.frame[this.index++];
            }

            // Return as a printable char

        }, {
            key: "char",
            get: function () {
                var val = this.byte;
                if (val >= 32 && val <= 127) {
                    // Only return printable chars
                    return String.fromCharCode(val);
                } else {
                    return ".";
                }
            }
        }, {
            key: "offset",
            get: function () {
                return this.index;
            }
        }]);

        return _class2;
    }();

    namespace.frameDump = function (frame, start, end) {
        var hex = "";
        var str = "";
        start = start || 0;
        end = Math.min(end || frame.length, frame.length);
        for (var i = start; i < end; i++) {
            var c = frame[i];
            var hexByte = c.toString(16);
            hex += hexByte.length == 2 ? hexByte : '0' + hexByte;
            str += c >= 32 && c <= 127 ? String.fromCharCode(c) : '.';
        }
        return "" + (end - start) + " bytes: " + hex + " " + str;
    };
})(window.RetroWeb = window.RetroWeb || {});