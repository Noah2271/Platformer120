import { PlayerControls } from './Player.js';
import { EnemyControls } from './Enemies.js'
export class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    preload() {
    this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    this.load.bitmapFont('pixelText', './assets/minogram_6x10.png', './assets/minogram_6x10.xml');

    }
create() {
    // BGM
    this.backgroundMusic = this.sound.add('bgm', {
    loop: true,
    volume: 0.05 
    });
    this.backgroundMusic.play();
    // All the variables and sound objects... Could use organization or merging if possible
    this.score = 0;
    this.signs = [];
    this.tKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S); 
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.cKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.tTold = false;
    this.textSound = this.sound.add("dialogue")
    this.boomSound = this.sound.add("boom");
    this.leverSound = this.sound.add("leverPull");
    this.checkpointSound = this.sound.add("spawn");
    this.speechSound = this.sound.add("speech");
    this.winSound = this.sound.add("win");
    this.once = false;
    this.end = false;
    this.stop = false;
    this.spawnpointX =  this.game.config.width / 19;
    this.spawnpointY = this.game.config.height / 1.4;
    this.lives = 3;
    this.isDying = false;
    this.gameOver = false;
    this.gameComplete = false;
    this.leverFrameIndex = 64;
    this.currentRegion = 1;
    this.regionWidth = 1440;
    this.transition = false;
    this.gameStarted = false;
    this.BLT = this.MEATSUB = this.TENFOOTLONG = false;
    this.reset = false;
    this.uiBlip = this.sound.add("ding");
    this.coinSound = this.sound.add('coinCollect');

    // Create tilemap and layers
    this.map = this.make.tilemap({ key: "platformer-level-1" });
    this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");
    this.backgroundset = this.map.addTilesetImage("kenny_background", "background_tiles");              
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);                       
    this.parallaxLayerOne = this.map.createLayer("BackLayer", this.backgroundset, 0,0);
    this.mountainLayer = this.map.createLayer("Mountain", this.tileset, 0,0);    
    this.groundLayerBacked = this.map.createLayer("Background-Ground", this.tileset, 0, 0);
    this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0);
    this.decorationLayer = this.map.createLayer("Decoration", this.tileset, 0, 0);
    this.decorationLayerTwo = this.map.createLayer("Decoration-2", this.tileset, 0, 0);
    this.coinLayer = this.map.createLayer("Coin", this.tileset, 0, 0);
    this.signLayer = this.map.createLayer("SignLayer", this.tileset, 0,0);
    this.impassibleLayer= this.map.createLayer("Blockade", this.tileset, 0,0);
    this.groundLayer.setScale(2.0);
    this.groundLayerBacked.setScale(2.0);
    this.decorationLayer.setScale(2.0);
    this.decorationLayerTwo.setScale(2.0);
    this.coinLayer.setScale(2.0);
    this.signLayer.setScale(2.0);
    this.parallaxLayerOne.setScale(2.0);
    this.impassibleLayer.setScale(2.0);
    this.mountainLayer.setScale(2.0);

    // Parallax
    this.parallaxLayerOne.setScrollFactor(0.5); 

    // Enemies
    this.enemySpawns = [[1854*2, 146*2], [1878*2, 210*2], [1858*2, 266*2], [1000, 300], [1322*2, 262*2], [1142*2, 129*2], [1266*2, 168*2], [1750*2, 102*2], [1695*2, 170*2], [1738*2, 244*2], [1738*2, 328*2], [1717*2, 391*2]] ;                                                               
    this.enemies = this.physics.add.group();
    this.enemyObjects = [];

    // Spawn Enemies at each spawnpoint and push to group
    for (let spawn of this.enemySpawns) {
        const [x, y] = spawn;
        const enemy = new EnemyControls(this, x, y, 'enemySprite', this.groundLayer);
        this.enemies.add(enemy.getSprite());
        enemy.getSprite().deadly = true;
        this.enemyObjects.push(enemy);
    }

    // Sandwich Man NPC
    this.npc = this.physics.add.sprite(3501*2, 258*2, 'player'); // change x/y as needed
    this.npc.anims.play('sandwichMan', true);
    this.npc.body.allowGravity = false;
    this.npc.setImmovable(true);
    this.npc.setScale(2);
    this.npc.setCollideWorldBounds(true); 

    // Setup collision between enemies and ground
    this.physics.add.collider(this.enemies, this.groundLayer);
    
    // Enable collisions for Player
    this.groundLayer.setCollisionByProperty({ collides: true });
    this.groundLayerBacked.setCollisionByProperty({ collides: true });
    this.impassibleLayer.setCollisionByProperty({ collides: true });
    this.coinLayer.setCollisionByExclusion([-1]);

    // Enable Animations 
    this.animatedTiles.init(this.map);

    // Cursor input
    this.cursors = this.input.keyboard.createCursorKeys();

    // Player creation and controls
    this.playerControls = new PlayerControls(this, this.cursors);
    this.player = this.playerControls.getSprite();
    this.player.setVisible(false);
    this.player.setPosition(this.spawnpointX, this.spawnpointY);
    this.physics.add.collider(this.enemies, this.player, this.handleDeadlyTiles, null, this);

    // Cam
    this.cameras.main.setZoom(1);
    this.cameras.main.roundPixels = true;
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setDeadzone(100, 100); 
    this.cameras.main.setBounds(0, 0, 1440, 900); // Example: only the first section


    // Colliders
    this.physics.add.collider(this.player, this.groundLayer, this.handleDeadlyTiles, this.oneWayPlatformCollide, this);
    this.physics.add.collider(this.player, this.groundLayerBacked, this.handleDeadlyTiles, this.oneWayPlatformCollide, this);
    this.physics.add.collider(this.player, this.impassibleLayer, null, null, this);
    this.physics.add.overlap(this.player, this.coinLayer, this.collectCoin, null, this)
    
    // Debug Key
    //this.input.keyboard.on('keydown-D', () => {
    //   this.physics.world.drawDebug = !this.physics.world.drawDebug;
    //    this.physics.world.debugGraphic.clear();
    //}, this);

    // Depth Set for Tiles
    this.signLayer.setDepth(17);
    this.player.setDepth(15);
    this.decorationLayerTwo.setDepth(13);
    this.decorationLayer.setDepth(16); 
    
    // Text
    this.warning = this.add.text(10, 870, 'IF TEXT NON-PIXELATED OR TORN, SPAM C TO FIX', {fontFamily: 'Silkscreen', fontSize: '20px', color: '#FFFFFF'})
        .setScrollFactor(0)
        .setDepth(999);
    this.scoreText = this.add.text(16, 16, 'Coins: 0', {fontFamily: 'Silkscreen', fontSize: '24px', color: '#FFD700'})
        .setScrollFactor(0)
        .setDepth(999)
        .setVisible(false);
    this.scoreTextShadow = this.add.text(19, 19, 'Coins: 0', {fontFamily: 'Silkscreen', fontSize: '24px', color: '#00000'})
        .setScrollFactor(0)
        .setDepth(998)
        .setVisible(false);
    this.liveText = this.add.text(16, 40, 'Lives: 3', {fontFamily: 'Silkscreen', fontSize: '24px', color: '#FF746C'})
        .setScrollFactor(0)
        .setDepth(999)
        .setVisible(false);
    this.liveTextShadow = this.add.text(19, 43, 'Lives: 3', {fontFamily: 'Silkscreen', fontSize: '24px', color: '#00000'})
        .setScrollFactor(0)
        .setDepth(998)
        .setVisible(false);
    
    // Sandwich (challenges) Tracking Text
    this.startText = this.add.text(16, 16, 'Sandwich Quest', {fontFamily: 'Silkscreen', fontSize: '50px', color: '#000000'});
    this.startText1 = this.add.text(16, 66, 'Go on a Journey as \'Bibo\', collect coins, and purchase a sandwich from the fabled Sandwich Man', {fontFamily: 'Silkscreen', fontSize: '20px', color: '#000000'});
    this.startText2 = this.add.text(16, 90, 'Press S: Start', {fontFamily: 'Silkscreen', fontSize: '25px', color: '#000000'});
    this.startText3 = this.add.text(16, 120, 'Press E: View Obtained Sandwiches', {fontFamily: 'Silkscreen', fontSize: '25px', color: '#00000'});
    this.sandwich1 = localStorage.getItem("sandwich1");                                       // Sandwiches based on local storage booleans set by coin amount when interacting with the sandwich man. Saves in localstorage so you can admire all your sandwiches                                                                                                                                                     
    this.sandwich2 = localStorage.getItem("sandwich2");
    this.sandwich3 = localStorage.getItem("sandwich3");
    this.sandwich4 = localStorage.getItem("sandwich4");
    if(this.sandwich1 == 'true'){
        this.startText4 = this.add.text(26, 150, '1. BLT : 1-30 COINS', {fontFamily: 'Silkscreen', fontSize: '25px', color: '#00000'})
        .setVisible(false);
    }else{
        this.startText4 = this.add.text(26, 150, '1. Sandwich Unobtained', {fontFamily: 'Silkscreen', fontSize: '25px', color: '#00000'})
        .setVisible(false);
    }
    if(this.sandwich2 == 'true'){
        this.startText5 = this.add.text(26, 180, '2. MEATBALL SUB: 31-65 COINS',{fontFamily: 'Silkscreen', fontSize: '25px', color: '#00000'})
        .setVisible(false);
    }else{
        this.startText5 = this.add.text(26, 180, '2. Sandwich Unobtained', {fontFamily: 'Silkscreen', fontSize: '25px', color: '#00000'})
        .setVisible(false);
    }
    if(this.sandwich3 == 'true'){
        this.startText6 = this.add.text(26, 210, '3. TEN FOOT LONG SUB: ALL THE COINS', {fontFamily: 'Silkscreen', fontSize: '25px', color: '#00000'})
        .setVisible(false);
    }else{
        this.startText6 = this.add.text(26, 210, '3. Sandwich Unobtained [HINT: Be rich]', {fontFamily: 'Silkscreen', fontSize: '25px', color: '#00000'})
        .setVisible(false);
    }
    if(this.sandwich4 == 'true'){
        this.startText7 = this.add.text(26, 240, '4. NOTHING?: NO COINS', {fontFamily: 'Silkscreen', fontSize: '25px', color: '#00000'})
        .setVisible(false);
    }else{
        this.startText7 = this.add.text(26, 240, '4. Sandwich Unobtained [HINT: No money]', {fontFamily: 'Silkscreen', fontSize: '25px', color: '#00000'})
        .setVisible(false);
    }

    // Dialogue Frame
    this.box = this.add.graphics()
        .fillStyle(0x000000, 0.7)
        .lineStyle(4, 0x80EF80, 1)
        .setScrollFactor(0)
        .setVisible(false);
        
    // Dialogue Text Holder
    this.dialogueBox = this.add.text(50, 750, '', {fontFamily: 'Silkscreen', fontSize: '24px', color: '#80EF80'})
        .setScrollFactor(0)
        .setVisible(false);

    // Interaction Prompt For Starters
    this.pressTPrompt = this.add.text(this.player.x, this.player.y - 40, 'PRESS [T] TO READ SIGNS!', { fontFamily: 'SilkScreen', fontSize: '16px', color: '#FFFFFF' })
        .setOrigin(0.5)
        .setVisible(false);
    this.box.setDepth(100);
    this.dialogueBox.setDepth(100);
    this.pressTPrompt.setDepth(100);
    
    // Interactables Set Up
    const interactableObjects = this.map.getObjectLayer("Interactables").objects;
    this.signs = this.physics.add.staticGroup();
    this.levers = this.physics.add.staticGroup();
    this.blockades = this.physics.add.staticGroup();
    this.flags = this.physics.add.staticGroup();
    this.NPCs = this.physics.add.staticGroup();
    interactableObjects.forEach(obj => {
        const hitbox = this.physics.add.staticImage(obj.x * 2, obj.y * 2, 'kenny_tiles')        // Create hitbox object for object layer items
            .setOrigin(0, 1)
            .setScale(2)       
            .refreshBody()     
            .setDepth(5);
        if (obj.gid) {                                                                          // If object uses sprite, use it-- else make the hitbox invisible
            hitbox.setVisible(true);
            hitbox.setFrame(obj.gid - 1);
        } else {
            hitbox.setVisible(false);
        }
        if (obj.properties) {
            obj.properties.forEach(p => {
                hitbox[p.name] = p.value;
            });
        }
        if(hitbox.Type === 'Flag'){
            this.flags.add(hitbox);
        this.walking = this.add.particles(obj.x*2+15, obj.y*2-30, "kenny-particles", {          // Particles to indicate interactibility
            frame: ['star_03.png', 'star_02.png'],
            random: true,
            scale: {start: 0.03, end: 0.1},
            maxAliveParticles: 8,
            lifespan: 500,
            gravityY: 400,
            angle: { min: 0, max: 360 },
            speed: { min: 30, max: 100 },
            alpha: {start: 1, end: 0.1}, 
            blendMode: Phaser.BlendModes.ADD
        });
        }
        if (hitbox.Type === 'Sign') {
            this.signs.add(hitbox);
        this.walking = this.add.particles(obj.x*2+15, obj.y*2-30, "kenny-particles", {          // Particles to indicate interactibility
            frame: ['star_03.png', 'star_02.png'],
            random: true,
            scale: {start: 0.03, end: 0.1},
            maxAliveParticles: 8,
            lifespan: 500,
            gravityY: 400,
            angle: { min: 0, max: 360 },
            speed: { min: 30, max: 100 },
            alpha: {start: 1, end: 0.1}, 
            blendMode: Phaser.BlendModes.ADD
        });
        this.walking.setDepth(100);
        } else if (hitbox.Type === 'Lever') {
            this.levers.add(hitbox);
        this.walking = this.add.particles(obj.x*2+15, obj.y*2-30, "kenny-particles", {          // Particles to indicate interactibility
            frame: ['star_03.png', 'star_02.png'],
            random: true,
            scale: {start: 0.03, end: 0.1},
            maxAliveParticles: 8,
            lifespan: 500,
            gravityY: 200,
            angle: { min: 0, max: 360 },
            speed: { min: 30, max: 100 },
            alpha: {start: 1, end: 0.1}, 
            tint: 0x5C4033,
            blendMode: Phaser.BlendModes.ADD
        });
        this.walking.setDepth(100);
        } else if (hitbox.Type === 'NPC') {
            this.NPCs.add(hitbox);
        this.walking = this.add.particles(obj.x*2+15, obj.y*2-30, "kenny-particles", {          // Particles to indicate interactibility
            frame: ['star_03.png', 'star_02.png'],
            random: true,
            scale: {start: 0.03, end: 0.1},
            maxAliveParticles: 8,
            lifespan: 500,
            gravityY: 200,
            angle: { min: 0, max: 360 },
            speed: { min: 30, max: 100 },
            alpha: {start: 1, end: 0.1}, 
            tint: 0x5C4033,
            blendMode: Phaser.BlendModes.ADD
        });
        this.walking.setDepth(100);                                                              
        } else if (hitbox.Type === 'Blockade') {                                                // Blockades don't emit particles
            this.blockades.add(hitbox);
        }
    });
    this.physics.add.overlap(this.player, this.signs, this.showDialogueText, null, this);       // Collision for objects
    this.physics.add.overlap(this.player, this.levers, this.tryPullLever, null, this);
    this.physics.add.collider(this.player, this.blockades);
    this.physics.add.overlap(this.player, this.flags, this.Checkpoint, null, this);
    this.physics.add.overlap(this.player, this.NPCs, this.endState, null, this);
    this.physics.world.TILE_BIAS = 22;                                                          // Mitigate noclipping - Kind of messes with the pass under collision. Anything higher will break enemy checks. Clipping mitigated though.
}

    // Checkpoint implementation
Checkpoint(player, flag){
    if(Phaser.Input.Keyboard.JustDown(this.tKey)){
        this.spawnpointX = flag.spawnX*2;                                                       // Set new spawn variables for player based on object properties
        this.spawnpointY = flag.spawnY*1.5;
        const spawnPoint = this.add.sprite(flag.x+10, flag.y-40, 'spawnPoint');
        spawnPoint.setDepth(99);                                                                
        spawnPoint.setScale(0.2);
        spawnPoint.setBlendMode(Phaser.BlendModes.SCREEN);                                      
        spawnPoint.play('spawnPoint');
        this.checkpointSound.setVolume(0.6);                                                    // Play checkpoint sound to indicate successful setting, also play spawnpoint animation
        this.checkpointSound.play();                                                            // If first time interacting, give player a life.
        if(flag.giveLife === true){
            this.lives += 1;
            flag.giveLife = false;
            this.liveText.setText('Lives: ' + this.lives);
            this.liveTextShadow.setText('Lives: ' + this.lives);
        }
    }
}
    // Lever Implementation
tryPullLever(player, lever) {
    if (Phaser.Input.Keyboard.JustDown(this.tKey)) {
        console.log(`Lever pulled: ${lever.LeverID}`);                                        // for each blockade that matches the leverID, destroy it. Change frame of lever. Make lever frame change infinite because someone will probably try pressing it multiple times
        const targets = this.blockades.getChildren().filter(blockade => blockade.BlockadeID === lever.LeverID);
        console.log(lever.flip);
        if (lever.flip == true){
            lever.setFrame(66);
            lever.flip = false;
        }else{
            lever.setFrame(64);
            lever.flip = true;
        }
        targets.forEach(blockade => {
            blockade.destroy();
            this.blockades.remove(blockade, true, true);
        });
        this.leverSound.play();
        this.cameras.main.shake(250, 0.01);
    }
}
    // Sandwich Man End Dialogue
endState(player, NPC) {
    if (Phaser.Input.Keyboard.JustDown(this.tKey)) {
        this.player.setVelocity(0, 0);
        this.player.setAccelerationX(0);
        this.player.setAccelerationY(0);
        this.player.anims.play('idle');
        if (!this.once) {                                                                   // Go through dialogue sequence (used a lot of variables, not very pretty, will probably fix for final game)
            this.speechSound.play();                                                        // At end, stop music and play victory sound to signify end state. Set sandwich tracking data based on score.
            this.gameComplete = true;
            this.dialogueBox.setText(NPC.Text);
            this.box.setVisible(true);
            this.dialogueBorderUpdate();
            this.dialogueBox.setVisible(true);
            this.once = true;
            return;
        }

        if (this.once && !this.end) {
            this.speechSound.play();
            this.dialogueBox.setText("SANDWICH MAN: Hm... " + this.score + " coins. [Press T to Continue]");
            this.dialogueBorderUpdate();
            this.end = true;
            return;
        }

        if (this.end && !this.stop) {
            this.backgroundMusic.stop();
            this.speechSound.play();
            this.winSound.setVolume(0.1);
            this.winSound.play();
            if (this.score == 0) {
                console.log("N");
                this.dialogueBox.setText('I am afraid you cannot afford a sandwich...\n[YOU OBTAINED... NOTHING] [PRESS R TO RETURN TO MAIN MENU]');
                this.dialogueBorderUpdate();
                localStorage.setItem("sandwich4", true);
            }
            if (this.score != 0 && this.score <= 30){
                console.log('BLT');
                this.dialogueBox.setText('I can give you a BLT.\n[YOU OBTAINED A BLT] [PRESS R TO RETURN TO MAIN MENU]');
                this.dialogueBorderUpdate();
                localStorage.setItem("sandwich1", true);
            }
            if (this.score > 30 && this.score <= 65){
                console.log('MBS');
                this.dialogueBox.setText('I can give you a meatball sub.\n[YOU OBTAINED A MEATBALL SUB] [PRESS R TO RETURN TO MAIN MENU]');
                this.dialogueBorderUpdate();
                localStorage.setItem("sandwich2", true);
            }
            if (this.score == 66){
                console.log('TFLS');
                this.dialogueBox.setText('Wow you are rich, kid. Here is a ten foot long.\n[YOU OBTAINED TEN FOOT LONG SUB] [PRESS R TO RETURN TO MAIN MENU]');
                this.dialogueBorderUpdate();
                localStorage.setItem("sandwich3", true);
                }
            this.stop = true;
            }
        }
    }

    // Called when player is in overlap with a sign/text object from the objectlayer
showDialogueText(player, sign) {
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
    const textWidth = this.dialogueBox.width;                                               // get width and height of text for measurement
    const textHeight = this.dialogueBox.height;
    const boxWidth = textWidth + padding * 2;                                               // get box dimensions based off text
    const boxHeight = textHeight + padding * 2;
    this.box.clear();                                                                       // destroy the previous box
    this.box.fillStyle(0x000000, 0.7);                                                      // below sets the new box
    this.box.fillRect(this.dialogueBox.x - padding, this.dialogueBox.y - padding, boxWidth, boxHeight);
    this.box.lineStyle(2, 0xffffff, 1);
    this.box.strokeRect(this.dialogueBox.x - padding, this.dialogueBox.y - padding, boxWidth, boxHeight);
}

    // One Way Pass Filter For Platforms
oneWayPlatformCollide(player, tile) {
    if(!tile.properties.border){
        return player.body.velocity.y >= 1;
    }
}

    // Player 'death' Restart Function
handleDeadlyTiles(player, tile) {
    const isDeadly = (tile.properties && tile.properties.deadly) || tile.deadly;

    if (isDeadly && this.isDying == false && !this.gameOver) {                              // If player touches tile with isDeadly property (all on the GroundLayer) play explosion effect and set isDying so it doesn't call multiple times.
        console.log("PLAYER DIED");
        const biboBoom = this.add.sprite(this.player.x, this.player.y, 'biboBoom');
        biboBoom.setScale(0.2);
        biboBoom.setBlendMode(Phaser.BlendModes.SCREEN);
        biboBoom.play('biboBoom');
        this.boomSound.setVolume(0.4);
        this.boomSound.play();
        this.fadeOut(biboBoom, 500, 20);
        this.lives -= 1;
        this.liveText.setText('Lives: ' + this.lives);
        this.liveTextShadow.setText('Lives: ' + this.lives);
        this.isDying = true;
        this.fadeOut(this.player, 500, -50);
        console.log(this.lives)
        
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
        this.scoreText.setText('Coins: ' + this.score);
        this.scoreTextShadow.setText('Coins: ' + this.score);
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
            if(particle != this.player){
            particle.destroy();     
            } else {                                                                        // Special handling for player, where if they die the player is warped to their current set spawn and they are unfaded out at the end of the fadeout animation. Looks like they died.
            if(this.lives !== 0){
            this.player.setPosition(this.spawnpointX, this.spawnpointY);
            this.player.alpha = 100;
            this.isDying = false;
            }
            if(this.lives === 0){                           
            this.player.alpha = 100;
            this.gameOver = true;
            }
        }
    }
    });
}

// Camera Behaviour
panToRegion2() {
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);     // unlock camera for transition
    this.cameras.main.stopFollow();                                                         // stop following player momentarily (not that the camera ever really follows the player with this configuration, but just in case!)
    this.cameras.main.pan(                                                                  // pan camera to the center of the screen and player Y with a sin ease that last 1500ms, then set new bounds and start following again. Same for Return to region 1
        this.regionWidth + this.regionWidth / 2, 
        this.player.y,
        1500,
        'Sine.easeInOut',
        true
    );

    this.time.delayedCall(1500, () => {                                                     // Lock camera at the end of the curve
        this.transition = false;                                                            // The same for every region, could probably turn this into a consolidated function next time.
        this.cameras.main.setBounds(this.regionWidth, 0, this.regionWidth, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    });
}

panToRegion1() {
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.stopFollow();

    this.cameras.main.pan(
        this.regionWidth / 2, 
        this.player.y,
        1500,
        'Sine.easeInOut',
        true
    );

    this.time.delayedCall(1500, () => {
        this.transition = false;
        this.cameras.main.setBounds(0, 0, this.regionWidth, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    });
}

panToRegion3() {
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.stopFollow();
    this.cameras.main.pan(
        this.regionWidth * 2 + this.regionWidth / 2, 
        this.player.y,
        1500,
        'Sine.easeInOut',
        true
    );

    this.time.delayedCall(1500, () => {
        this.transition = false;
        this.cameras.main.setBounds(this.regionWidth * 2, 0, this.regionWidth, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    });
}

panToRegion4() {
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.stopFollow();
    this.cameras.main.pan(
        this.regionWidth * 3 + this.regionWidth / 2, 
        this.player.y,
        1500,
        'Sine.easeInOut',
        true
    );

    this.time.delayedCall(1500, () => {
        this.transition = false;
        this.cameras.main.setBounds(this.regionWidth * 3, 0, this.regionWidth, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    });
}

panToRegion5() {
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.stopFollow();
    this.cameras.main.pan(
        this.regionWidth * 4 + this.regionWidth / 2, 
        this.player.y,
        1500,
        'Sine.easeInOut',
        true
    );

    this.time.delayedCall(1500, () => {
        this.transition = false;
        this.cameras.main.setBounds(this.regionWidth * 4, 0, this.regionWidth, this.map.heightInPixels);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    });
}

// reload text because SOMETIMES the game starts before text assets are completely loaded in. 
reloadText() {
    console.log('reloaded');
    if(!this.gameStarted){
        if(this.reset == true){
            this.startText.setText('Sandwich Quest ');
            this.startText1.setText('Go on a Journey as \'Bibo\', collect coins, and purchase a sandwich from the fabled Sandwich Man ');
            this.startText2.setText('Press S: Start ');
            this.startText3.setText('Press E: View Obtained Sandwiches ');
            this.warning.setText('CONTROLS: ARROWS + SPACEBAR, T TO INTERACT WITH SPARKLY OBJECTS ');
        if(this.sandwich1 == 'true'){
        this.startText4.setText('1. BLT : 1-30 COINS ');
        }else{
            this.startText4.setText('1. Sandwich Unobtained ')
        }
        if(this.sandwich2 == 'true'){
            this.startText5.setText('2. MEATBALL SUB: 31-65 COINS ')
        }else{
            this.startText5.setText('2. Sandwich Unobtained ')
        }
        if(this.sandwich3 == 'true'){
            this.startText6.setText('3. TEN FOOT LONG SUB: ALL THE COINS ')
        }else{
            this.startText6.setText('3. Sandwich Unobtained [HINT: Be rich] ')
        }
        if(this.sandwich4 == 'true'){
            this.startText7.setText('4. NOTHING?: NO COINS ')
        }else{
            this.startText7.setText('4. Sandwich Unobtained [HINT: No money] ')
        }
            this.reset = false;
        }else{
            this.startText.setText('Sandwich Quest');
            this.startText1.setText('Go on a Journey as \'Bibo\', collect coins, and purchase a sandwich from the fabled Sandwich Man');
            this.startText2.setText('Press S: Start');
            this.startText3.setText('Press E: View Obtained Sandwiches');
            this.warning.setText('CONTROLS: ARROWS + SPACEBAR, T TO INTERACT WITH SPARKLY OBJECTS');
                if(this.sandwich1 == 'true'){
        this.startText4.setText('1. BLT : 1-30 COINS');
        }else{
            this.startText4.setText('1. Sandwich Unobtained')
        }
        if(this.sandwich2 == 'true'){
            this.startText5.setText('2. MEATBALL SUB: 31-65 COINS')
        }else{
            this.startText5.setText('2. Sandwich Unobtained')
        }
        if(this.sandwich3 == 'true'){
            this.startText6.setText('3. TEN FOOT LONG SUB: ALL THE COINS')
        }else{
            this.startText6.setText('3. Sandwich Unobtained [HINT: Be rich]')
        }
        if(this.sandwich4 == 'true'){
            this.startText7.setText('4. NOTHING?: NO COINS')
        }else{
            this.startText7.setText('4. Sandwich Unobtained [HINT: No money]')
        }
            this.reset = true;
        }
    } else {
        if(this.reset == true){
            this.pressTPrompt.setText('PRESS [T] TO READ SIGNS!');
            this.liveText.setText('LIVES: ' + this.lives);
            this.scoreText.setText('COINS: ' + this.score);
            this.liveTextShadow.setText('LIVES: ' + this.lives);
            this.scoreTextShadow.setText('COINS: ' + this.score);
            this.warning.setText('CONTROLS: ARROWS + SPACEBAR, T TO INTERACT WITH SPARKLY OBJECTS');
        }else{
            this.pressTPrompt.setText('PRESS [T] TO READ SIGNS! ');
            this.liveText.setText('LIVES: ' + this.lives + ' ');
            this.scoreText.setText('COINS: ' + this.score+ ' ');
            this.liveTextShadow.setText('LIVES: ' + this.lives+ ' ');
            this.scoreTextShadow.setText('COINS: ' + this.score+ ' ');
            this.warning.setText('CONTROLS: ARROWS + SPACEBAR, T TO INTERACT WITH SPARKLY OBJECTS ');
            }   
        }
    }
// Update Loop
update() {
    this.reloadText();
    this.enemyObjects.forEach(enemy => {
        enemy.update();
    });
    if (Phaser.Input.Keyboard.JustDown(this.cKey)) {         
        this.uiBlip.play();                             
        this.reloadText();
        }
    if(!this.gameOver){
        if(!this.gameStarted){
            if (Phaser.Input.Keyboard.JustDown(this.sKey)) {
                this.uiBlip.play();                                         
                this.gameStarted = true;
                this.startText.destroy();
                this.startText1.destroy();
                this.startText2.destroy();
                this.startText3.destroy();
                this.startText4.destroy();
                this.startText5.destroy();
                this.startText6.destroy();
                this.startText7.destroy();
                this.scoreText.setVisible(true);
                this.liveText.setVisible(true);
                this.scoreTextShadow.setVisible(true);
                this.liveTextShadow.setVisible(true);
                
            }
            if (Phaser.Input.Keyboard.JustDown(this.eKey)) {   
                this.uiBlip.play();                                      
                this.startText4.setVisible(true)
                this.startText5.setVisible(true);
                this.startText6.setVisible(true);
                this.startText7.setVisible(true);
            }
    } else if (!this.gameComplete){
    this.player.setVisible(true);
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
        // Inside update()
        if (!this.transition) {
            if (this.currentRegion === 1 && this.player.x > this.regionWidth) {
                this.transition = true;
                this.panToRegion2();
                this.currentRegion = 2;

            } else if (this.currentRegion === 2) {
                if (this.player.x < this.regionWidth) {
                    this.transition = true;
                    this.panToRegion1();
                    this.currentRegion = 1;
                } else if (this.player.x > this.regionWidth * 2) {
                    this.transition = true;
                    this.panToRegion3();
                    this.currentRegion = 3;
                }

            } else if (this.currentRegion === 3) {
                if (this.player.x < this.regionWidth * 2) {
                    this.transition = true;
                    this.panToRegion2();
                    this.currentRegion = 2;
                } else if (this.player.x > this.regionWidth * 3) {
                    this.transition = true;
                    this.panToRegion4();
                    this.currentRegion = 4;
                }

            } else if (this.currentRegion === 4) {
                if (this.player.x < this.regionWidth * 3) {
                    this.transition = true;
                    this.panToRegion3();
                    this.currentRegion = 3;
                } else if (this.player.x > this.regionWidth * 4) {
                    this.transition = true;
                    this.panToRegion5();
                    this.currentRegion = 5;
                }

            } else if (this.currentRegion === 5 && this.player.x < this.regionWidth * 4) {
                this.transition = true;
                this.panToRegion4();
                this.currentRegion = 4;
            }
        }
    }
        }
    // Lose Screen
    if (this.gameOver){
        this.player.destroy();
        this.player.setVisible(false);
        this.dialogueBox.setText('You died, sandwichless.\nTotal Coins: ' + this.score + '\nPress R to Try Again.')
        this.dialogueBorderUpdate();
        this.dialogueBox.setVisible(true);
        this.box.setVisible(true);
        this.input.keyboard.on('keydown-R', () => {
        this.backgroundMusic.stop();
        this.scene.restart();
    }, this);
            }
    // Open restart button if the player has finished sandwich man end sequence
    if(this.end){
        this.input.keyboard.on('keydown-R', () => {
        this.backgroundMusic.stop();
        this.scene.restart();
    }, this);
    }
    }
}
