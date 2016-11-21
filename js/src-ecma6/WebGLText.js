class OverlayText {
    constructor(camera) {
        const fontName   = "gentilis";
        const fontWeight = "regular";

        var loader = new THREE.FontLoader();

        loader.load( 'fonts/' + fontName + '_' + fontWeight + '.typeface.json', response => {
            this.font = response;
            this.createText();
        } );

        this.obj = new THREE.Object3D();
        this.obj.add(camera);
        this.camera = camera;

        this.meshes = [];

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
            "I can see your house.\nDown there yonder.",
            "You are a looker.",
            "'Twas not a twinkle in your eye,\nbut a rapidly approaching missile.",
            "The walls are closing\nin on you. You panic.",
            "They encircle you, like\nvultures circle roadkill.",
            "Your eyes are bloodshot;\nYou body will be bloody.",
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
    }

    createText(str) {
        var strLines = this.text.split('\n');

        var lines = [];
        for(var i = 0; i < strLines.length; i++) {
            var text = strLines[i];
            var geometry = new THREE.TextGeometry( text, {
                font: this.font,
                size: 0.03,
                height: 0.0001
                });
            geometry.computeBoundingBox();            
            var line = {
                geometry: geometry,
                text:     text,
                width:    geometry.boundingBox.max.x - geometry.boundingBox.min.x,
                height:   geometry.boundingBox.max.y - geometry.boundingBox.min.y,
            }
            lines.push(line);
        }

        // Compute the summed height and the maximum width
        var summedHeight = 0;
        var maxWidth     = 0;
        for(var i = 0; i < lines.length; i++) {
            var line = lines[i];
            summedHeight += line.height;
            maxWidth     = Math.max(line.width, maxWidth);
        }

        // Compute the distance at which the text spans the indicated
        // percentage of the view port.
        const coverage = 0.50;
        const halfFovInRadians = this.camera.fov/2 * Math.PI/180;
        const distance = (maxWidth/coverage) / (2*Math.tan(halfFovInRadians));

        // Place the text on the screen
        var startY = 0.5 * summedHeight;
        for(var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var textMesh = new THREE.Mesh(line.geometry, theme.textMaterial);
            textMesh.position.z = -distance;
            textMesh.position.x = -0.5 * maxWidth;
            textMesh.position.y = startY;
            this.obj.add(textMesh);
            this.meshes.push(textMesh);

            // Delete references so the array can be disposed
            line.geometry = null;
            line.text     = null;

            // Advance ti next line
            startY -= line.height;
        }
    }

    disposeText() {
        for(var i = 0; i < this.meshes.length; i++) {
            var textMesh = this.meshes[i];
            this.obj.remove(textMesh);
            textMesh.geometry.dispose();
        }
        this.meshes = [];
    }

    chooseText() {
        this.disposeText();
        this.text = this.textList[Math.floor(Math.random() * this.textList.length)];
        this.createText();
    }

    get representation() {
        return this.obj;
    }
}
