//done 
export class PlayerControls {
    constructor(scene, cursors) {
        this.scene = scene;
        this.cursors = cursors;
        // Space Bar for Jump
        this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        // Player , Player Movement Variables
        this.JUMP_VELOCITY = -500;
        this.ACCELERATION = 300;
        this.DRAG = 1500;
        this.JUMPCOUNT = 0;
        this.burst = 350;
        this.justBurst = false;
        this.disableDrag = false;
        this.lastStepTime = 0;
        this.stepCooldown = 20; 
        // Player , Player Particle Instantiation
        this.player = scene.physics.add.sprite(
            scene.game.config.width / 19,
            scene.game.config.height / 1.4,
            "platformer_characters"
        );
        this.player.setScale(2.0);
        this.player.setCollideWorldBounds(true)
        this.player.setDragX(this.DRAG);
        this.scene.physics.world.gravity.y = 1500;
        this.runParticles = scene.add.sprite(this.player.x, this.player.y, 'runParticles1');    // Have to individually set this here since run particles are constantly made behind the player, just invisible until specified.
        this.runParticles.setScale(2.0);
        this.runParticles.setVisible(false); 
        this.Sounds = [
            this.scene.sound.add('stepTest'), this.scene.sound.add('jumpSound'), this.scene.sound.add('dashSound')
        ];

    }
        // Get Sprite for Platformer.js
getSprite() {
    return this.player;
}
        // Spawn Walking Particles Function
spawnDust(x, y) {
    const dust = this.scene.add.sprite(x, y, 'runParticles1');
    dust.setScale(0.1);
    dust.setBlendMode(Phaser.BlendModes.SCREEN);
    dust.setTint(0xCD853F);
    dust.play('runParticles');
    dust.setDepth(15);
    this.fadeOut(dust, 500, 20);
}

        // Particle Fade Out Function, Specify What Particle, How long it fades, and how far it floats.
fadeOut = (particle, duration, float) => {
    this.scene.tweens.add({
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

    // Walking Sound Effects Function
playStepSound(p) {
    const speed = Math.abs(p.body.velocity.x);
    if (!p.body.blocked.down) {
        return;
    }
    if (!this.lastStepTime || this.scene.time.now - this.lastStepTime > this.stepCooldown) {    // If no last step time recorded or time since last played a sound is less than the step cooldown 
        const step = this.Sounds[0];
        const rate = Phaser.Math.Clamp(speed / 400, 0.6, 2);                                    // Pick a sound and then set the rate of the sound based on velocity x divided by 400, to a value greater than 0.8, less than 1.5 (too fast too slow)
        step.setRate(rate);                                                                     
        step.setVolume(0.1);
        step.play();                                                                            // Play sound
        // Reset timer
        this.lastStepTime = this.scene.time.now;                                                // Record time of when the sound was played
        // Adjust next cooldown based on speed (faster speed = faster steps)
        this.stepCooldown = Phaser.Math.Clamp(400 - speed, 100, 400);                           // Set new cooldown relative to the speed for speed up
        }
    }

update() {
        // Set shorthand p to player
    const p = this.player;
        // Player Left and Right Movement Implementation
    if(p.body.velocity.y > 800){
        p.setVelocityY(800);
    }
    if(p.body.blocked.left || p.body.blocked.right){
        p.anims.play('idle');
    }
    if (this.cursors.left.isDown) {     
        if (!this.justBurst){
            p.setAccelerationX(-this.ACCELERATION);                                             // Only allow player acceleration when NOT in the dive. (They can stop the dive velocity as a cancel, but they wont move the other way. The dive is a commitment.)
        }                                                                                       // If left key down, add to acceleration in the negative direction
        if (p.body.velocity.x < 0){                                                             // If moving in the left direction, reset flip in the case the right key was pressed beforehand, play walk animation
            p.resetFlip();
            p.anims.play('walk', true)
            this.playStepSound(p);
        } else {
            p.setVelocityX(0);                                                                  // Support for instant turning. If player presses right key will reset velocity
        }
        if (!this.justBurst  && p.body.velocity.x < -250){                                      // Max Speed
            p.setVelocityX(-250)
        }
    } else if (this.cursors.right.isDown) {  
        if (!this.justBurst){                
            p.setAccelerationX(this.ACCELERATION);                                              // If right key down, add to acceleration in the positive direction
        }
        if (p.body.velocity.x > 0){                                                             // If moving in the right direction, set flip in the case the left key pressed beforehand, play walk animation
            p.setFlip(true, false);
            p.anims.play('walk', true);
            this.playStepSound(p);
        } else {
            p.setVelocityX(0);                                                                  // Support for instant turning in the other direction
        }
        if (!this.justBurst && p.body.velocity.x > 250){                                        // Max speed
            p.setVelocityX(250);
        }
    } else {                                                                                    // Key release
        p.setAccelerationX(0);                                                                  // Stop all acceleration and apply drag, play idle animation
        p.anims.play('idle');
    }
    // Player Dust Spawning Conditional Call
    if (this.cursors.left.isDown || this.cursors.right.isDown) {                            
        if (p.body.blocked.down && Math.abs(p.body.velocity.x) > 100) {
            if (!this.lastDustTime || this.scene.time.now - this.lastDustTime > 100) {
                this.spawnDust(p.x, p.y + 20);                                                  // Dust is Created Under the Player
                this.lastDustTime = this.scene.time.now;                                        // Keep Track of When Dust was last Created, used similar to the sound function
            }
        }
    }
    if (!p.body.blocked.down) {                                                                 // If bottom of player character not touching a ground tile, play jump animation
        p.anims.play('jump');
    }
    // Jump Dive Implementation
    if (p.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.JUMPCOUNT < 1) {
        const jumpParticles = this.scene.add.sprite(p.x, p.y, 'jumpParticles1');                // Jump Particle Creation
        jumpParticles.setScale(0.15);
        jumpParticles.setDepth(15);
        jumpParticles.play('jumpParticles');
        this.fadeOut(jumpParticles, 500, 0);
        const Jump = this.Sounds[1];                                                            // Play Jump Sound
        Jump.setVolume(0.5);
        Jump.play();
        p.setVelocityY(this.JUMP_VELOCITY);                                                     // Actually Execute Jump
        this.JUMPCOUNT += 1;
        console.log(this.JUMPCOUNT);                                                            // Debug
    }   
    if (!p.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.JUMPCOUNT === 1) {
        const diveSound = this.Sounds[2];               
        diveSound.setVolume(0.5);
        diveSound.play();
        const divePoof = this.scene.add.sprite(p.x, p.y, 'diveParticles1');
        divePoof.setScale(0.2);
        divePoof.setBlendMode(Phaser.BlendModes.SCREEN);    
        divePoof.setDepth(15); 
        divePoof.play('divePoof');                       
        this.fadeOut(divePoof, 1000, 30);
        p.setAccelerationX(0);
        p.setVelocityY(this.JUMP_VELOCITY);                                                     // If second jump denoted by JUMPCOUNT, set play velocityY to the jump velocity
        if(!this.justBurst){
        if (this.cursors.left.isDown) {                                                         // Second jump has a 'dive' so apply burst value in the direction of the current key pressed. If no key pressed, simple double jump
            p.setVelocityX(-this.burst);
        } else if (this.cursors.right.isDown) {
            p.setVelocityX(this.burst);
        }
    }
            this.scene.tweens.add({
                    targets: p,
                    angle: this.cursors.left.isDown ? -30 : 30,
                    duration: 150,
                    ease: 'Sine.easeOut'
                });
            this.JUMPCOUNT += 1;                                                                // Increment jump counter
            console.log("Double jump with burst:", this.JUMPCOUNT);
            this.justBurst = true;                                                              // JustBurst flag to disable the max speed for the dive until ground touched
            this.disableDrag = true;                                                            // DisableDrag flag to disable drag until the ground touched for the dive
        }
    // Ground variable resets
        if (p.body.blocked.down) {                                                              // Reset Player Tilt, Drag Flag, JUMPCOUNT, Burst Flag
            if (this.JUMPCOUNT === 2) {
                p.setAngle(0);
                this.disableDrag = false;
                this.JUMPCOUNT = 0;
                this.justBurst = false;
            }
            if (this.JUMPCOUNT !== 0 && !this.spaceKey.isDown){
                this.JUMPCOUNT = 0;
            }
        }
        if (!this.disableDrag){                                                                 // Drag Handling For Burst
            p.setDragX(this.DRAG);
        } else {
            p.setDragX(0);
            }
        }
    }