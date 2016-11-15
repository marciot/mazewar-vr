var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Tween = function () {
    function Tween() {
        _classCallCheck(this, Tween);

        this.tasks = [];
    }

    _createClass(Tween, [{
        key: "add",
        value: function add(duration, easing, task, min, max) {
            this.tasks.push({
                duration: duration,
                task: task,
                value: 0,
                easing: easing ? easing : function (t) {
                    return t;
                },
                min: min || 0,
                max: max || 1
            });
            update(0);
        }
    }, {
        key: "update",
        value: function update(dt) {
            for (var i = 0; i < this.tasks.length; i++) {
                var t = this.tasks[i];

                t.value += dt / t.duration;
                if (t.value > 1) {
                    this.tasks.splice(i, 1);
                } else {
                    var t0 = t.easing(t.value, 0, 1, 1);
                    t.task((t.max - t.min) * t0 + t.min);
                }
            }
        }
    }]);

    return Tween;
}();

;