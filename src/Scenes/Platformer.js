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
    this.scoreText = this.add.bitmapText(16, 16, 'pixelText', 'Coin: 0', 32);
    this.scoreText.setTintFill(0xFFFF00);
    this.signs = [];
    this.tKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);


    // Create tilemap and layers
    this.map = this.make.tilemap({ key: "platformer-level-1" });
    this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

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

    // Cam
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1); 
    this.cameras.main.setZoom(1.2);                                                         // Note: Causes Some Visual Artifacts
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

    // Sign Text Box Shadow
    this.dialogueBoxShadow = this.add.bitmapText(452, 700 + 2, 'pixelText', "", 24)
        .setScrollFactor(0)
        .setTintFill(0x000000)  // Black color
            .setBlendMode(Phaser.BlendModes.MULTIPLY)
        .setVisible(false);

    // Sign Text Box Real
    this.dialogueBox = this.add.bitmapText(450, 700, 'pixelText', "", 24)
        .setScrollFactor(0)
        .setTintFill(0xFFFFFF)  // White color (optional if your font is already white)
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

showSignText(player, sign) {
    if (Phaser.Input.Keyboard.JustDown(this.tKey)) {                                        // Called whenever overlapping. If press T on overlap, fetch .Text property and set
            console.log(sign.Text);                                                         // dialogue visibility to true
        this.dialogueBox.setText(sign.Text);            
        this.dialogueBox.setVisible(true);
        this.dialogueBoxShadow.setText(sign.Text);
        this.dialogueBoxShadow.setVisible(true);
        
    }
}

    // One Way Pass Filter For Platforms
oneWayPlatformCollide(player, tile) {
    return player.body.velocity.y >= 1;
}

    // Player 'death' Restart Function
handleDeadlyTiles(player, tile) {
    if(tile.properties.deadly){
        console.log("bals");
        this.scene.restart();
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
    

    }
}
