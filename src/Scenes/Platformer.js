import { PlayerControls } from './Player.js';

export class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    preload() {
    this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    }

create() {
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

    // Enable Animations
    this.animatedTiles.init(this.map);

    // Cursor input
    this.cursors = this.input.keyboard.createCursorKeys();

    // Player creation and controls
    this.playerControls = new PlayerControls(this, this.cursors);
    const player = this.playerControls.getSprite();

    // Colliders
    this.physics.add.collider(player, this.groundLayer, this.handleDeadlyTiles, this.oneWayPlatformCollide, this);
    this.physics.add.collider(player, this.groundLayerBacked, this.handleDeadlyTiles, this.oneWayPlatformCollide, this);

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

    // Update Function
update() {
    this.playerControls.update();
    }
}
