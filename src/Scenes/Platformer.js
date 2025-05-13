import { PlayerControls } from './Player.js';

export class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    preload() {
    this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    this.load.bitmapFont('pixelText', './assets/minogram_6x10.png', './assets/minogram_6x10.xml');

    }
create() {
    this.score = 0;
    this.signs = [];
    this.tKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    this.tTold = false;
    this.textSound = this.sound.add("dialogue")
    this.boomSound = this.sound.add("boom");
    this.spawnpointX = this.game.config.width / 19;
    this.spawnpointY = this.game.config.height / 1.4;
    this.lives = 3;

    // Create tilemap and layers
    this.map = this.make.tilemap({ key: "platformer-level-1" });
    this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");
    this.backgroundset = this.map.addTilesetImage("kenny_background", "background_tiles");

    this.parallaxLayerOne = this.map.createLayer("Parallax-1", this.backgroundset, 0,0);
    this.groundLayerBacked = this.map.createLayer("Background-Ground", this.tileset, 0, 0);
    this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0);
    this.decorationLayer = this.map.createLayer("Decoration", this.tileset, 0, 0);
    this.decorationLayerTwo = this.map.createLayer("Decoration-2", this.tileset, 0, 0);
    this.coinLayer = this.map.createLayer("Coin", this.tileset, 0, 0);
    this.signLayer = this.map.createLayer("SignLayer", this.tileset, 0,0);
    this.groundLayer.setScale(2.0);
    this.groundLayerBacked.setScale(2.0);
    this.decorationLayer.setScale(2.0);
    this.decorationLayerTwo.setScale(2.0);
    this.coinLayer.setScale(2.0);
    this.signLayer.setScale(2.0);
    this.parallaxLayerOne.setScale(2.0);

    // Parallax
    this.parallaxLayerOne.setScrollFactor(0.5); 


    // Enable collisions
    this.groundLayer.setCollisionByProperty({ collides: true });
    this.groundLayerBacked.setCollisionByProperty({ collides: true });
    this.coinLayer.setCollisionByExclusion([-1]);

    // Enable Animations / Sound
    this.animatedTiles.init(this.map);
    this.coinSound = this.sound.add('coinCollect');

    // Cursor input
    this.cursors = this.input.keyboard.createCursorKeys();

    // Player creation and controls
    this.playerControls = new PlayerControls(this, this.cursors);
    this.player = this.playerControls.getSprite();
    this.player.setPosition(this.spawnpointX, this.spawnpointY);

    // Cam
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);
    this.cameras.main.roundPixels = true;
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setDeadzone(100, 100); 

    // Colliders
    this.physics.add.collider(this.player, this.groundLayer, this.handleDeadlyTiles, this.oneWayPlatformCollide, this);
    this.physics.add.collider(this.player, this.groundLayerBacked, this.handleDeadlyTiles, this.oneWayPlatformCollide, this);
    this.physics.add.overlap(this.player, this.coinLayer, this.collectCoin, null, this)
    
    // Debug Key
    this.input.keyboard.on('keydown-D', () => {
        this.physics.world.drawDebug = !this.physics.world.drawDebug;
        this.physics.world.debugGraphic.clear();
    }, this);

    // special depths
    this.decorationLayer.setDepth(10); // Decoration on top
    this.player.setDepth(5);            // Player below
    // Text
    // Stat Texts

    this.scoreText = this.add.text(16, 16, 'Score: 0', {fontFamily: 'Silkscreen', fontSize: '24px', color: '#000000'})
    .setScrollFactor(0);
    this.liveText = this.add.text(16, 40, 'Lives: 3', {fontFamily: 'Silkscreen', fontSize: '24px', color: '#000000'})
    .setScrollFactor(0);
    // Dialogue Frame
    this.box = this.add.graphics()
        .fillStyle(0x000000, 0.7)
        .lineStyle(4, 0x80EF80, 1)
        .setScrollFactor(0)
        .setVisible(false);
        
    // Sign Text Box Real
    this.dialogueBox = this.add.text(50, 750, '', {fontFamily: 'Silkscreen', fontSize: '24px', color: '#80EF80'})
        .setScrollFactor(0)
        .setVisible(false);

    // Sign Prompt For Starters
    this.pressTPrompt = this.add.text(this.player.x, this.player.y - 40, 'Press T to read signs!', { fontFamily: 'SilkScreen', fontSize: '16px', color: '#FFFFFF' })
        .setOrigin(0.5)
        .setScrollFactor(0) 
        .setVisible(false);

    // Object layer for signs handling, get text property
    const signObjects = this.map.getObjectLayer("Sign").objects;                            // Get the Object Layers Objects

    this.signs = this.physics.add.staticGroup();                                            // Assign the objects to a static group, no physics

    signObjects.forEach(sign => {                                                           // For each object, create hitbox at its position (scale by 2 since original scale)
        const hitbox = this.signs.create(sign.x * 2, sign.y * 2, 'blank') // good
            .setOrigin(0, 1)
            .setDisplaySize(sign.width, sign.height)
            .setVisible(false); // invisible
        if (sign.properties) {                                                              // If the sign has a text value, store it w/ the hitbox to grab in showSignText
            sign.properties.forEach(p => {
                hitbox[p.name] = p.value;
            });
        }
    });
    this.physics.add.overlap(this.player, this.signs, this.showSignText, null, this);       // Create physics overlap between player and the signs that call showSignText on overlap.
}

    // Called when player is in overlap with a sign/text object from the objectlayer
showSignText(player, sign) {
    if (Phaser.Input.Keyboard.JustDown(this.tKey)) {                                        // Called whenever overlapping. If press T on overlap, fetch .Text property and set
        console.log(sign.Text);                                                             // dialogue visibility to true
        this.textSound.play();
        this.dialogueBox.setText(sign.Text);            
        this.box.setVisible(true);
        this.dialogueBorderUpdate();
        this.dialogueBox.setVisible(true);
        this.tTold = true;
    }
}

    // Dynamically update the textbox to match the length of the dialogue
dialogueBorderUpdate(){
    const padding = 10;
    const textWidth = this.dialogueBox.width;   // get width and height of text for measurement
    const textHeight = this.dialogueBox.height;
    const boxWidth = textWidth + padding * 2;   // get box dimensions based off text
    const boxHeight = textHeight + padding * 2;
    this.box.clear();                           // destroy the previous box
    this.box.fillStyle(0x000000, 0.7);          // below sets the new box
    this.box.fillRect(this.dialogueBox.x - padding, this.dialogueBox.y - padding, boxWidth, boxHeight);
    this.box.lineStyle(2, 0xffffff, 1);
    this.box.strokeRect(this.dialogueBox.x - padding, this.dialogueBox.y - padding, boxWidth, boxHeight);
}

    // One Way Pass Filter For Platforms
oneWayPlatformCollide(player, tile) {
    return player.body.velocity.y >= 1;
}

    // Player 'death' Restart Function
handleDeadlyTiles(player, tile) {
    if(tile.properties.deadly){
        console.log("bals");
        const biboBoom = this.add.sprite(this.player.x, this.player.y, 'biboBoom');
        biboBoom.setScale(0.2);
        biboBoom.setBlendMode(Phaser.BlendModes.SCREEN);
        biboBoom.play('biboBoom');
        this.boomSound.setVolume(0.4);
        this.boomSound.play();
        this.fadeOut(biboBoom, 500, 20);
        this.lives -= 1;
        this.liveText.setText('Lives: ' + this.lives);
        this.player.setPosition(this.spawnpointX, this.spawnpointY);
    }
}


    // Coin Collection Animation + Tracking
collectCoin(player, tile) {
    if (tile.index !== -1) {                                                                // For all nonempty tiles
        const scale = 2;                                                                    // Amount scaled every tile by, to match position
        const tileWorldX = tile.pixelX * scale + (tile.width * scale / 2);                  // Get position of the Tile Collided with
        const tileWorldY = tile.pixelY * scale + (tile.height * scale / 2);
        this.coinLayer.removeTileAt(tile.x, tile.y);                                        // Then destroy it

        const coinSprite = this.add.image(tileWorldX-55, tileWorldY-110, 'tilemap_tiles');  // Create Coin sprite ripped from tile sheet directly on the player-- offset of -55 -110 because of position on the sheet when we cropped
        
        coinSprite.setCrop(                                                                 // Crop the Tilesheet around the Coin
            ((151) % this.tileset.columns) * 18,                                            // Get the Column Position of the coin, multiply by 18, that is the x position of it on the sheet
            Math.floor((151) / this.tileset.columns) * 18, 18, 18                           // Get the row position of the coin, multiply by 18, that is the y position
        );

        coinSprite.setScale(scale);                                                         // Scale appropriate to the rest of the tiles=
                                                                                            // Handle Like a particle from Player.js
        this.fadeOut(coinSprite, 500, 20);
        this.score += 1;                                                                    // increment Score, play sound
        this.scoreText.setText('Coin: ' + this.score);
        this.coinSound.setVolume(0.4);
        this.coinSound.play();
    }
}

    // Tween from player.js
fadeOut = (particle, duration, float) => {
    this.tweens.add({
        targets: particle,
        alpha: 0,            
        y: particle.y - float,  
        duration: duration,       
        ease: 'Linear',
        onComplete: () => {
            particle.destroy(); 
        }
    });
}

    // Update Function
update() {
    this.playerControls.update();
        const touchingSign = this.physics.overlap(this.player, this.signs);

    // Hide text, maybe change from "Sign" vars later since signs won't be the only thing that cause text, maybe.
    if (!touchingSign) { 
        this.dialogueBox.setVisible(false);
        this.box.setVisible(false);
    }
    // Prompt For starters implementation
    if (touchingSign && this.tTold == false) {
        this.pressTPrompt.setVisible(true);
        this.pressTPrompt.x = this.player.x;
        this.pressTPrompt.y = this.player.y - 40;
    } else {
        this.pressTPrompt.setVisible(false);

    }
}
}
