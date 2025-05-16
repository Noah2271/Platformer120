export class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.atlas("platformer_characters", "tilemap-characters-packed.png", "tilemap-characters-packed.json");
        this.load.tilemapTiledJSON('myTilemap', 'assets/platformer-level-1.json');                                          // Properly Load the Tilemap, might adjust so coin uses this now instead of cropping it. Not mandatory though.
        this.load.image('tilemap_packed', 'tilemap_packed.png');
        this.load.spritesheet('kenny_tiles', 'tilemap_packed.png', {
            frameWidth: 18,
            frameHeight: 18,
            margin: 0,
            spacing: 0
        });

        this.load.multiatlas("kenny-particles", "kenny-particles.json");


        // Load tilemap information
        this.load.image("tilemap_tiles", "tilemap_packed.png");                         
        this.load.image("background_tiles", "tilemap-backgrounds_packed.png");
        this.load.tilemapTiledJSON("platformer-level-1", "platformer-level-1.tmj");   
        this.load.image("runParticles1", "dirt_01.png");
        this.load.image("runParticles2", "dirt_02.png");
        this.load.image("runParticles3", "dirt_03.png");
        this.load.image("diveParticles1", "smoke_05.png")
        this.load.image("diveParticles2", "smoke_06.png")
        this.load.image("diveParticles3", "smoke_07.png")
        this.load.image("diveParticles4", "smoke_08.png")
        this.load.image("diveParticles5", "smoke_09.png")
        this.load.image("diveParticles6", "smoke_10.png")
        this.load.image("jumpParticles1", "muzzle_01.png")
        this.load.image("jumpParticles2", "muzzle_02.png")
        this.load.image("jumpParticles3", "muzzle_03.png")
        this.load.image("biboBoomParticles1", "scorch_01.png")
        this.load.image("biboBoomParticles2", "scorch_02.png")
        this.load.image("biboBoomParticles3", "scorch_03.png")
        this.load.audio("stepTest", "sound.wav");
        this.load.audio("stepTest2", "soundTwo.wav");
        this.load.audio("jumpSound", "Jump.wav");
        this.load.audio("dashSound", "Dash.wav");
        this.load.audio("coinCollect", "coinSound.wav");
        this.load.audio("dialogue", "dialogue.wav");
        this.load.audio("boom", "biboBoom.wav");
        this.load.audio("leverPull", "lever.wav")
    }

    create() {

        this.anims.create({
            key: 'biboBoom',
            frames: [
                {key: "biboBoomParticles1"},
                {key: "biboBoomParticles2"},
                {key: "biboBoomParticles3"},
            ],
            frameRate: 10,
            repeat: 1,
            hideOnComplete: true
        });

        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 0,
                end: 1,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'enemyWalk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 18,
                end: 19,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0000.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0001.png" }
            ],
        });

        this.anims.create({
            key: 'runParticles',
            frames: [
                {key: "runParticles1"},
                {key: "runParticles2"},
                {key: "runParticles3"},
            ],
            frameRate: 10,
            repeat: 1,
            hideOnComplete: true
        });

        this.anims.create({
            key: 'divePoof',
            frames: [
                {key: "diveParticles1"},
                {key: "diveParticles2"},
                {key: "diveParticles3"},
                {key: "diveParticles4"},
                {key: "diveParticles5"},
                {key: "diveParticles6"},        
            ],
            frameRate: 10,
            repeat: 0,
            hideOnComplete: true
        });

        this.anims.create({
            key: 'jumpParticles',
            frames: [
                {key: "jumpParticles1"},
                {key: "jumpParticles2"},
                {key: "jumpParticles3"},     
            ],
            frameRate: 10,
            repeat: 0,
            hideOnComplete: true
        });



         // ...and pass to the next Scene
         this.scene.start("platformerScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}