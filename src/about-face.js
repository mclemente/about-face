/**
 * About Face -- A Token Rotator
 *      Rotates tokens based on the direction the token is moved
 * 
 * version 1.6.5                  by Eadorin
 */

import { TokenIndicator } from './scripts/TokenIndicator.js';
import { log, LogLevel } from './scripts/logging.js'

const MODULE_ID = 'about-face';

CONFIG.debug.hooks = false;
CONFIG[MODULE_ID] = {logLevel:1};


// ---- a few var inits ----
var TokenIndicators = []; // an array to hold all of the TokenIndicator instances
var useIndicator, enableRotation; // convenience
var token_rotation = 0;

/* -------------------------------------------- */

Hooks.once("init", () => {
    log(LogLevel.INFO, 'initialising...')

    AboutFace.initialize();

    game.settings.register(MODULE_ID, 'enable-rotation', {
        name: "about-face.options.enable-rotation.name",
        hint: "about-face.options.enable-rotation.hint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
        onChange: (value) => { 
            if (!canvas.scene) return;
            AboutFace.sceneEnabled = value;
            if (game.user.isGM) canvas.scene.setFlag(MODULE_ID, 'sceneEnabled', AboutFace.sceneEnabled);            
        }
      });
    
      game.settings.register(MODULE_ID, 'use-indicator', {
        name: "about-face.options.enable-indicator.name",
        hint: "about-face.options.enable-indicator.hint",
        scope: "client",
        config: true,
        default: 2,
        type: Number,
        choices: {
            0: "about-face.options.indicator.choices.0",
            1: "about-face.options.indicator.choices.1",
            2: "about-face.options.indicator.choices.2"
        },
        onChange: (value) => { 
            let state = Number(value);
            if (state !== IndicatorStates.ALWAYS)
                AboutFace.hideAllIndicators();
            else if (AboutFace.sceneEnabled)
                AboutFace.showAllIndicators();
            AboutFace.indicatorState = state;
        }
      });
});


/* -------------------------------------------- */

export class AboutFace {

    static initialize() {
        AboutFace.sceneEnabled = true;
        AboutFace.tokenIndicators = {};
        AboutFace.indicatorState;
    }

    static async ready() {
        log(LogLevel.INFO, 'ready');        
        TokenIndicators = [];
        for (let [i, token] of canvas.tokens.placeables.entries()) {
            if (!(token instanceof Token) || !token.actor) {
                continue;
            }

            log(LogLevel.DEBUG, 'ready: token ',token.name);

            let ti = await AboutFace.getIndicator(token);

            TokenIndicators.push(ti);
            if (!token.getFlag(MODULE_ID, modKey)) log(LogLevel.ERROR, 'ready: token getFlag problem', token.name);

            token.indicator.rotate((token.getFlag(MODULE_ID, modKey)).facing);
        }


    }

    /* -------------------------------------------- */
    /**
     * returns the degrees to rotate a token
     * @param {int} dX     the value of x2 - x1
     * @param {int} dY     the value of y2 - y1
     * @return int
     **/
    static getRotationDegrees(dX = null, dY = null, dir = null) {
        var rotation;
        if ((dX == 0 && dY < 0) || dir == "up") rotation = 180; // up
        else if ((dX == 0 && dY > 0) || dir == "down") rotation = 0; // down
        else if ((dX > 0 && dY == 0) || dir == "right") rotation = 270; // to the right
        else if ((dX > 0 && dY < 0) || dir == "up-right") rotation = 225; // up to the right
        else if ((dX > 0 && dY > 0) || dir == "down-right") rotation = 315; // down to the right
        else if ((dX < 0 && dY == 0) || dir == "left") rotation = 90; // to the left
        else if ((dX < 0 && dY > 0) || dir == "down-left") rotation = 45; // down to the left
        else if ((dX < 0 && dY < 0) || dir == "up-left") rotation = 135 // up to the left
        let token_rotation = rotation || 0;

        // i messed with every version of atan, atan2 I could come up with; inverted Y makes it tough
        return token_rotation;

    }

    /* -------------------------------------------- */

    /**
     * Gets the new rotational value and rotates the token
     * @param {Scene} scene         - the current scene
     * @param {object} token        - data of the clicked token
     * @param {object} updateData   - the data that was actually updated by the move
     * @param {*} options 
     * @param {*} userId 
     */
    static async updateTokenEventHandler(scene, token, updateData, options, userId) {

        if (!updateData.x && !updateData.y) return;
        log(LogLevel.DEBUG, 'updateTokenEventHandler', token);
        if (options.lockRotation) {
            // the token should not rotate!
        }

        if (token === undefined) return;
        token = (token instanceof Token) ? token : canvas.tokens.get(token._id);
        //token.refresh();

        let pos;
        if (updateData.flags === undefined) {
            updateData.flags = {};
        }
        if (token.getFlag(MODULE_ID, modKey) === undefined) {
            pos = {
                'x': token.x,
                'y': token.y,
                'facing': 0
            };
            setProperty(updateData.flags, `${MODULE_ID}.${modKey}`, pos);
        } else {
            // get old position data
            pos = token.getFlag(MODULE_ID, modKey);
        }

        // calculate new position data
        let dX = (updateData.x) ? updateData.x - pos.x : 0; // new X
        let dY = (updateData.y) ? updateData.y - pos.y : 0; // new Y
        let facing = pos.facing; // facing direction

        // console.log("AboutFace", dX, dY, facing);
        if (dX === 0 && dY === 0 && facing === 0) return;
        let dir = AboutFace.getRotationDegrees(dX, dY); // new way to rotate

        // update our new position
        pos.x = (updateData.x) ? updateData.x : token.x;
        pos.y = (updateData.y) ? updateData.y : token.y;
        pos.facing = dir;


        // exit if new direction is same as old
        if ((dir == facing) && (game.settings.get(MODULE_ID, 'flip-or-rotate') == "rotate")) return;

        // update direction here, preventing rotate() from triggering stack issue
        // don't rotate because of user setting
        if (!enableRotation && !useIndicator) return;



        // the following enables on move, but also breaks it on shift



        //==================================================================
        // Indicator Handling
        if (useIndicator) {

            if (typeof dir === "undefined" || dir == null) {
                return;
            }
            if (token.indicator) {
                // token.indicator.show;

                try {
                    token.indicator.rotate(dir);
                } catch (e) {
                    // sprite isn't there. sad.
                }
                if (useIndicator == "1") {
                    // token.indicator.hide();
                }
                // token.sortableChildren = true;
                // token.indicator.zIndex = 1;
                // token.target.zIndex = 5;
                // token.icon.zIndex = 10;
                // token.refresh();
                //token.indicator.rotate(dir);

                //canvas.sight.updateToken(token);
            }
            // let token_rotation = token.indicator.rotate(dir);
            //canvas.sight.updateToken(token);
        }
        //==================================================================
        // Token Flipping
        // token.width !== token.w lol
        if (game.settings.get(MODULE_ID, 'flip-or-rotate') !== "rotate") {

            log('updateTokenEventHandler, pos:', pos.facing);
            if (game.settings.get(MODULE_ID, 'flip-or-rotate') == "flip-v") {
                if (pos.facing == 0) {
                    updateData.mirrorY = true;
                    // token.icon.scale.y = 1;
                    // token.pivot.y = token.h;
                } else if (pos.facing == 180) {
                    updateData.mirrorY = false;
                    // token.icon.scale.y = -1;
                    // token.pivot.y = -(token.h);
                }

            } else {
                if (pos.facing == 90) {
                    updateData.mirrorX = true;
                    // token.icon.scale.x = -1;
                    // token.pivot.x = -(token.w);
                    // token.pivot.x = 0;
                } else if (pos.facing == 270) {
                    updateData.mirrorX = false;
                    // token.icon.scale.x = 1;
                    // token.pivot.x = 0;
                }
            }
            return;

        }
        setProperty(updateData.flags, `${MODULE_ID}.${modKey}`, pos);
        setProperty(updateData, 'rotation', dir);
        //canvas.sight.updateToken(token);


        if (!enableRotation) return;

        token.data.rotation = dir;
        // token.rotate({
        //     angle: dir,
        //     snap: 45
        // });
        // token.refresh();
        token.update({
            rotation: dir
        });
        // token.refresh();
        //canvas.sight.updateToken(token);
    }

    static hoverTokenEventHandler(token, opt) {

        // if (game.user.id != token.owner) { 
        //     return;
        // };

        if (useIndicator && opt) {

            if (!token.indicator) {
                return;
            }
            // show the indicator
            token.indicator.show();
            //token.flags.AboutFace.set('show',true);
        } else {
            if (useIndicator != "2") {
                if (token.indicator) {
                    token.indicator.hide();
                }

            }
        }
    }

    static showAllIndicators() {
        if (canvas == null) {
            return;
        }
        for (let [i, token] of canvas.tokens.placeables.entries()) {
            if (!(token instanceof Token)) {
                continue;
            }
            if (token.owner) {
                token.indicator.show();
            }
            token.indicator.show();
        }
    }

    static hideAllIndicators() {
        if (canvas == null) {
            return;
        }
        for (let [i, token] of canvas.tokens.placeables.entries()) {
            if (!(token instanceof Token)) {
                continue;
            }
            if (token.owner) {
                token.indicator.hide();
            }
        }
    }

    static async createTokenHandler(scene, token) {
 
        let t = canvas.tokens.placeables.find(tokenPlaceable => tokenPlaceable.id === token._id);
        let ti = await TokenIndicator.init(t);
        ti.create(game.settings.get(MODULE_ID, "indicator-sprite"));
        if (!useIndicator || useIndicator == "1") {
            ti.hide();
        }
        let pos = {
            'x': token.x,
            'y': token.y,
            'facing': token.rotation
        };        
        TokenIndicators.push(ti);
        t.setFlag(MODULE_ID,modKey,pos);
    }

}

Hooks.on("createToken", AboutFace.createTokenHandler);
Hooks.on("canvasReady", AboutFace.ready);
Hooks.on("preUpdateToken", AboutFace.updateTokenEventHandler);
Hooks.on("updateToken", (scene, id, token, ...args) => {
    // console.log(id);
});
Hooks.on("controlToken", AboutFace.controlTokenEventHandler);
Hooks.on("hoverToken", AboutFace.hoverTokenEventHandler);
Hooks.on("ready", () => {
    Hooks.on("closeSettingsConfig", AboutFace.closeSettingsConfigEventHandler);
});