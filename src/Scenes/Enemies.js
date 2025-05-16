// done, not gonna make this too complicated. Maybe for final game
export class EnemyControls {
    // Enemy Constructor
    constructor(scene, x, y, texture, groundLayer) {
        this.scene = scene;
        this.groundLayer = groundLayer;
        this.speed = 100;
        this.hasStarted = false;
        this.deadly = true;
        this.enemy = scene.physics.add.sprite(x, y, texture);
        this.enemy.setScale(2);
    // Adjust hitboxes 
        this.enemy.body.setSize(
            (this.enemy.width / this.enemy.scaleX) * 0.7,
            (this.enemy.height / this.enemy.scaleY) * 0.7,
            true
        );
        this.enemy.body.setOffset(2)
        this.enemy.setOrigin(0.5, 0.5);
        this.enemy.body.setOffset(
            (this.enemy.width - this.enemy.body.width) / 3,
            (this.enemy.height - this.enemy.body.height) / 2
        );
        this.enemy.setCollideWorldBounds(true);
        this.enemy.setBounce(0);
    }
    // Getsprite for platformer.js
    getSprite() {
        return this.enemy;
    }

update() {
    const e = this.enemy;
    // At start, set velocity for enemy
    if (!this.hasStarted && e.body) {
        e.setVelocityX(this.speed);
        this.hasStarted = true;
    }

    // Flip sprite based on movement direction
    e.setFlipX(e.body.velocity.x > 0);

    // Wall collision detection
    if (e.body.blocked.left || e.body.touching.left) {
        e.setVelocityX(this.speed);
    }
    else if (e.body.blocked.right || e.body.touching.right) {
        e.setVelocityX(-this.speed);
    }

    // Only check edge if enemy is touching the ground and moving horizontally
    if (e.body.blocked.down && Math.abs(e.body.velocity.x) > 0) {
        const lookAheadDistance = 16;
        const footOffset = 10;
        const aheadX = e.body.velocity.x > 0
            ? e.x + lookAheadDistance
            : e.x - lookAheadDistance;
        const aheadY = e.y + e.height / 2 + footOffset;
        const tileBelow = this.groundLayer.getTileAtWorldXY(aheadX, aheadY);
        if (!tileBelow) {
            if (e.body.velocity.x > 0) {
                e.setVelocityX(-this.speed);
            } else {
                e.setVelocityX(this.speed);
            }
        }
    }
    // Animations for Enemy
    if(e.body.velocityX != 0){
        e.anims.play('enemyWalk', true);
    }
}
}