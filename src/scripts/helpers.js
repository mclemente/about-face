/**
 * Some utility functions
 * v0.3
 */
export function getKeyByValue(object, value) {
    return Object.keys(object).filter(key => object[key] === value);
}

export function replaceSelectChoices(select, choices) {
    select.empty();
    for (const [key, value] of Object.entries(choices)) {
        select.append($("<option></option>")
            .attr("value", key).text(game.i18n.localize(value)));
    }
}

export async function getTokenOwner(token, includeGM=false) {
    let owners = getKeyByValue(token.actor.data.permission,3);
    let ret = [];
    for (let y = 0; y < owners.length; y++) {
        let u = await Users.instance.get(owners[y]);
        if (includeGM) {
            ret.push(u);
            continue;
        } else {
            if (!u) { ret.push(u);continue;}
            if (!u.isGM) { ret.push(u);}
        }
    }
    return ret;
}

/**
 * Checks user to see if the current user is the first registered GM.
 * @category helpers
 * @function
 * @returns {Boolean} - whether the user is the first GM
 */
export const isFirstActiveGM = () => {
    const firstGm = game.users.find((u) => u.isGM && u.active);
    if (firstGm && game.user === firstGm) {
      return true;
    }
    return false;
  };
  

/**
 * Checks to see if this update is from About Face or not. Will return true for core updates. Only
 * foreign module flag updates should return false.
 * @category helpers
 * @function
 * @returns {Boolean} - whether this is a BnG update
 */
 export const isAboutFaceUpdate = (changes) => {
    const entries = Object.entries(changes);
    if (entries.length === 2 && entries[0][0] === 'flags' && entries[0][1][MODULE_ID] == null) return false;
    return true;
  };

/**
 * returns the degrees to rotate a token
 * added support when using hex columns
 * @param {int} dX     the value of x2 - x1
 * @param {int} dY     the value of y2 - y1
 * @return int
 **/
export function getRotationDegrees(dX = null, dY = null, dir = null, isHexColumn = false) {
    var rotation;
    let hexOffset = isHexColumn ? 15 : 0;
    
    if ((dX == 0 && dY < 0) || dir == "up") rotation = 180; // up
    else if ((dX == 0 && dY > 0) || dir == "down") rotation = 0; // down
    else if ((dX > 0 && dY == 0) || dir == "right") rotation = 270 - (hexOffset * 2); // to the right (hex columns can't go right/left)
    else if ((dX > 0 && dY < 0) || dir == "up-right") rotation = 225 + hexOffset; // up to the right  
    else if ((dX > 0 && dY > 0) || dir == "down-right") rotation = 315 - hexOffset; // down to the right   
    else if ((dX < 0 && dY == 0) || dir == "left") rotation = 90 - (hexOffset * 2); // to the left      
    else if ((dX < 0 && dY > 0) || dir == "down-left") rotation = 45 + hexOffset; // down to the left 
    else if ((dX < 0 && dY < 0) || dir == "up-left") rotation = 135 - hexOffset; // up to the left
    let token_rotation = rotation || 0;

    // i messed with every version of atan, atan2 I could come up with; inverted Y makes it tough
    return token_rotation;

}