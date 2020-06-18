export class SpriteID extends PIXI.Sprite {
    constructor(texture, id) {
        super(texture);
        this.id = id;
        this.sprite_type = 'token-indicator';
    }
}