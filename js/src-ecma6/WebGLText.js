class OverlayText {
    constructor(camera) {
        this.fontSizeInPixels = 50;

        this.obj = new THREE.Object3D();
        this.obj.add(camera);
        this.camera = camera;

        /* Punish the player for dying with horrible aphorisms */
        this.textList = [
            "A battle rages in the heavens;\nthose who blink will fall.",
            "There is no end; there\nis only a beginning.",
            "The path before you is narrow;\nbut your direction is true.",
            "You must face your\nenemies eye to eye.",
            "As above, so below.",
            "I spy a maniac eye.",
            "Walls are an illusion;\nspace is big.",
            "Turn not a blind eye to\nthose who harmed you.",
            "There is beauty before your eye,\nbut certain death right behind it.",
            "Before long, the hunter\nshall become the hunted.",
            "Whatever you do,\ndon't look down.",
            "If you feel trapped,\nyou feel correctly.",
            "This is a dream;\nyou will never awaken.",
            "I can see your house.\nDown yonder.",
            "You are a looker.",
            "'Twas not a twinkle in your eye,\nbut a rapidly approaching missile.",
            "The walls are closing\nin on you. You panic.",
            "They encircle you, like\nvultures circle roadkill.",
            "Your eyes are bloodshot;\nYour body will be bloody.",
            "When the devil looks you in the\neye, an evil eye looks back.",
            "An eye for an eye;\nthat's quite nice.",
            "The eye is the window to the soul;\nyour window's gonna get busted.",
            "Things are about to take\na turn for the worse.",
            "Whichever way you go,\nit will end badly.",
            "All eyes are on you.",
            "Have no fear; your death\nwill be painless and swift.",
            "You are the wind beneath my\nwings; it smells of farts.",
            "Ewww, your cornea is showing.",
            "I see what you did there.",
            "You will rue the day\nyou laid eye on me.",
            "You fell from grace;\nright on your face.",
            "In the blink of\nan eye; you'll die.",
            "Eye can't fly?\nNice try!",
            "Bat an eye,\nout of the ballpark.",
            "Run with scissors;\nput an eye out.",
            "There's more to this\nthan meets the eye.",
            "You need eyes on the\nback of your eye.",
            "Let the eyes roll!",
            "If you run, you might\ncatch someone's eye.",
            "Someone's making a\nfall guy out of you.",
            "Ouch, that was an eyesore!"
        ];

        this.text = this.textList[0];

        this.canvas   = document.createElement("canvas");
        this.texture  = new THREE.Texture(this.canvas);
        this.material = new THREE.MeshBasicMaterial({
            color:       0xffffff,
            shading:     THREE.FlatShading,
            map:         this.texture,
            side:        THREE.FrontSide,
            transparent: true,
            opacity:     0,
            visible:     false
        });

        var geometry = new THREE.PlaneBufferGeometry(1, 1);
        this.plane   = new THREE.Mesh(geometry, this.material);
        this.obj.add(this.plane);

        this.chooseText();
    }

    getCanvasContext() {
        var ctx = this.canvas.getContext("2d");
        ctx.font = this.fontSizeInPixels + "px bold serif";
        ctx.textBaseline = "bottom";
        return ctx;
    }

    createText(str) {
        const strLines = str || this.text.split('\n');

        var ctx = this.getCanvasContext();

        var lines = [];
        for(var i = 0; i < strLines.length; i++) {
            var text = strLines[i];
            var line = {
                text:     text,
                width:    ctx.measureText(text).width,
                height:   this.fontSizeInPixels
            }
            lines.push(line);
        }

        // Compute the summed height and the maximum width
        var summedHeight = 0;
        var maxWidth     = 0;
        for(var i = 0; i < lines.length; i++) {
            const line = lines[i];
            summedHeight += line.height;
            maxWidth     = Math.max(line.width, maxWidth);
        }

        // Adjust the canvas to fit the max width
        this.canvas.width  = maxWidth;
        this.canvas.height = summedHeight;

        var ctx = this.getCanvasContext();

        // Compute the width at which the text spans the indicated
        // percentage of the view port.
        const coverage = 0.50;
        const halfFovInRadians = this.camera.fov/2 * Math.PI/180;
        //const distance = (glWidth/coverage) /(2*Math.tan(halfFovInRadians));
        const distance = MazeWalls.cellDimension/2 * 0.9;
        const glWidth = distance * (2*Math.tan(halfFovInRadians)) * coverage;

        // Paint the text on the canvas
        var startY = 0;
        for(var i = 0; i < lines.length; i++) {
            startY += line.height;
            ctx.fillText(lines[i].text, 0, startY);
        }

        this.texture.needsUpdate = true;
        this.plane.scale.set(glWidth, glWidth * summedHeight/maxWidth, 1);
        this.plane.position.z = -distance;
    }

    setText(str) {
        this.text = str;
        this.createText();
    }

    chooseText() {
        this.setText(this.textList[Math.floor(Math.random() * this.textList.length)]);
    }

    get representation() {
        return this.obj;
    }

    get textMaterial() {
            return this.material;
    }
}
