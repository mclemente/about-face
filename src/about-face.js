/**
 * About Face -- A Token Rotator
 *      Rotates tokens based on the direction the token is moved
 * 
 * by Eadorin, edzillion
 */

import { TokenIndicator } from './scripts/TokenIndicator.js';
import { log, LogLevel } from './scripts/logging.js'
import { getRotationDegrees, replaceSelectChoices, isFirstActiveGM, isAboutFaceUpdate } from './scripts/helpers.js'

const MODULE_ID = 'about-face';

CONFIG.debug.hooks = false;
CONFIG[MODULE_ID] = {logLevel:2};

const IndicatorMode = {
    OFF: 0,
    HOVER: 1,
    ALWAYS: 2,
};

/* -------------------------------------------- */

Hooks.once("init", () => {
    log(LogLevel.INFO, 'initialising...');

    AboutFace.initialize();

    game.settings.register(MODULE_ID, 'scene-enabled', {
        name: "about-face.options.scene-enabled.name",
        hint: "about-face.options.scene-enabled.hint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
        onChange: (value) => { 
            if (!canvas.scene) return;
            if (isFirstActiveGM()) canvas.scene.setFlag(MODULE_ID, 'sceneEnabled', value);            
        }
      });
    
      game.settings.register(MODULE_ID, 'indicator-state', {
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
            if (Number(value) !== IndicatorMode.ALWAYS)
                AboutFace.hideAllIndicators();            
            else if (AboutFace.sceneEnabled)
                AboutFace.showAllIndicators();
        }
      });            

      game.settings.register(MODULE_ID, 'sprite-type', {
        name: "about-face.options.indicator-sprite.name",
        hint: "about-face.options.indicator-sprite.hint",
        scope: "world",
        config: true,
        default: 0,
        type: Number,
        choices: {
            0: "about-face.options.indicator-sprite.choices.normal",
            1: "about-face.options.indicator-sprite.choices.large",
            2: "about-face.options.indicator-sprite.choices.hex"
        },
        onChange: async (value) => { 
            if (!canvas.scene) return;
            value = Number(value);
            if (isFirstActiveGM()) canvas.scene.setFlag(MODULE_ID, 'spriteType', value);          
        }
      });

    game.settings.register(MODULE_ID, 'flip-or-rotate', {
        name: "about-face.options.flip-or-rotate.name",
        hint: "about-face.options.flip-or-rotate.hint",
        scope: "world",
        config: true,
        default: "flip-h",
        type: String,
        choices: {
            "rotate": "about-face.options.flip-or-rotate.choices.rotate",
            "flip-h": "about-face.options.flip-or-rotate.choices.flip-h",
            "flip-v": "about-face.options.flip-or-rotate.choices.flip-v"
        },
        onChange: (value) => { 
            if (!canvas.scene) return;
            if (isFirstActiveGM()) canvas.scene.setFlag(MODULE_ID, 'flipOrRotate', value);                     
        }
    });

    game.settings.register(MODULE_ID, 'facing-direction', {
        name: "about-face.options.facing-direction.name",
        hint: "about-face.options.facing-direction.hint",
        scope: "world",
        config: true,
        default: "right",
        type: String,
        choices: {
            "right": "about-face.options.facing-direction.choices.right",
            "left": "about-face.options.facing-direction.choices.left"            
        },
        onChange: (value) => { 
            if (!canvas.scene) return;
            if (isFirstActiveGM()) canvas.scene.setFlag(MODULE_ID, 'facingDirection', value);                     
        }
    });
});


/* -------------------------------------------- */

export class AboutFace {

    static initialize() {
        AboutFace.sceneEnabled = true;
        AboutFace.tokenIndicators = {};        
        AboutFace.flipOrRotate;

        AboutFace.facingOptions = {
            'rotate': {},
            'flip-h': { 
                'right':'about-face.options.facing-direction.choices.right', 
                'left':'about-face.options.facing-direction.choices.left'
            },
            'flip-v': {
                'down':'about-face.options.facing-direction.choices.down',
                'up':'about-face.options.facing-direction.choices.up',
            }
        }
    }
    
    static async canvasReadyHandler() {
        log(LogLevel.INFO, 'canvasReadyHandler');        

        // get game settings      
        AboutFace.sceneEnabled = canvas.scene.getFlag(MODULE_ID, 'sceneEnabled') != null 
            ? canvas.scene.getFlag(MODULE_ID, 'sceneEnabled') 
            : true;
        AboutFace.spriteType = canvas.scene.getFlag(MODULE_ID, 'spriteType') != null 
            ? canvas.scene.getFlag(MODULE_ID, 'spriteType') 
            : 0;
        AboutFace.flipOrRotate = canvas.scene.getFlag(MODULE_ID, 'flipOrRotate') != null 
            ? canvas.scene.getFlag(MODULE_ID, 'flipOrRotate') 
            : 'rotate';
        AboutFace.facingDirection = canvas.scene.getFlag(MODULE_ID, 'facingDirection') != null 
            ? canvas.scene.getFlag(MODULE_ID, 'facingDirection') 
            : 'right';

        // sync settings from scene.flags to game.settings
        if (isFirstActiveGM()) {            
            await game.settings.set(MODULE_ID, 'scene-enabled', AboutFace.sceneEnabled);            
            await game.settings.set(MODULE_ID, 'sprite-type', AboutFace.spriteType); 
            await game.settings.set(MODULE_ID, 'flip-or-rotate', AboutFace.flipOrRotate); 
            await game.settings.set(MODULE_ID, 'facing-direction', AboutFace.facingDirection); 

            // render the SettingsConfig if it is currently open to update changes
            Object.values(ui.windows).forEach(app => {
                if (app instanceof SettingsConfig) app.render();
            });
        }

        // empty and possibly refill tokenIndicators
        AboutFace.tokenIndicators = {};
        if (AboutFace.sceneEnabled) {
            for (let [i, token] of canvas.tokens.placeables.entries()) {
                if (!(token instanceof Token) || !token.actor) {
                    continue;
                }
                log(LogLevel.INFO, 'creating TokenIndicator for:', token.name);
                AboutFace.tokenIndicators[token.id] = await new TokenIndicator(token).create(canvas.scene);
            }
        }  
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
        if (!AboutFace.sceneEnabled || !isAboutFaceUpdate()) return;
        token = (token instanceof Token) ? token : canvas.tokens.get(token._id);
        log(LogLevel.DEBUG, 'updateTokenHandler', token.name);

        if (!AboutFace.tokenIndicators[token.id]) {
            log(LogLevel.ERROR, 'updateTokenHandler cant find tokenIndicator in pool!');
            return;
        }

        // update indicator state
        if (updateData.flags != null && updateData.flags[MODULE_ID]?.indicatorDisabled != null) {
            if (updateData.flags[MODULE_ID].indicatorDisabled) AboutFace.tokenIndicators[token.id].hide();
            else if (game.settings.get(MODULE_ID, 'indicator-state') === IndicatorMode.ALWAYS) AboutFace.tokenIndicators[token.id].show();
        }

        // update facingDirection
        if (updateData.flags != null && updateData.flags[MODULE_ID]?.facingDirection != null){
            if (AboutFace.tokenIndicators[token.id].token.sprite == null
                || AboutFace.tokenIndicators[token.id].token.sprite.transform == null)
                log(LogLevel.WARN, 'updateTokenHandler: tokenIndicator missing sprite.transform!');
            else
                AboutFace.tokenIndicators[token.id].rotate();        
        }            

        // update flip or rotate
        if (updateData.flags != null && updateData.flags[MODULE_ID]?.flipOrRotate != null) {
            if (updateData.flags[MODULE_ID].flipOrRotate === 'flip-h') await token.update({mirrorY:false});
            if (updateData.flags[MODULE_ID].flipOrRotate === 'flip-v') await token.update({mirrorX:false});        
        }

        // update direction
        if (updateData.flags != null && updateData.flags[MODULE_ID]?.direction != null)
            AboutFace.tokenIndicators[token.id].rotate(updateData.flags[MODULE_ID]?.direction);

        // the GM will observe all movement of tokens and set the direction flag
        if (isFirstActiveGM() && (updateData.x != null || updateData.y != null || updateData.rotation != null)) {
            let direction;
            // if it's a rotation update then set the flag on the relevant token
            if (updateData.rotation != null) direction = updateData.rotation;
            else {
                // else check for movement
                const lastPos = new PIXI.Point(AboutFace.tokenIndicators[token.id].token.x, AboutFace.tokenIndicators[token.id].token.y);
                // calculate new position data
                let dX = (updateData.x != null) ? updateData.x - lastPos.x : 0; // new X
                let dY = (updateData.y != null) ? updateData.y - lastPos.y : 0; // new Y
                if (dX === 0 && dY === 0) return;
                direction = getRotationDegrees(dX, dY, "", scene.data.gridType >= 4); 
            }
            
            return await AboutFace.setTokenFlag(token, 'direction', direction);              
        }
    }

    static async setTokenFlag(token, flag, value) {
        if (token.data.flags != null && token.data.flags['multilevel-tokens']?.stoken != null) {
            return await token.update({[`flags.${MODULE_ID}.${flag}`]: value}, { 'mlt_bypass': true });
        }
        else return await token.setFlag(MODULE_ID, flag, value);
    }

    static hoverTokenHandler(token, isHovering) {
        if (!AboutFace.sceneEnabled || game.settings.get(MODULE_ID, 'indicator-state') !== IndicatorMode.HOVER) return;        
        token = (token instanceof Token) ? token : canvas.tokens.get(token._id);
        log(LogLevel.DEBUG, 'hoverTokenHandler', token.name);

        // todo: why would we want this?
        // if (!token.owner) return;

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
    static async updateSceneHandler(scene, updateData) {
        if (updateData.flags == null || updateData.flags[MODULE_ID] == null) return;
        log(LogLevel.DEBUG, 'updateSceneHandler', scene);

        for (const [setting, value] of Object.entries(updateData.flags[MODULE_ID])) {
            AboutFace[setting] = value;
        }

        if (isFirstActiveGM()) {
            if (updateData.flags[MODULE_ID].flipOrRotate != null) {
                AboutFace.flipOrRotate = updateData.flags[MODULE_ID].flipOrRotate;
                const lockRotation = (AboutFace.flipOrRotate !== 'rotate');
                const updates = Object.keys(AboutFace.tokenIndicators).map(id => {
                    return {_id:id, lockRotation:lockRotation};
                });
                canvas.tokens.updateMany(updates);
            }
            
            if (updateData.flags[MODULE_ID].spriteType != null) {
                // we need to update the existing tokenIndicators with the new sprite type.            
                for (const [key, indicator] of Object.entries(AboutFace.tokenIndicators)) {
                    let token = canvas.tokens.get(key);
                    log(LogLevel.INFO, 'updateSceneHandler, updating TokenIndicator for:', token.name); 
                    indicator.wipe();       
                    AboutFace.deleteTokenHandler(canvas.scene, token);
                    await AboutFace.createTokenHandler(canvas.scene, token);                            
                }
            }    
        }
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
        log(LogLevel.INFO, 'createTokenHandler, creating TokenIndicator for:', token.name);        
        AboutFace.tokenIndicators[token.id] = await new TokenIndicator(token).create(scene);
    }
    
    static deleteTokenHandler(scene, token) {       
        log(LogLevel.INFO, 'deleteTokenHandler:', token._id); 
        delete AboutFace.tokenIndicators[token._id];
    }

    /**
   * Handler called when token configuration window is opened. Injects custom form html and deals
   * with updating token.
   * @category GMOnly
   * @function
   * @async
   * @param {TokenConfig} tokenConfig
   * @param {JQuery} html
   */
  static async renderTokenConfigHandler(tokenConfig, html) {
    log(LogLevel.INFO, 'renderTokenConfig');
    
    const posTab = html.find('.tab[data-tab="position"]');


    const flipOrRotate = tokenConfig.object.getFlag(MODULE_ID, 'flipOrRotate') || AboutFace.flipOrRotate;
    let data = {
        indicatorDisabled: tokenConfig.object.getFlag(MODULE_ID, 'indicatorDisabled') ? 'checked' : '',
        flipOrRotates: game.settings.settings.get('about-face.flip-or-rotate').choices,
        flipOrRotate: flipOrRotate,
        facingDirections: AboutFace.facingOptions[flipOrRotate],
        facingDirection: tokenConfig.object.getFlag(MODULE_ID, 'facingDirection'),
    };

    const insertHTML = await renderTemplate('modules/' + MODULE_ID + '/templates/token-config.html', data);
    posTab.append(insertHTML);

    const selectFlipOrRotate = posTab.find('.token-config-select-flip-or-rotate');
    const selectFacingDirection = posTab.find('.token-config-select-facing-direction');
    const lockRotateCheckbox = document.getElementsByName("lockRotation")[0];

    selectFlipOrRotate.on('change', (event) => {
        const facingDirections = AboutFace.facingOptions[event.target.value];
        replaceSelectChoices(selectFacingDirection, facingDirections);
        lockRotateCheckbox.checked = event.target.value !== 'rotate';
    });
    //tokenConfig.setPosition({ height: 'auto' });
  }

      /**
   * Handler called when token configuration window is opened. Injects custom form html and deals
   * with updating token.
   * @category GMOnly
   * @function
   * @async
   * @param {TokenConfig} tokenConfig
   * @param {JQuery} html
   */
  static async renderSettingsConfigHandler(tokenConfig, html) {    

    // we need to disable the hex option if we are not on a hex scene
    if (canvas.scene && canvas.scene.data.gridType < 4) {
        const indicatorIconSelect = html.find('select[name="about-face.sprite-type"]');    
        indicatorIconSelect.find('option').each(function() {
            if($(this).val() == "2") {
                $(this).attr("disabled", "disabled");
            }
        });
    }

    const flipOrRotateSelect = html.find('select[name="about-face.flip-or-rotate"]');
    const flipDirectionSelect = html.find('select[name="about-face.facing-direction"]');
    replaceSelectChoices(flipDirectionSelect, AboutFace.facingOptions[AboutFace.flipOrRotate]);  
    
    flipOrRotateSelect.on('change', (event) => {
        const facingDirections = AboutFace.facingOptions[event.target.value];
        replaceSelectChoices(flipDirectionSelect, facingDirections);    
    });
  }
}

Hooks.on("createToken", AboutFace.createTokenHandler);
Hooks.on("deleteToken", AboutFace.deleteTokenHandler);
Hooks.on("canvasReady", AboutFace.canvasReadyHandler);
Hooks.on("hoverToken", AboutFace.hoverTokenHandler);
Hooks.on("updateToken",  AboutFace.updateTokenHandler);
Hooks.on("updateScene",  AboutFace.updateSceneHandler);
Hooks.on('renderTokenConfig', AboutFace.renderTokenConfigHandler);
Hooks.on('renderSettingsConfig', AboutFace.renderSettingsConfigHandler);
 