/**
 * About Face -- A Token Rotator
 *      Rotates tokens based on the direction the token is moved
 * 
 * version 1.6.5                  by Eadorin
 */
const MODULE_ID = 'about-face';

import { TokenIndicator } from './scripts/token-indicator.js';
import { log, LogLevel } from './scripts/logging.js'
import { getRotationDegrees } from './scripts/helpers.js'

CONFIG.debug.hooks = false;
CONFIG[MODULE_ID] = {logLevel:1};

const IndicatorStates = {
    OFF: 0,
    HOVER: 1,
    ALWAYS: 2,
};

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
            AboutFace.disabled = !value;
            if (AboutFace.disabled)
                AboutFace.hideAllIndicators();
            else if (AboutFace.indicatorState === IndicatorStates.ALWAYS)
                AboutFace.showAllIndicators();
        }
      });
    
      game.settings.register(MODULE_ID, 'use-indicator', {
        name: "about-face.options.enable-indicator.name",
        hint: "about-face.options.enable-indicator.hint",
        scope: "world",
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
            if (AboutFace.indicatorState === IndicatorStates.ALWAYS)
                AboutFace.hideAllIndicators();
            if (state === IndicatorStates.ALWAYS && !AboutFace.disabled)
                AboutFace.showAllIndicators();
            AboutFace.indicatorState = state;
        }
      });
    
    //   game.settings.register(MODULE_ID, 'indicator-sprite', {
    //     name: "about-face.options.indicator-sprite.name",
    //     hint: "about-face.options.indicator-sprite.hint",
    //     scope: "world",
    //     config: true,
    //     default: "normal",
    //     type: String,
    //     choices: {
    //         "normal": "about-face.options.indicator-sprite.choices.normal",
    //         "large-triangle": "about-face.options.indicator-sprite.choices.large",
    //     }
    //   });
    
    //   game.settings.register(MODULE_ID, 'flip-or-rotate', {
    //     name: "about-face.options.flip-or-rotate.name",
    //     hint: "about-face.options.flip-or-rotate.hint",
    //     scope: "world",
    //     config: true,
    //     default: "rotate",
    //     type: String,
    //     choices: {
    //         "rotate": "about-face.options.flip-or-rotate.choices.rotate",
    //         "flip-v": "about-face.options.flip-or-rotate.choices.flip-v",
    //         "flip-h": "about-face.options.flip-or-rotate.choices.flip-h"
    //     }
    //   });

});


/* -------------------------------------------- */

export class AboutFace {

    static initialize() {
        AboutFace.disabled = false;
        AboutFace.tokenIndicators = {};
        AboutFace.indicatorState;
    }
    
    static async ready() {
        log(LogLevel.INFO, 'ready');        

        AboutFace.disabled = game.settings.get(MODULE_ID, 'enable-rotation');
        AboutFace.indicatorState = game.settings.get(MODULE_ID, 'use-indicator');
           
        for (let [i, token] of canvas.tokens.placeables.entries()) {
            if (!(token instanceof Token) || !token.actor) {
                continue;
            }
            log(LogLevel.DEBUG, 'ready: token ',token.name);
            AboutFace.tokenIndicators[token.id] = await new TokenIndicator(token).create();
        }
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
        if (AboutFace.disabled) return;
        log(LogLevel.DEBUG, 'updateTokenEventHandler', token);

        // the GM will observe all movement of tokens and set appropriate flags
        if (game.user.isGM && (updateData.x != null || updateData.y != null || updateData.rotation != null)) {
            log(LogLevel.DEBUG, 'updateTokenEventHandler', token);

            token = (token instanceof Token) ? token : canvas.tokens.get(token._id);
            if (updateData.rotation != null) return token.setFlag(MODULE_ID, 'direction', updateData.rotation);
            // check for movement
            const lastPos = new PIXI.Point(AboutFace.tokenIndicators[token.id].token.x, AboutFace.tokenIndicators[token.id].token.y);
            // calculate new position data
            let dX = (updateData.x != null) ? updateData.x - lastPos.x : 0; // new X
            let dY = (updateData.y != null) ? updateData.y - lastPos.y : 0; // new Y
            if (dX === 0 && dY === 0 && facing === 0) return;
            let dir = getRotationDegrees(dX, dY);
    
            return token.setFlag(MODULE_ID, 'direction', dir);
        }

        if (updateData.flags == null || updateData.flags[MODULE_ID]?.direction == null) return;

        if (token === undefined) return;
        token = (token instanceof Token) ? token : canvas.tokens.get(token._id);

        AboutFace.tokenIndicators[token.id].rotate(updateData.flags[MODULE_ID]?.direction);
    }

    static hoverTokenEventHandler(token, isHovering) {
        if (AboutFace.disabled || AboutFace.indicatorState !== IndicatorStates.HOVER) return;
        token = (token instanceof Token) ? token : canvas.tokens.get(token._id);
    
        if (!token.owner) return;

        if (isHovering)
            AboutFace.tokenIndicators[token.id].show();
        else 
            AboutFace.tokenIndicators[token.id].hide();
    }

    static showAllIndicators() {
        if (canvas == null) return;

        for (const id in AboutFace.tokenIndicators) {
            AboutFace.tokenIndicators[id].show();
        }
    }

    static hideAllIndicators() {
        if (canvas == null) return;

        for (const id in AboutFace.tokenIndicators) {
            AboutFace.tokenIndicators[id].hide();
        }
    }

    static async createTokenHandler(scene, token) {
        if (!game.user.isGM) return;
        token = (token instanceof Token) ? token : canvas.tokens.get(token._id);
        AboutFace.tokenIndicators[token.id] = await new TokenIndicator(token).create();
    }
}

Hooks.on("createToken", AboutFace.createTokenHandler);
Hooks.on("canvasReady", AboutFace.ready);
Hooks.on("hoverToken", AboutFace.hoverTokenEventHandler);
Hooks.on("updateToken",  AboutFace.updateTokenEventHandler);