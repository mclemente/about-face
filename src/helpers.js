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

export async function getTokenByTokenID(id) {
    return canvas.tokens.placeables.find( x => {return x.id === id});
}
export async function getTokenByTokenName(name) {
    // return game.scenes.active.data.tokens.find( x => {return x._name === name});
    return canvas.tokens.placeables.find( x => { return x.id == id});
}


export function getInput(prompt) {
    return new Promise(resolve => {
        new Dialog({
            title: prompt,
            content: '<div align="center"><input id="dialog_box" style="width:375px"></input></div>',
            buttons: {
                ok: {
                    label: "OK",
                    callback: () => {
                        resolve(document.getElementById("dialog_box").value)
                    }
                }
            },
            default:"ok"
        }).render(true);
    });
}
