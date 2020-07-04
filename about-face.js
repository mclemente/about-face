/**
 * About Face -- A Token Rotator
 *      Rotates tokens based on the direction the token is moved
 * 
 * version 1.0                  by Eadorin
 */
const mod = 'about-face';
const modDisplayName = "About Face"
import { TokenIndicator } from './src/token-indicator.js';


// CONFIG.debug.hooks=true;

// ---- a few var inits ----
var TokenIndicators = []; // an array to hold all of the TokenIndicator instances
var useIndicator, enableRotation; // convenience
var token_rotation = 0;

/* -------------------------------------------- */

Hooks.once("init", () => {
    game.settings.register(mod,'enable-rotation',{
        name: "about-face.options.enable-rotation.name",
        hint: "about-face.options.enable-rotation.hint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register(mod,'use-indicator', {
        name: "about-face.options.enable-indicator.name",
        hint: "about-face.options.enable-indicator.hint",
        scope: "world",
        config: true,
        default: "2",
        type: String,
        choices: {
            "0" : "about-face.options.indicator.choices.0",
            "1" : "about-face.options.indicator.choices.1",
            "2" : "about-face.options.indicator.choices.2"
        }
    });
    game.settings.register(mod,'indicator-sprite', {
        name: "about-face.options.indicator-sprite.name",
        hint: "about-face.options.indicator-sprite.hint",
        scope: "world",
        config: true,
        default: "normal",
        type: String,
        choices: {
            "normal" : "about-face.options.indicator-sprite.choices.normal",
            "large-triangle" : "about-face.options.indicator-sprite.choices.large",
        }
    });

    game.settings.register(mod,'flip-or-rotate', {
        name: "about-face.options.flip-or-rotate.name",
        hint: "about-face.options.flip-or-rotate.hint",
        scope: "world",
        config: true,
        default: "rotate",
        type: String,
        choices: {
            "rotate" : "about-face.options.flip-or-rotate.choices.rotate",
            "flip-v" : "about-face.options.flip-or-rotate.choices.flip-v",
            "flip-h" : "about-face.options.flip-or-rotate.choices.flip-h"
        }
    });

    // convenience
    AboutFace.refreshSettings();
    
});


/* -------------------------------------------- */

export class AboutFace
{
    static async ready() {
        
        TokenIndicators = [];
        for ( let [i, token] of canvas.tokens.placeables.entries()){
            if (!(token instanceof Token) || !token.actor) { continue; }
            //if (token.owner) {
                // if (token.actor.isPC && game.user.isGM) {
                //     continue;
                // }
                
                let ti = await TokenIndicator.init(token);

                ti.create(game.settings.get(mod,"indicator-sprite"));
                if (!useIndicator || useIndicator == "1") {
                    ti.hide();
                }
                TokenIndicators.push(ti);

            //}
        }
    }

    /* -------------------------------------------- */


    /**
     * Rotation function primarily used by our key event handlers
     */
    static rotate(direction) {

        if (!useIndicator) { return }
        let tokenIndicators = [];

        activeTokens.forEach(token => {

            tokenIndicators.push((TokenIndicators.filter(ti => ti.token.id == token.id))[0]);
            if (token.data.flags.AboutFace) {
                token.data.flags.AboutFace.set('facing',AboutFace.getRotationDegrees(direction));
                //token.update({data:token.data});
            }
            
        });

        tokenIndicators.forEach( ti => {
            let dir = AboutFace.getRotationDegrees(null, null, direction);
            if (!ti) return; // addresses a weird issue where a token might be removed.

  
            
            token_rotation = ti.rotate(dir);
            
            ti.token.update({rotate:token_rotation});
        });
    }

    /* -------------------------------------------- */
    /**
     * returns the degrees to rotate a token
     * @param {int} dX     the value of x2 - x1
     * @param {int} dY     the value of y2 - y1
     * @return int
    **/
    static getRotationDegrees(dX=null, dY=null, dir=null)
    {
        var rotation = 0;
        if ( (dX == 0 && dY < 0)||dir=="up" ) rotation = 180; // up
        else if ((dX == 0 && dY > 0)||dir=="down") rotation = 0; // down
        else if ((dX > 0 && dY == 0)||dir=="right") rotation = 270; // to the right
        else if ((dX > 0 && dY < 0)||dir=="up-right") rotation = 225; // up to the right
        else if ((dX > 0 && dY > 0)||dir=="down-right") rotation = 315; // down to the right
        else if ((dX < 0 && dY == 0)||dir=="left") rotation = 90; // to the left
        else if ((dX < 0 && dY > 0)||dir=="down-left") rotation = 45; // down to the left
        else if ((dX < 0 && dY < 0)||dir=="up-left") rotation = 135 // up to the left
        token_rotation = rotation;
    
        // i messed with every version of atan, atan2 I could come up with; inverted Y makes it tough
        return rotation;
    
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
    static async updateTokenEventHandler(scene,token,updateData,options,userId) {


        if (options.lockRotation) {
            // the token should not rotate!
        }
        if (typeof token === 'undefined') return;

        // the client doesn't get the update during the controlToken handler
        if  (!("AboutFace" in token.flags)) {
            token.flags.AboutFace = new Map();
            token.flags.AboutFace.set('x',token.x);
            token.flags.AboutFace.set('y',token.y);
            token.flags.AboutFace.set('facing',token_rotation);
        }
    
        // current rotation
        let facing = token.flags.AboutFace.get('facing');
        
        // calculate new rotation

   
        let rotationValue = (updateData.rotation) ? updateData.rotation : AboutFace.getRotationDegrees( token.x - token.flags.AboutFace.get('x'), token.y - token.flags.AboutFace.get('y'));

        // update our recorded position
        token.flags.AboutFace.set('x',token.x);
        token.flags.AboutFace.set('y',token.y);
        
        // exit if new direction is same as old
        if (rotationValue == facing) return;
    
        // update direction here, preventing rotate() from triggering stack issue
        token.flags.AboutFace.set('facing',rotationValue);

        // don't rotate because of user setting
        if (!enableRotation && !useIndicator) return;

        let t = canvas.tokens.get(token._id);

        // show indicators based on appearance
        if (useIndicator) {
            if (typeof rotationValue === "undefined" || rotationValue == null) { return;}
            let ti = (TokenIndicators.filter(ti => ti.token.id == token._id))[0];
            ti.show();
            try {
                ti.rotate(rotationValue);
            } catch (e) {
                console.log('sprite not set for some reason..still creating it?');
            }
            if (useIndicator == "1") { ti.hide();}

        }

        // enable ability to flip the token
        if (game.settings.get(mod,'flip-or-rotate') !== "rotate") {
            if (game.settings.get(mod,'flip-or-rotate') == "flip-v") {
                if (rotationValue == 0) {
                    t.scale.y = 1;
                    t.pivot.y = t.height;
                } else if (rotationValue == 180) {
                    t.scale.y=-1;
                    t.pivot.y= -(t.height);
                }

            } else {
                if (rotationValue == 90) {
                    t.scale.x=-1;
                    t.pivot.x=-(t.width);
                } else if (rotationValue == 270) {
                    t.scale.x=1;
                    t.pivot.x=t.width;
                }
            }
            t.update({rotation:0});
            return;
        }
        
        // sets z-Indexes for custom..need to move this out of update() and into ready();
        if (useIndicator) {
            t.sortableChildren = true;
            t.indicator.zIndex = 1;
            t.target.zIndex = 5;
            t.icon.zIndex = 10;
        }

        if (!enableRotation) return;
        
        t.data.rotation = rotationValue;
        t.rotate({angle:rotationValue,snap:45});
        t.refresh();
        t.update({rotation:rotationValue});
    }

    static hoverTokenEventHandler(token,opt) {

        // if (game.user.id != token.owner) { 
        //     return;
        // };

        if (useIndicator && opt) {
            
            if (!token.indicator) { return;}
            // show the indicator
            console.log("Indicator",token.indicator);
            token.indicator.show();
            //token.flags.AboutFace.set('show',true);
        } else {
            if (useIndicator != "2"){
                token.indicator.hide();
                
            }
        }
    }

    static showAllIndicators() {
        if (canvas == null ) { return;}
        for ( let [i, token] of canvas.tokens.placeables.entries()){
            if (!(token instanceof Token)) { continue; }
            if (token.owner) { token.indicator.show(); }
            token.indicator.show();
        }
    }
    
    static hideAllIndicators() {
        if (canvas == null ) { return;}
        for ( let [i, token] of canvas.tokens.placeables.entries()){
            if (!(token instanceof Token)) { continue; }
            if (token.owner) { token.indicator.hide(); }
        }
    }


    static controlTokenEventHandler(token, opt) {
        if (opt) {
            activeTokens.push(token);
        } else { 
            const index = activeTokens.indexOf(token);
            if ( index > -1) { activeTokens.splice(index,1);}
        }
    }

    static closeSettingsConfigEventHandler(settingsConfig, obj){
        AboutFace.refreshSettings();
    }

    static refreshSettings() {
        enableRotation = game.settings.get(mod,"enable-rotation");
        useIndicator = game.settings.get(mod,"use-indicator");
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
        console.log(useIndicator);
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
        if ( (map[87] && map[65]) || (map[38] && map[37]) ) {
            AboutFace.rotate('up-left');
        } else if ( (map[87] && map[68]) || (map[38] && map[39]) ) {
            AboutFace.rotate('up-right');
        } else if ( (map[83] && map[65]) || (map[40] && map[37]) ) {
            AboutFace.rotate('down-left');
        } else if ( (map[83] && map[68]) || (map[40] && map[39]) ) {
            AboutFace.rotate('down-right');
        }
        
    }
}



Hooks.on("canvasReady",AboutFace.ready);
//Hooks.on("ready",AboutFace.ready);
// Hooks.on("updateScene",AboutFace.ready);
Hooks.on("updateToken",AboutFace.updateTokenEventHandler);
Hooks.on("controlToken",AboutFace.controlTokenEventHandler);

Hooks.on("hoverToken",AboutFace.hoverTokenEventHandler);
Hooks.on("ready",() => {
    Hooks.on("closeSettingsConfig",AboutFace.closeSettingsConfigEventHandler);
})

