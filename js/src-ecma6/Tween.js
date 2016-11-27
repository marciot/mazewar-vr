class Tween {
    constructor() {
        this.tasks = [];
    }

    add(duration, easing, task, min, max, start, end) {
        this.tasks.push({
            duration: duration,
            task: task,
            value: 0,
            easing: easing ? easing : t => t,
            min:   (typeof min   !== "undefined") ? min   : 0,
            max:   (typeof max   !== "undefined") ? max   : 1,
            start: (typeof start !== "undefined") ? start : 0,
            end:   (typeof end   !== "undefined") ? end   : 1,
        });
        update(0);
    }

    update(dt) {
        var lastTaskRan = false;

        for(var i = 0; i < this.tasks.length; i++) {
            var t = this.tasks[i];
            t.value += dt / t.duration;

            // Once t exceeds 1, remove it from task queue, but
            // also run last time with t.value clamped to 1.
            if(t.value > 1) {
                this.tasks.splice(i,1);
                t.value = 1;
                if(this.tasks.length === 0) {
                    lastTaskRan = true;
                }
            }

            // tAdjusted ranges from 0 to 1 within the window from t.start to t.end
            var tAdjusted = (t.value - t.start) / (t.end - t.start);
            if(tAdjusted >= 0 && tAdjusted <= 1) {
                var t0 = t.easing(tAdjusted, 0, 1, 1);
                t.task((t.max - t.min)*t0 + t.min);
            }
        }

        if(lastTaskRan && this.callback) {
            this.callback();
        }
    }

    stop() {
        this.tasks = [];
    }

    get isAnimating() {
        return this.tasks.length !== 0;
    }

    whenDone(callback) {
        this.callback = callback;
    }

    static deltaT(task) {
        var lastT = 0;
        return t => {
            task(t, t - lastT);
            lastT = t;
        }
    }
};