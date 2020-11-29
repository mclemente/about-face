import {
    SpriteID
} from './sprite-id.js';

import * as Helpers from './helpers.js';

/**
 * Used to handle the indicators for direction for tokens
 */
export class TokenIndicator {

    constructor(token, sprite = {}) {
        this.token = token;
        this.sprite = sprite;
        this.owner = token.owner;
        this.c = new PIXI.Container();        
    }

    /* -------------------------------------------- */

    /**
     * Create the indicator using the instance's indicator sprite
     * If one hasn't been specified/set, use the default
     */
    async create(sprite = {}) {
        if (!sprite) {
            this.sprite = await this.generateDefaultIndicator();

            // this.sprite = this.generateSpaceIndicator('',0x000000);
            // this.sprite = this.generateStarIndicator();
        } else {
            if (sprite == "large-triangle") {
                this.sprite = await this.generateTriangleIndicator('large', 0xEAFF00, 0x000000);
            } else {
                this.sprite = await this.generateDefaultIndicator();
            }
        }

        this.sprite.zIndex = -1;
        this.sprite.position.x = this.token.w / 2;
        this.sprite.position.y = this.token.h / 2;
        this.sprite.anchor.set(.5);
        this.sprite.angle = this.token.angle;

        this.c.addChild(this.sprite);
        this.token.addChild(this.c);

        return this;

    }

    /* -------------------------------------------- */

    /**
     * Rotates the sprite
     * @param {int|float} deg  -- rotate the sprite the specified amount
     */
    rotate(deg) {
        this.token.rotate(deg);
        if (!this.sprite) {
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
     * This is the default indicator & style. A small triangle
     */
    async generateDefaultIndicator() {

        let indicator_color = colorStringToHex("FF0000");

        if (this.token.actor) {
            if (this.token.actor.hasPlayerOwner) {
                let user = await (Helpers.getTokenOwner(this.token));
                if (user.length > 0) {
                    indicator_color = colorStringToHex(user[0].data.color);
                }
            }
        }

        let triangle = this.generateTriangleIndicator("normal", indicator_color, 0x000000);

        return triangle;
        //indicator_color = colorStringToHex(game.user.color);
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