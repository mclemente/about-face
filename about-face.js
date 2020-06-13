/**
 * About Face -- A Token Rotator
 *      Rotates tokens based on the direction the token is moved
 * 
 * version 1.0                  by Eadorin
 */
const mod = 'about-face';
class AboutFace
{

    static ready() {
        
        game.settings.register(mod,'enable',{
            name: "About Face",
            hint: "Rotate token directions when moving them",
            scope: "world",
            config: true,
            default: true,
            type: Boolean
        });
    }


    /**
     * returns the degrees to rotate a token
     * @param {int} dX     the value of x2 - x1
     * @param {int} dY     the value of y2 - y1
     * @return int
    **/
    static getRotationDegrees(dX, dY)
    {
        var rotation = 0;
        if (dX == 0 && dY < 0) rotation = 180; // up
        else if (dX == 0 && dY > 0) rotation = 0; // down
        else if (dX > 0 && dY == 0) rotation = 270; // to the right
        else if (dX > 0 && dY < 0) rotation = 225; // up to the right
        else if (dX > 0 && dY > 0) rotation = 315; // down to the right
        else if (dX < 0 && dY == 0) rotation = 90; // to the left
        else if (dX < 0 && dY > 0) rotation = 45; // down to the left
        else if (dX < 0 && dY < 0) rotation = 135 // up to the left
    
        // i messed with every version of atan, atan2 I could come up with; inverted Y makes it tough
        return rotation;
    
    }


    /**
     * Gets the new rotational value and rotates the token
     * @param {Scene} scene         - the current scene
     * @param {object} token        - data of the clicked token
     * @param {object} updateData   - the data that was actually updated by the move
     * @param {*} options 
     * @param {*} userId 
     */
    static updateTokenEventHandler(scene,token,updateData,options,userId) {

        if (typeof token === 'undefined') return;

        // the client doesn't get the update during the controlToken handler
        if  (!("AboutFace" in token.flags)) {
            token.flags.AboutFace = new Map();
            token.flags.AboutFace.set('x',token.x);
            token.flags.AboutFace.set('y',token.y);
            token.flags.AboutFace.set('facing',0);
            
        }
    
        // current rotation
        let facing = token.flags.AboutFace.get('facing');
        
        // calculate new rotation
        let rotationValue = AboutFace.getRotationDegrees( token.x - token.flags.AboutFace.get('x'), token.y - token.flags.AboutFace.get('y'));
    
        // update our recorded position
        token.flags.AboutFace.set('x',token.x);
        token.flags.AboutFace.set('y',token.y);
        
        // exit if new direction is same as old
        if (rotationValue == facing) return;
    
        // update direction here, preventing rotate() from triggering stack issue
        token.flags.AboutFace.set('facing',rotationValue);

        // don't rotate because of user setting
        if (!game.settings.get(mod,"enable")) return;
    
        // rotate the token
        let t = canvas.tokens.get(token._id);
        t.data.rotation = rotationValue;
        t.rotate({angle:rotationValue,snap:45});
        t.refresh();
        t.update({rotation:rotationValue});
    }
}

Hooks.on("ready",AboutFace.ready);
Hooks.on("updateToken",AboutFace.updateTokenEventHandler);




