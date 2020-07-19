/**
 * About Face -- A Token Rotator
 *      Rotates tokens based on the direction the token is moved
 * 
 * version 1.6.5                  by Eadorin
 */
const mod = 'about-face';
const modKey = 'position';
const modDisplayName = "About Face";
import {
    TokenIndicator
} from './src/token-indicator.js';


CONFIG.debug.hooks = true;

// ---- a few var inits ----
var TokenIndicators = []; // an array to hold all of the TokenIndicator instances
var useIndicator, enableRotation; // convenience
var token_rotation = 0;

/* -------------------------------------------- */

Hooks.once("init", () => {
    game.settings.register(mod, 'enable-rotation', {
        name: "about-face.options.enable-rotation.name",
        hint: "about-face.options.enable-rotation.hint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register(mod, 'use-indicator', {
        name: "about-face.options.enable-indicator.name",
        hint: "about-face.options.enable-indicator.hint",
        scope: "world",
        config: true,
        default: "2",
        type: String,
        choices: {
            "0": "about-face.options.indicator.choices.0",
            "1": "about-face.options.indicator.choices.1",
            "2": "about-face.options.indicator.choices.2"
        }
    });
    game.settings.register(mod, 'indicator-sprite', {
        name: "about-face.options.indicator-sprite.name",
        hint: "about-face.options.indicator-sprite.hint",
        scope: "world",
        config: true,
        default: "normal",
        type: String,
        choices: {
            "normal": "about-face.options.indicator-sprite.choices.normal",
            "large-triangle": "about-face.options.indicator-sprite.choices.large",
        }
    });

    game.settings.register(mod, 'flip-or-rotate', {
        name: "about-face.options.flip-or-rotate.name",
        hint: "about-face.options.flip-or-rotate.hint",
        scope: "world",
        config: true,
        default: "rotate",
        type: String,
        choices: {
            "rotate": "about-face.options.flip-or-rotate.choices.rotate",
            "flip-v": "about-face.options.flip-or-rotate.choices.flip-v",
            "flip-h": "about-face.options.flip-or-rotate.choices.flip-h"
        }
    });

    // convenience
    AboutFace.refreshSettings();

});


/* -------------------------------------------- */

export class AboutFace {
    static async ready() {

        TokenIndicators = [];

        for (let i = 0; i < TokenLayer.instance.ownedTokens.length; i++) {
            AboutFace.setRotationFlags(TokenLayer.instance.ownedTokens[i], 0);
        }

        for (let [i, token] of canvas.tokens.placeables.entries()) {
            if (!(token instanceof Token) || !token.actor) {
                continue;
            }

            let ti = await TokenIndicator.init(token);
            ti.create(game.settings.get(mod, "indicator-sprite"));
            if (!useIndicator || useIndicator == "1") {

                if (ti.hasSprite()) {
                    ti.hide();
                }
            }
            TokenIndicators.push(ti);
        }
    }

    /* -------------------------------------------- */

    static async setRotationFlags(token, rotation_value) {
        console.log("Setting:", token.data);

        let position = {
            "x": token.data.x,
            "y": token.data.y,
            "facing": rotation_value
        };
        if (typeof token.getFlag(mod, modKey) !== 'undefined') {
            await token.unsetFlag(mod, modKey, position);
        }
        await token.setFlag(mod, modKey, position);
        return token;
    }

    /**
     * Rotation function primarily used by our key event handlers
     */
    static async rotate(direction) {
        if (!useIndicator) {
            return
        }
        let tokenIndicators = [];
        activeTokens.forEach(token => {
            tokenIndicators.push((TokenIndicators.filter(ti => ti.token.id == token.id))[0]);
            let pos = token.getFlag(mod, modKey);
            pos.facing = AboutFace.getRotationDegrees(direction);
            token.unsetFlag(mod, modKey);
            token.setFlag(mod, modKey, pos);

        });

        tokenIndicators.forEach(ti => {
            let dir = AboutFace.getRotationDegrees(null, null, direction);
            if (!ti) return; // addresses a weird issue where a token might be removed.

            token_rotation = ti.rotate(dir);

            ti.token.update({
                rotate: token_rotation
            });
        });
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
        if (options.lockRotation) {
            // the token should not rotate!
        }

        if (typeof token === 'undefined') return;
        token = (token instanceof Token) ? token : canvas.tokens.get(token._id);
        token.refresh();
        if (typeof token.getFlag(mod, modKey) === 'undefined') {
            token.data.flags[mod][modKey] = {
                'x': token.x,
                'y': token.y,
                'facing': 0
            };
        }

        // get old position data
        let pos = token.data.flags[mod][modKey];

        // calculate new position data
        let dX = (updateData.x) ? updateData.x - pos.x : 0; // new X
        let dY = (updateData.y) ? updateData.y - pos.y : 0; // new Y
        let facing = pos.facing; // facing direction

        let dir = AboutFace.getRotationDegrees(dX, dY); // new way to rotate
    
        // update our new position
        pos.x = (updateData.x) ? updateData.x : token.x;
        pos.y = (updateData.y) ? updateData.y : token.y;
        pos.facing = dir;
        token.data.flags[mod][modKey] = pos;
  
        // exit if new direction is same as old
        if ((dir == facing) && (game.settings.get(mod, 'flip-or-rotate') == "rotate")) return;

        // update direction here, preventing rotate() from triggering stack issue
        // don't rotate because of user setting
        if (!enableRotation && !useIndicator) return;

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
                token.sortableChildren = true;
                token.indicator.zIndex = 1;
                token.target.zIndex = 5;
                token.icon.zIndex = 10;
                token.refresh();
                token.indicator.rotate(dir);
            }
            // let token_rotation = token.indicator.rotate(dir);
        }
        //==================================================================
        // Token Flipping
        // token.width !== token.w lol
        if (game.settings.get(mod, 'flip-or-rotate') !== "rotate") {
            
            if (game.settings.get(mod, 'flip-or-rotate') == "flip-v") {
                if (pos.facing == 0) {
                    token.icon.scale.y = 1;
                    token.pivot.y = token.h;
                } else if (pos.facing == 180) {
                    token.icon.scale.y = -1;
                    token.pivot.y = -(token.h);
                }

            } else {
                console.log("Horizontal test", dir);
                if (pos.facing == 90) {
                    token.icon.scale.x = -1;
                    // token.pivot.x = -(token.w);
                    // token.pivot.x = 0;
                } else if (pos.facing == 270) {
                    token.icon.scale.x = 1;
                    // token.pivot.x = 0;
                }
            }
            return;
        }


        if (!enableRotation) return;

        token.data.rotation = dir;
        // token.rotate({
        //     angle: dir,
        //     snap: 45
        // });
        token.refresh();
        token.update({
            rotation: dir
        });
        token.refresh();
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


    static controlTokenEventHandler(token, opt) {
        if (opt) {
            activeTokens.push(token);
        } else {
            const index = activeTokens.indexOf(token);
            if (index > -1) {
                activeTokens.splice(index, 1);
            }

            AboutFace.setRotationFlags(token, 0);
        }
    }

    static closeSettingsConfigEventHandler(settingsConfig, obj) {
        AboutFace.refreshSettings();
    }

    static refreshSettings() {
        enableRotation = game.settings.get(mod, "enable-rotation");
        useIndicator = game.settings.get(mod, "use-indicator");
        useIndicator = (useIndicator == "1" || useIndicator == "2") ? useIndicator : false;
        switch (useIndicator) {
            case "0":
            case "1":
                AboutFace.hideAllIndicators();
                break;
            case "2":
                AboutFace.showAllIndicators();
                break;
            default:
                break;
        }
        // console.log(useIndicator);
    }
}


//===================================================
// Handle key events, specifically holding shift
//===================================================
var activeTokens = [];
$(document).keydown(function (event) {

    // detect which token trying to move

    if (event.shiftKey) {
        switch (event.which) {
            case 65: // a
            case 37: // left arrow
                AboutFace.rotate('left');
                break;
            case 87: // w
            case 38: // up arrow
                AboutFace.rotate('up');
                break;
            case 68: // d
            case 39: // right arrow
                AboutFace.rotate('right');
                break;
            case 83: // s
            case 40: // down arrow
                AboutFace.rotate('down');
                break;
            default:
                break;
        }
    }

});

var map = {}; // You could also use an array
onkeydown = onkeyup = function (e) {
    e = e || event; // to deal with IE
    map[e.keyCode] = e.type == 'keydown';

    if (e.shiftKey) {
        if ((map[87] && map[65]) || (map[38] && map[37])) {
            AboutFace.rotate('up-left');
        } else if ((map[87] && map[68]) || (map[38] && map[39])) {
            AboutFace.rotate('up-right');
        } else if ((map[83] && map[65]) || (map[40] && map[37])) {
            AboutFace.rotate('down-left');
        } else if ((map[83] && map[68]) || (map[40] && map[39])) {
            AboutFace.rotate('down-right');
        }

    }
}



Hooks.on("canvasReady", AboutFace.ready);
Hooks.on("updateToken", AboutFace.updateTokenEventHandler);
Hooks.on("controlToken", AboutFace.controlTokenEventHandler);
Hooks.on("hoverToken", AboutFace.hoverTokenEventHandler);
Hooks.on("ready", () => {
    Hooks.on("closeSettingsConfig", AboutFace.closeSettingsConfigEventHandler);
})