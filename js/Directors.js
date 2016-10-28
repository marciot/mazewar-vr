class Director {
    constructor(actor) {
        this.actor = actor;
    }
}

class RoboticDirector extends Director {
    constructor(actor) {
        super(actor);
        actor.orientTowards(actor.choosePassage());

        actor.representation.setAnimationFinishedCallback(this.animationFinished.bind(this));
    }

    // Chooses a direction by considering all possibilities and
    // giving a bias towards moving forwards.
    chooseDirection() {
        function flipCoin() {
            return Math.floor(Math.random()*2);
        }

        var canGoStraight = this.actor.canWalk(this.actor.facing);
        var canGoLeft     = this.actor.canWalk(Directions.leftFrom(this.actor.facing));
        var canGoRight    = this.actor.canWalk(Directions.rightFrom(this.actor.facing));

        // 1:1 odds of going straight if there is the possibility to turn.
        if(canGoStraight && (!(canGoLeft || canGoRight) || flipCoin())) {
            return this.actor.facing;
        }

        // 1:1 odds of going left or right, or about-face if no other choice.
        if(flipCoin()) {
            // Try to go right, then left, then reverse
            if(canGoRight) {
                return Directions.rightFrom(this.actor.facing);
            } else if(canGoLeft) {
                return Directions.leftFrom(this.actor.facing);
            } else {
                return Directions.oppositeFrom(this.actor.facing);
            }
        } else {
            // Try to go left, then right, then reverse
            if(canGoLeft) {
                return Directions.leftFrom(this.actor.facing);
            } else if(canGoRight) {
                return Directions.rightFrom(this.actor.facing);
            } else {
                return Directions.oppositeFrom(this.actor.facing);
            }
        }
    }

    animationFinished() {
        if(!this.actor.isDead) {
            var direction = this.chooseDirection();
            if(direction == this.actor.facing) {
                this.actor.walk(direction);
            } else {
                this.actor.turnTowards(direction);
            }
        }
    }
}

class KeyboardDirector extends Director {
    constructor(actor) {
        super(actor);
        window.addEventListener('keypress', this.keypressEvent.bind(this));
    }

    keypressEvent(e) {
        switch(String.fromCharCode(e.charCode)) {
            case 'a':
                this.actor.aboutFace();
                break;
            case 's':
                this.actor.turnLeft();
                break;
            case 'd':
                this.actor.walk();
                break;
            case 'f':
                this.actor.turnRight();
                break;
            case 'c':
                this.actor.walkBackwards();
                break;
            case ' ':
                this.actor.shoot();
                break;
        }
    }
}

class TriggerDirector extends Director {
    constructor(actor, container) {
        super(actor);

        this.pressDelay = 200;
        this.pressTimer = null;

        var useTouch = false;
        var me = this;
        container.addEventListener('mousedown',  function(e) {if(!useTouch)  me.triggerPressed(e);});
        container.addEventListener('mouseup',    function(e) {if(!useTouch)  me.triggerRelease(e);});
        container.addEventListener('touchstart', function(e) {useTouch=true; me.triggerPressed(e);});
        container.addEventListener('touchend',   function(e) {useTouch=true; me.triggerRelease(e);});

        this.autoWalk = false;
        actor.representation.setAnimationFinishedCallback(this.animationFinished.bind(this));
    }

    triggerHeld() {
        this.setAutoWalk(true);
    }

    triggerTap() {
        this.actor.shoot();
    }

    triggerPressed(e) {
        if(!this.pressTimer) {
            this.pressTimer = window.setTimeout(function() {
                this.pressTimer = null; this.triggerHeld();
            }.bind(this), this.pressDelay);
        }
        e.preventDefault();
        e.stopPropagation();
    }

    triggerRelease(e) {
        if(this.pressTimer) {
            window.clearTimeout(this.pressTimer);
            this.triggerTap();
            this.pressTimer = null;
        } else {
            this.setAutoWalk(false);
        }
        e.preventDefault();
        e.stopPropagation();
    }

    animationFinished() {
        if(this.autoWalk && !this.actor.isDead) {
            this.actor.walk(this.actor.representation.cardinalDirection);
        }
    }

    setAutoWalk(state) {
        this.autoWalk = state;
        if(this.actor.representation.isStopped) {
            this.actor.walk(this.actor.representation.cardinalDirection);
        }
    }
}
