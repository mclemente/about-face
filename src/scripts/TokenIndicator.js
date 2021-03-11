import { SpriteID } from './SpriteID.js';
import { getTokenOwner, isFirstActiveGM } from './helpers.js';
import { log, LogLevel } from './logging.js';
import { AboutFace } from '../about-face.js';
import flipAngles from './flipAngles.js'

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
        const flipOrRotate = token.getFlag(MODULE_ID, 'flipOrRotate') || AboutFace.flipOrRotate;
        if (flipOrRotate !== 'rotate') token.update({lockRotation:true});
    }

    /* -------------------------------------------- */

    /**
     * Create the indicator using the instance's indicator sprite
     * If one hasn't been specified/set, use the default
     */
    async create(scene) {
        log(LogLevel.DEBUG, 'TokenIndicator create()');
        let indicator_color = await this.indicatorColor();
        if (AboutFace.spriteType === 0)
            this.sprite = this.generateTriangleIndicator("normal", indicator_color, 0x000000);
        else if (AboutFace.spriteType === 1)
            this.sprite = this.generateTriangleIndicator("large", indicator_color, 0x000000);
        if (AboutFace.spriteType === 2) {
            // Only allow the Hex sprite on Hex Column scenes (gridType 4 & 5).
            if (scene?.data.gridType >= 4) 
                this.sprite = this.generateHexFacingsIndicator(indicator_color);  
            else {
                log(LogLevel.ERROR, 'TokenIndicator.create', 'hex indicator only works on hex scenes!');
                ui.notifications.notify(`About Face: hex indicator only works on hex scenes!`, 'error');
                return;
            }
        }        

        this.sprite.zIndex = -1;
        this.sprite.position.x = this.token.w / 2;
        this.sprite.position.y = this.token.h / 2;
        this.sprite.anchor.set(.5);
        this.sprite.angle = this.token.data.rotation;

        this.c.addChild(this.sprite);
        this.token.addChild(this.c);

        if (game.settings.get(MODULE_ID, 'indicator-state') !== IndicatorMode.ALWAYS || this.token.getFlag(MODULE_ID, 'indicatorDisabled'))
            this.sprite.visible = false;

        this.rotate(this.token.data.rotation);

        return this;
    }

    /**
     * Wipe the current indicator.      
     */
    async wipe() {
        this.token.removeChild(this.c);
    }

    /* -------------------------------------------- */

    /**
     * Rotates the sprite
     * @param {int|float} deg  -- rotate the sprite the specified amount. 
     * If deg is omitted it will rotate to the current direction.
     * 
     */
    rotate(deg) {
        log(LogLevel.DEBUG, 'TokenIndicator rotate()');

        if (deg == null) deg = this.token.getFlag(MODULE_ID, 'direction') || 0;

        if (isFirstActiveGM()) {

            let flipOrRotate = this.token.getFlag(MODULE_ID, 'flipOrRotate') || AboutFace.flipOrRotate;

            if (flipOrRotate === "rotate") {
                if (!this.token.data.lockRotation) this.token.update({ rotation: deg });
            }
            else {
            
                let facingDirection = (this.token.getFlag(MODULE_ID, 'facingDirection')) || AboutFace.facingDirection;

                // todo: gridless angles (should be between angles instead)
                
                let angles = flipAngles[canvas.grid.type][flipOrRotate][facingDirection];
                if (angles[deg] != null) {
                    const update = {
                        [angles.mirror]: angles[deg],
                    }
                    log(LogLevel.INFO, 'rotate', deg, angles.mirror, angles[deg]);
                    this.token.update(update);
                }
            }
        }        
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
                let user = await getTokenOwner(this.token);
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
            .drawCircle(this.token.w / 2, this.token.w / 2, this.token.w / 2 + modHeight)
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

        // to get an accurate radius of the token + indicator we need to deal with the fact
        // that hex grids have tokens that are bigger than the grid.
        // todo: now redundant, remove or fix
        const ratio = canvas.grid.size / this.token.w;
        const radius = ((this.token.w / 2) * ratio) + modHeight ;


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
            .drawCircle(this.token.w / 2, this.token.w / 2, radius)
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