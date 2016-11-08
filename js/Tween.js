class Tween {
    constructor() {
        this.tasks = [];
    }

    add(duration, easing, task, min, max) {
        this.tasks.push({
            duration: duration,
            task: task,
            value: 0,
            easing: easing ? easing : t => t,
            min: min || 0,
            max: max || 1
        });
        update(0);
    }

    update(dt) {
        for(var i = 0; i < this.tasks.length; i++) {
            var t = this.tasks[i];

            t.value += dt / t.duration;
            if(t.value > 1) {
                this.tasks.splice(i,1);
            } else {
                var t0 = t.easing(t.value, 0, 1, 1);
                t.task((t.max - t.min)*t0 + t.min);
            }
        }
    }
};