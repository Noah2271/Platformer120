import { PlayerControls } from './Player.js';

export class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    create() {
        // Create tilemap and layers
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.collidableLayer1 = this.map.createLayer("Collidables-One", this.tileset, 0, 0);
        this.collidableLayer2 = this.map.createLayer("Collidables-Two", this.tileset, 0, 0);
        this.decorationLayer = this.map.createLayer("Decorations", this.tileset, 0, 0);

        this.groundLayer.setScale(2.0);
        this.collidableLayer1.setScale(2.0);
        this.collidableLayer2.setScale(2.0);
        this.decorationLayer.setScale(2.0);

        // Enable collisions
        this.groundLayer.setCollisionByProperty({ collides: true });
        this.collidableLayer1.setCollisionByProperty({ collides: true });
        this.collidableLayer2.setCollisionByProperty({ collides: true });

        // Cursor input
        this.cursors = this.input.keyboard.createCursorKeys();

        // Player creation and controls
        this.playerControls = new PlayerControls(this, this.cursors);
        const player = this.playerControls.getSprite();

        // Enable collision with tilemap
        this.physics.add.collider(player, this.groundLayer, null, this.oneWayPlatformCollide, this);
        this.physics.add.collider(player, this.collidableLayer1, null, this.oneWayPlatformCollide, this);
        this.physics.add.collider(player, this.collidableLayer2, null, this.oneWayPlatformCollide, this);
        // for the actual game, make platforms a separate collider than wall objects
        // Debug toggle with D key
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = !this.physics.world.drawDebug;
            this.physics.world.debugGraphic.clear();
        }, this);
    }

    oneWayPlatformCollide(player, tile) {
        return player.body.velocity.y >= 1;
    }

    update() {
        this.playerControls.update();
    }
}