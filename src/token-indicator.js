import { SpriteID} from './sprite-id.js';



/**
 * Used to handle the indicators for direction for tokens
 */
export class TokenIndicator {

    constructor(token,sprite=false) {
        this.token = token;
        this.sprite = sprite;
        this.owner = token.owner;

        this.c = new PIXI.Container();
        token.indicator = this;
    }

    /* -------------------------------------------- */

    /**
     * Creates a new instance of the class with the token
     * @param {Token} token  -- the token getting the indicator
     */
    static init(token) {
        return(new TokenIndicator(token));
    }

    /* -------------------------------------------- */

    /**
     * Rotates the sprite
     * @param {int|float} deg  -- rotate the sprite the specified amount
     */
    rotate(deg) {
        this.sprite.angle=deg;
    }

    /* -------------------------------------------- */

    /**
     * TODO: change indicator color based on average tile color
     */
    get backgroundColor() {
    
    }

    /* -------------------------------------------- */

    /**
     * show the instance
     */
    show() {
        this.sprite.visible = true;
    }

    /* -------------------------------------------- */

    /**
     * hide the instance
     */
    hide() {
        this.sprite.visible = false;
    }

    /* -------------------------------------------- */

    /**
     * This is the default indicator & style. A small triangle
     */
    generateDefaultIndicator() {
        let i = new PIXI.Graphics();
        let indicator_color = colorStringToHex("FF0000");

        if (this.token.actor.isPC) {
            indicator_color = colorStringToHex(getTokenOwner(this.token)[0].color);
        }
        //indicator_color = colorStringToHex(game.user.color);

        i.beginFill(indicator_color, .5).lineStyle(2, 0x000000, 1)
            .moveTo(this.token.w / 2, this.token.h + 25)
            .lineTo(this.token.w / 2 - 10, this.token.h + 10)
            .lineTo(this.token.w / 2 + 10, this.token.h + 10)
            .lineTo(this.token.w / 2, this.token.h + 25)
            .closePath()
            .endFill()
            .beginFill(0x000000, 0).lineStyle(0, 0x000000, 0)
            .drawCircle(this.token.w / 2, this.token.w / 2, this.token.w * 2.5)
            .endFill();

        let texture = canvas.app.renderer.generateTexture(i);
        return new SpriteID(texture, this.token.id);
    }

    /* -------------------------------------------- */

    /**
     * Create the indicator using the instance's indicator sprite
     * If one hasn't been specified/set, use the default
     */
    create() {
        if (!this.sprite) {
            this.sprite = this.generateDefaultIndicator();
        }

        this.sprite.position.x = this.token.w/2;
        this.sprite.position.y = this.token.w/2;
        this.sprite.anchor.set(.5);
        this.sprite.angle = 0;

        this.c.addChild(this.sprite);
        this.token.addChild(this.c);
        
    }

}

/*** Utility Stuff, will be hoisted ***/
function getKeyByValue(object, value) {
    return Object.keys(object).filter(key => object[key] === value);
}

function getTokenOwner(token, includeGM=false) {
    let owners = getKeyByValue(token.actor.data.permission,3);
    let ret = [];
    for (let y = 0; y < owners.length; y++) {
        let u = Users.instance.get(owners[y]);
        if (includeGM) {
            ret.push(u);
            continue;
        } else {
            if (!u.isGM) { ret.push(u);}
        }
        
    }
    return ret;

}