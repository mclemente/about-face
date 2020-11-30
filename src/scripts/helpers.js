/**
 * Some utility functions
 * v0.3
 */
export function getKeyByValue(object, value) {
    return Object.keys(object).filter(key => object[key] === value);
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
 * returns the degrees to rotate a token
 * @param {int} dX     the value of x2 - x1
 * @param {int} dY     the value of y2 - y1
 * @return int
 **/
export function getRotationDegrees(dX = null, dY = null, dir = null) {
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