import { SpriteID } from './SpriteID.js';
import * as Helpers from './helpers.js';
import { log, LogLevel } from './logging.js';

const MODULE_ID = 'about-face';
const IndicatorMode = {
    OFF: 0,
    HOVER: 1,
    ALWAYS: 2,
};

/**
 * Used to handle the indicators for direction for tokens
 */
export class TokenIndicator {

    constructor(token, sprite = {}) {
        this.token = token;
        this.sprite = sprite;
        this.c = new PIXI.Container();  
    }

    /* -------------------------------------------- */

    /**
     * Create the indicator using the instance's indicator sprite
     * If one hasn't been specified/set, use the default
     */
    async create(scene, sprite = {}) {
        log(LogLevel.DEBUG, 'TokenIndicator create()');
        let indicator_color = await this.indicatorColor();
        if (!sprite) {
            this.sprite = await this.generateDefaultIndicator(indicator_color);

            // this.sprite = this.generateSpaceIndicator('',0x000000);
            // this.sprite = this.generateStarIndicator();
        } else {
            // If a sprite is not defined, use the system settings.   Only allow the Hex sprite on Hex Column scenes (gridType 4 & 5).
            let type =  game.settings.get(MODULE_ID, 'sprite-type');
            if (type == 2 && scene?.data.gridType >= 4) { // Hex Sprite and Hex Column scene
              this.sprite = this.generateHexFacingsIndicator(indicator_color);   
            } else {
              this.sprite = this.generateTriangleIndicator((type == 1 ? "large" : "normal"), indicator_color, 0x000000);
            }
        }

        this.sprite.zIndex = -1;
        this.sprite.position.x = this.token.w / 2;
        this.sprite.position.y = this.token.h / 2;
        this.sprite.anchor.set(.5);
        this.sprite.angle = this.token.data.rotation;

        this.c.addChild(this.sprite);
        this.token.addChild(this.c);

        if (game.settings.get(MODULE_ID, 'use-indicator') !== IndicatorMode.ALWAYS || this.token.getFlag(MODULE_ID, 'indicatorDisabled'))
            this.sprite.visible = false;

        return this;
    }

    /* -------------------------------------------- */

    /**
     * Rotates the sprite
     * @param {int|float} deg  -- rotate the sprite the specified amount
     */
    rotate(deg) {
        log(LogLevel.DEBUG, 'TokenIndicator rotate()');
        // token.update does not care about ._moving
        if (game.user.isGM && !this.token.data.lockRotation) this.token.update({ rotation: deg });
        if (!this.sprite || this.token.getFlag(MODULE_ID, 'indicatorDisabled')) {
            return false;
        }
        this.sprite.angle = deg;
        return true;
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
        if (!this.token.getFlag(MODULE_ID, 'indicatorDisabled'))
            this.sprite.visible = true;
    }

    /* -------------------------------------------- */

    /**
     * hide the instance
     */
    hide() {
        if (this.sprite) {
            this.sprite.visible = false;
        }
    }

    hasSprite() {
        return (this.sprite) ? true : false;
    }
    /* -------------------------------------------- */
    
    
    /**
     * Try to determine the indicator color based on the token owner.  Defaults to red
     */
    async indicatorColor() {
        let indicator_color = colorStringToHex("FF0000");
        if (this.token.actor) {
            if (this.token.actor.hasPlayerOwner) {
                let user = await Helpers.getTokenOwner(this.token);
                if (user.length > 0) {
                    if (user[0] != null && user[0].data.color != null) { //Bandage by Z-Machine
                        indicator_color = colorStringToHex(user[0].data.color);
                    }
                }
            }
        }
        return indicator_color;
    }

    /**
     * This is the default indicator & style. A small triangle
     */
    async generateDefaultIndicator(indicator_color) {
        let triangle = this.generateTriangleIndicator("normal", indicator_color, 0x000000);
        return triangle;
    }

    /**
     * 
     * @param {string} size        -- string from ['small','normal','large']
     * @param {string} fillColor   -- string in hex color code of fill color
     * @param {string} borderColor -- string in hex color code of border color
     */
    generateTriangleIndicator(size = "", fillColor = "", borderColor = "") {
        let i = new PIXI.Graphics();

        let modHeight = 25;
        let modWidth = 10;

        if (size == 'large') {
            modHeight = 40;
            modWidth = 16;
        }

        i.beginFill(fillColor, .5).lineStyle(2, borderColor, 1)
            .moveTo(this.token.w / 2, this.token.h + modHeight)
            .lineTo(this.token.w / 2 - modWidth, this.token.h + modWidth)
            .lineTo(this.token.w / 2 + modWidth, this.token.h + modWidth)
            .lineTo(this.token.w / 2, this.token.h + modHeight)
            .closePath()
            .endFill()
            .beginFill(0x000000, 0).lineStyle(0, 0x000000, 0)
            .drawCircle(this.token.w / 2, this.token.w / 2, this.token.w * 2.5)
            .endFill();

        let texture = canvas.app.renderer.generateTexture(i);
        return new SpriteID(texture, this.token.id);
    }

    generateSpaceIndicator(size = "", fillColor = "") {
        let i = new PIXI.Graphics();


        i.beginFill(0x000000, .8).lineStyle(2, 0x000000, 1)
            .moveTo(this.token.w / 2, 0)
            .lineTo(this.token.w / 2, 0)
            .closePath()
            .endFill()
            .beginFill(fillColor, .8).lineStyle(0, 0x000000, 1)
            .drawCircle(this.token.w / 2, 500, 20)
            .endFill();

        let texture = canvas.app.renderer.generateTexture(i);
        return new SpriteID(texture, this.token.id);
    }
    
    generateHexFacingsIndicator(fillColor = 0xe8FF00, borderColor = 0x000000) {
        let i = new PIXI.Graphics();
        let h0 = 1;
        let padding = 12;       // Necessary pad around the hex because Foundry doesn't seem to center a hex icon exactly
        let w0 = padding / -2;
        let thickness = 3;
        let alpha = 0.5;
        let w = this.token.w + padding;
        let h = this.token.h + padding;
        let w3 = w / 3;
        let w23 = w3 * 2;
        let cos60 = 0.86602540378443864676372317075294;
        let x = (h / 2) / cos60;
        let wi = (w - x) / 2;

        let modHeight = 40;
        let modWidth = 16;

        let red = 0xff0000;
        let green = 0x00ff00;
        let blue = 0x0000ff;

        i.beginFill(fillColor, .5).lineStyle(2, borderColor, 1)
            .moveTo(this.token.w / 2, this.token.h + modHeight)
            .lineTo(this.token.w / 2 - modWidth, this.token.h + modWidth)
            .lineTo(this.token.w / 2 + modWidth, this.token.h + modWidth)
            .lineTo(this.token.w / 2, this.token.h + modHeight)
            .closePath()
            .endFill()
            .lineStyle(thickness, red, alpha)
            .moveTo(wi + w0, h0)
            .lineTo(wi + x + w0, h0)
            .lineStyle(thickness, blue, alpha)
            .lineTo(w + w0, (h + h0) / 2)
            .lineStyle(thickness, green, alpha)
            .lineTo(wi + x + w0, h + h0)
            .lineTo(wi + w0, h + h0)
            .lineTo(w0, (h + h0)/2)
            .lineStyle(thickness, blue, alpha)
            .lineTo(wi + w0, h0)
            .closePath()

            .beginFill(0x000000, 0).lineStyle(0, 0x000000, 0)
            .drawCircle(this.token.w / 2, this.token.w / 2, this.token.w * 2.5)
            .endFill();
        let texture = canvas.app.renderer.generateTexture(i);
        return new SpriteID(texture, this.token.id);
    }

    generateStarIndicator(fillColor = 0xe8FF00, borderColor = 0x000000) {
        let i = new PIXI.Graphics();
        let w = this.token.w;
        let h = this.token.h;
        let wc = w / 2;
        let hc = h / 2;
        let arrPoints = [
            0, 0,
            wc, h,
            h, wc + 100
        ]


        i.beginFill(fillColor, 1).lineStyle(2, borderColor).moveTo(wc, 0);


        i.drawPolygon([450, -50, // Starting x, y coordinates for the star
                470, 25, // Star is drawn in a clockwork motion
                530, 55,
                485, 95,
                500, 150,
                450, 120,
                400, 150,
                415, 95,
                370, 55,
                430, 25
            ])
            .drawCircle(450, 45, 60)


            .endFill();

        let texture = canvas.app.renderer.generateTexture(i);
        return new SpriteID(texture, this.token.id);
    }
}