/*** Utility Stuff, will be hoisted ***/
export function getKeyByValue(object, value) {
    return Object.keys(object).filter(key => object[key] === value);
}

export function getTokenOwner(token, includeGM=false) {
    let owners = getKeyByValue(token.actor.data.permission,3);
    let ret = [];
    for (let y = 0; y < owners.length; y++) {
        let u = Users.instance.get(owners[y]);
        if (includeGM) {
            ret.push(u);
            continue;
        } else {
            if (!u.isGM) { ret.push(u);}
        }
    }
    return ret;

}