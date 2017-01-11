class Tween {
    constructor() {
        this.tasks = [];
        this.recycledTasks = [];

        this.linearEasing = function(x) {return x};
    }

    add(duration, easing, task, min, max, start, end) {
        var t = this.getNewTask();
        t.duration = duration;
        t.task     = task;
        t.value    = 0;
        t.easing   = easing ? easing : this.linearEasing;
        t.min      = (typeof min   !== "undefined") ? min   : 0;
        t.max      = (typeof max   !== "undefined") ? max   : 1;
        t.start    = (typeof start !== "undefined") ? start : 0;
        t.end      = (typeof end   !== "undefined") ? end   : 1;
        this.tasks.push(t);
        update(0);
    }

    getNewTask() {
        if(this.recycledTasks.length) {
            return this.recycledTasks.pop();
        } else {
            return {};
        }
    }

    recycleTask(index) {
        this.recycledTasks.push(this.tasks[index]);
        this.tasks.splice(index,1);
    }

    update(dt) {
        var lastTaskRan = false;

        for(var i = 0; i < this.tasks.length; i++) {
            var t = this.tasks[i];
            t.value += dt / t.duration;

            // Once t exceeds 1, remove it from task queue, but
            // also run last time with t.value clamped to 1.
            if(t.value > 1) {
                this.recycleTask(i);
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