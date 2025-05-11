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



    // Create tilemap and layers
    this.map = this.make.tilemap({ key: "platformer-level-1" });
    this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

    this.groundLayerBacked = this.map.createLayer("Background-Ground", this.tileset, 0, 0);
    this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0);
    this.decorationLayer = this.map.createLayer("Decoration", this.tileset, 0, 0);
    this.decorationLayerTwo = this.map.createLayer("Decoration-2", this.tileset, 0, 0);
    this.coinLayer = this.map.createLayer("Coin", this.tileset, 0, 0);

    this.groundLayer.setScale(2.0);
    this.groundLayerBacked.setScale(2.0);
    this.decorationLayer.setScale(2.0);
    this.decorationLayerTwo.setScale(2.0);
    this.coinLayer.setScale(2.0);

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
    const player = this.playerControls.getSprite();

    // Colliders
    this.physics.add.collider(player, this.groundLayer, this.handleDeadlyTiles, this.oneWayPlatformCollide, this);
    this.physics.add.collider(player, this.groundLayerBacked, this.handleDeadlyTiles, this.oneWayPlatformCollide, this);
    this.physics.add.overlap(player, this.coinLayer, this.collectCoin, null, this)

    // Debug Key
    this.input.keyboard.on('keydown-D', () => {
        this.physics.world.drawDebug = !this.physics.world.drawDebug;
        this.physics.world.debugGraphic.clear();
    }, this);
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
