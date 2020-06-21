/**
 * SpriteID wrapper around PIXI.sprite
 * v0.1
 */
export class SpriteID extends PIXI.Sprite {
    constructor(texture, id) {
        super(texture);
        this.id = id;
        this.sprite_type = 'token-indicator';
    }
}