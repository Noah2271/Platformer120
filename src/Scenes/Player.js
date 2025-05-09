export class PlayerControls {
    constructor(scene, cursors) {
        this.scene = scene;
        this.cursors = cursors;
        // spacebar for jump is more comfortable
        this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        // player variables
        this.JUMP_VELOCITY = -500;
        this.ACCELERATION = 300;
        this.DRAG = 9000;
        this.JUMPCOUNT = 0;
        this.burst = 300;
        this.justBurst = false;
        this.disableDrag = false;
        // player / level characteristics
        this.player = scene.physics.add.sprite(
            scene.game.config.width / 19,
            scene.game.config.height / 2,
            "platformer_characters"
        );
        this.player.setScale(2.0);
        this.player.setCollideWorldBounds(true);
        this.player.setDragX(this.DRAG);
        this.scene.physics.world.gravity.y = 1500;

    }
    // function so platformer.js can retrieve the sprite made for player in the class
    getSprite() {
        return this.player;
    }

    update() {
    // shorthand
        const p = this.player;
    // player movement implementation
        if (this.cursors.left.isDown) {                         
            p.setAccelerationX(-this.ACCELERATION);             // if left key down, add to acceleration in the negative direction
            if (p.body.velocity.x < 0){                         // if moving in the left direction, reset flip in the case the right key was pressed beforehand, play walk animation
                p.resetFlip();
                p.anims.play('walk', true)
            } else {
                p.setVelocityX(0);                              // support for instant turning. If player presses right key will reset velocity
            }
            if (!this.justBurst  && p.body.velocity.x < -250){  // max speed
                p.setVelocityX(-250)
            }
        } else if (this.cursors.right.isDown) {                 
            p.setAccelerationX(this.ACCELERATION);              // if right key down, add to acceleration in the positive direction
            if (p.body.velocity.x > 0){                         // if moving in the right direction, set flip in the case the left key pressed beforehand, play walk animation
                p.setFlip(true, false);
                p.anims.play('walk', true);
            } else{
                p.setVelocityX(0);                              // suport for instant turning in the other direction
            }
            if (!this.justBurst && p.body.velocity.x > 250){    // max speed
            p.setVelocityX(250);
            }
        } else {                                                // key release
            p.setAccelerationX(0);                              // stop all acceleration and apply drag, play idle animation
            p.anims.play('idle');
        }

        if (!p.body.blocked.down) {                             // if bottom of player character not touching a groudn tile, play jump animation
            p.anims.play('jump');
        }
        // jump / double jump implementation
        if (p.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.JUMPCOUNT < 1) {
            p.setVelocityY(this.JUMP_VELOCITY);                 // if first jump denoted by JUMPCOUNT, set player velocityY to the jump velocity, increment jump counter
            this.JUMPCOUNT += 1;
            console.log(this.JUMPCOUNT);
        }
        if (!p.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.JUMPCOUNT === 1) {
            p.setVelocityY(this.JUMP_VELOCITY);                 // if second jump denoted by JUMPCOUNT, set play velocityY to the jump velocity
            if (this.cursors.left.isDown) {                     // second jump has a 'dive' so apply burst value in the direction of the current key pressed. If no key pressed, simple double jump
                p.setVelocityX(-this.burst);
            } else if (this.cursors.right.isDown) {
                p.setVelocityX(this.burst);
            }
            this.JUMPCOUNT += 1;                                // increment jump counter
            console.log("Double jump with burst:", this.JUMPCOUNT);
            this.justBurst = true;                              // justBurst flag to disable the max speed for the dive until ground touched
            this.disableDrag = true;                            // disableDrag flag to disable drag until the ground touched for the dive
        }
        // ground variable resets
        if (p.body.blocked.down && this.JUMPCOUNT >= 1 && !this.spaceKey.isDown){
            this.JUMPCOUNT = 0;                                 // when player touches ground and spacekey is released, reset all jump related variables
            this.disableDrag = false;
            this.justBurst = false;
            console.log(this.JUMPCOUNT);
        }

        if (!this.disableDrag){                                 // drag handling
            p.setDragX(this.DRAG);
        } else {
            p.setDragX(0);
            }
        }
    }