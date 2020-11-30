/**
 * About Face -- A Token Rotator
 *      Rotates tokens based on the direction the token is moved
 * 
 * version 2.0.0                by Eadorin
 */

import { TokenIndicator } from './scripts/TokenIndicator.js';
import { log, LogLevel } from './scripts/logging.js'
import { getRotationDegrees } from './scripts/helpers.js'

const MODULE_ID = 'about-face';

CONFIG.debug.hooks = false;
CONFIG[MODULE_ID] = {logLevel:2};

const IndicatorStates = {
    OFF: 0,
    HOVER: 1,
    ALWAYS: 2,
};

/* -------------------------------------------- */

Hooks.once("init", () => {
    log(LogLevel.INFO, 'initialising...');

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
    
    static async canvasReadyHandler() {
        log(LogLevel.INFO, 'canvasReadyHandler');        

        for (let [i, token] of canvas.tokens.placeables.entries()) {
            if (!(token instanceof Token) || !token.actor || token.data.lockRotation) {
                continue;
            }
            log(LogLevel.INFO, 'creating TokenIndicator for:', token.name);
            AboutFace.tokenIndicators[token.id] = await new TokenIndicator(token).create();
        }

        AboutFace.indicatorState = game.settings.get(MODULE_ID, 'use-indicator');        
        AboutFace.sceneEnabled = canvas.scene.getFlag(MODULE_ID, 'sceneEnabled') != null 
            ? canvas.scene.getFlag(MODULE_ID, 'sceneEnabled') 
            : true;

        if (game.user.isGM) game.settings.set(MODULE_ID, 'enable-rotation', AboutFace.sceneEnabled);    
    }


    /* -------------------------------------------- */

    /**
     * GM checks for movement and sets flags, then all users update based on those flags.
     * Therefore, runs twice per turn.
     * @param {Scene} scene         - the current scene
     * @param {object} token        - data of the clicked token
     * @param {object} updateData   - the data that was actually updated by the move
     * @param {*} options 
     * @param {*} userId 
     */
    static async updateTokenHandler(scene, token, updateData, options, userId) {
        if (!AboutFace.sceneEnabled) return;
        token = (token instanceof Token) ? token : canvas.tokens.get(token._id);
        log(LogLevel.DEBUG, 'updateTokenHandler', token.name);

        if (updateData.lockRotation != null) {
            if (updateData.lockRotation) {
                AboutFace.tokenIndicators[token.id].hide();
                delete AboutFace.tokenIndicators[token.id];
            } else {
                if (AboutFace.tokenIndicators[token.id]) log(LogLevel.WARN, 'updateTokenHandler lockRotation token is already in pool!');
                else AboutFace.tokenIndicators[token.id] = await new TokenIndicator(token).create();                 
                if (AboutFace.indicatorState === IndicatorStates.ALWAYS)
                    AboutFace.tokenIndicators[token.id].show();                
            }
            return;
        }

        // the GM will observe all movement of tokens and set appropriate flags
        if (game.user.isGM && (updateData.x != null || updateData.y != null || updateData.rotation != null)) {
            
            if (updateData.rotation != null) return await token.setFlag(MODULE_ID, 'direction', updateData.rotation);
            
            // check for movement
            const lastPos = new PIXI.Point(AboutFace.tokenIndicators[token.id].token.x, AboutFace.tokenIndicators[token.id].token.y);
            // calculate new position data
            let dX = (updateData.x != null) ? updateData.x - lastPos.x : 0; // new X
            let dY = (updateData.y != null) ? updateData.y - lastPos.y : 0; // new Y
            if (dX === 0 && dY === 0 && facing === 0) return;
            let dir = getRotationDegrees(dX, dY);
    
            return await token.setFlag(MODULE_ID, 'direction', dir);
        }

        if (updateData.flags == null || updateData.flags[MODULE_ID]?.direction == null) return;

        AboutFace.tokenIndicators[token.id].rotate(updateData.flags[MODULE_ID]?.direction);
    }

    static hoverTokenHandler(token, isHovering) {
        if (!AboutFace.sceneEnabled || AboutFace.indicatorState !== IndicatorStates.HOVER) return;        
        token = (token instanceof Token) ? token : canvas.tokens.get(token._id);
        log(LogLevel.DEBUG, 'hoverTokenHandler', token.name);

        if (!token.owner) return;

        if (isHovering)
            AboutFace.tokenIndicators[token.id].show();
        else 
            AboutFace.tokenIndicators[token.id].hide();
    }

    /**
     * Handler called when scene data updated.      
     * @function
     * @param scene - reference to the current scene
     * @param changes - changes
     */
    static updateSceneHandler(scene, updateData) {
        if (updateData.flags == null || updateData.flags[MODULE_ID]?.sceneEnabled == null) return;             
        log(LogLevel.DEBUG, 'updateSceneHandler', scene);

        AboutFace.sceneEnabled = updateData.flags[MODULE_ID]?.sceneEnabled;
        if (!AboutFace.sceneEnabled)
            AboutFace.hideAllIndicators();
        else if (AboutFace.indicatorState === IndicatorStates.ALWAYS)
            AboutFace.showAllIndicators();
    }

    static showAllIndicators() {
        if (canvas == null) return;
        log(LogLevel.DEBUG, 'showAllIndicators');
        for (const id in AboutFace.tokenIndicators) {
            AboutFace.tokenIndicators[id].show();
        }
    }

    static hideAllIndicators() {
        if (canvas == null) return;
        log(LogLevel.DEBUG, 'hideAllIndicators');
        for (const id in AboutFace.tokenIndicators) {
            AboutFace.tokenIndicators[id].hide();
        }
    }

    static async createTokenHandler(scene, token) {        
        token = (token instanceof Token) ? token : canvas.tokens.get(token._id);
        if (token.data.lockRotation) return;
        log(LogLevel.INFO, 'createTokenHandler, creating TokenIndicator for:', token.name);        
        AboutFace.tokenIndicators[token.id] = await new TokenIndicator(token).create();
    }
    
    static async deleteTokenHandler(scene, token) {       
        log(LogLevel.INFO, 'deleteTokenHandler:', token._id); 
        delete AboutFace.tokenIndicators[token._id];
    }
}

Hooks.on("createToken", AboutFace.createTokenHandler);
Hooks.on("deleteToken", AboutFace.deleteTokenHandler);
Hooks.on("canvasReady", AboutFace.canvasReadyHandler);
Hooks.on("hoverToken", AboutFace.hoverTokenHandler);
Hooks.on("updateToken",  AboutFace.updateTokenHandler);
Hooks.on("updateScene",  AboutFace.updateSceneHandler);
