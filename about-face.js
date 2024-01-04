/**
 * About Face -- A Token Rotator
 * Rotates tokens based on the direction the token is moved
 *
 * by Eadorin, edzillion
 * 
 * Edited by Somedude5 to add more targeting functionality 1/3/2023
 */

import { AboutFace, drawAboutFaceIndicator, onPreCreateToken, onPreUpdateToken } from "./scripts/logic.js";
import {
	MODULE_ID,
	asyncRenderSceneConfigHandler,
	highlightObjects,
	registerSettings,
	renderSceneConfigHandler,
	renderSettingsConfigHandler,
	renderTokenConfigHandler,
	tokenHover,
} from "./scripts/settings.js";

Hooks.once("init", () => {
	registerSettings();
	game.aboutFace = new AboutFace();
	if (game.settings.get("about-face", "indicator-state") === 1) {
		Hooks.on("hoverToken", tokenHover);
		Hooks.on("highlightObjects", highlightObjects);
	}
	game.keybindings.register(MODULE_ID, "toggleTokenRotation", {
		name: "about-face.keybindings.toggleTokenRotation.name",
		hint: "about-face.keybindings.toggleTokenRotation.hint",
		onDown: () => {
			game.aboutFace.tokenRotation = !game.aboutFace.tokenRotation;
			ui.notifications.info(
				"About Face: " +
					game.i18n.localize(
						`about-face.keybindings.toggleTokenRotation.tooltip.${game.aboutFace.tokenRotation}`
					),
				{
					console: false,
				}
			);
		},
		restricted: false,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
	game.keybindings.register(MODULE_ID, "lockRotation", {
		name: "about-face.keybindings.lockRotation.name",
		hint: "about-face.keybindings.lockRotation.hint",
		onDown: () => {
			for (let token of canvas.tokens.controlled) {
				var lockRotation = !token.document.lockRotation;
				token.document.update({ lockRotation: lockRotation });
			}
			ui.notifications.info(
				"About Face: " + game.i18n.localize(`about-face.keybindings.lockRotation.tooltip.${lockRotation}`),
				{ console: false }
			);
		},
		restricted: true,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
});
Hooks.on("canvasReady", async () => {
	if (canvas.scene?.flags?.[MODULE_ID] == null) await canvas.scene.setFlag(MODULE_ID, "sceneEnabled", true);
	if (canvas.scene?.flags?.[MODULE_ID].sceneEnabled) {
		canvas.scene.tokens.forEach((tokenDocument) => drawAboutFaceIndicator(tokenDocument.object));
	}
});
Hooks.on("preCreateToken", onPreCreateToken);
Hooks.on("preUpdateToken", onPreUpdateToken);
Hooks.on("createToken", (tokenDocument, options, userId) => drawAboutFaceIndicator(tokenDocument.object));
Hooks.on("updateToken", (tokenDocument, changes, options, userId) => drawAboutFaceIndicator(tokenDocument.object));
Hooks.on("renderSceneConfig", renderSceneConfigHandler);
Hooks.on("renderSceneConfig", asyncRenderSceneConfigHandler);
Hooks.on("renderTokenConfig", renderTokenConfigHandler);
Hooks.on("renderSettingsConfig", renderSettingsConfigHandler);



// Main function which gets the users cursor coordinates and updates the selected tokens "direction" arrow points it at those coordinates.
function targetAndRotateToCursor() {
	// test logs for PIXI stuff
    // console.log(canvas);
    // console.log(canvas.app);
    // console.log(canvas.app.renderer);
    // console.log(canvas.app.renderer.plugins);
    // console.log(canvas.app.renderer.plugins.interaction);
    // console.log(canvas.app.renderer.plugins.interaction.mouse);

	const globalMousePos = new PIXI.Point(canvas.app.renderer.plugins.interaction.rootPointerEvent.client.x, canvas.app.renderer.plugins.interaction.rootPointerEvent.client.y);    const localMousePos = canvas.app.stage.toLocal(globalMousePos);

    // Iterate over all controlled tokens, this is useful for changing a group direction.
    for (const sourceToken of canvas.tokens.controlled) {
        if (!sourceToken) continue;

        const sourceX = sourceToken.x + sourceToken.width / 2;
        const sourceY = sourceToken.y + sourceToken.height / 2;

        // Calculate the angle between the source token and the mouse cursor
        const angleDeg = calculateAngle(sourceX, sourceY, localMousePos.x, localMousePos.y);
        
        // Update the token's direction
        sourceToken.document.update({
            "flags.about-face.direction": angleDeg
        });
    }
}

// 'T' key event listener, this listens for when the T key is pressed and turns the token that direction, also works wih groups.
document.addEventListener("keydown", (event) => {
    if (event.code === "KeyT" && !event.altKey && !event.ctrlKey && !event.shiftKey && !event.metaKey) {
        targetAndRotateToCursor();
    }
});

// Allows the mousewheel to perform the same function as if you had pressed t, added this since you cant map keys to mouse inputs yet.
// the mousewheel targeting setting can be changed in the settings.
document.addEventListener("mousedown", (event) => {
	const mousewheelTargetingEnabled = game.settings.get(MODULE_ID, "use-mousewheel-targeting");
    if (event.button === 1) {  // Middle mouse button
        // Call the _onTarget method with the appropriate context
		if (mousewheelTargetingEnabled) {
			const context = {
				isShift: event.shiftKey
			};
			ClientKeybindings._onTarget(context);
			targetAndRotateToCursor();
		}
    }
});

// Function to calculate the angle in degrees between two points
function calculateAngle(x1, y1, x2, y2) {
    const angleRad = Math.atan2(y2 - y1, x2 - x1);
    return (angleRad * (180 / Math.PI) + 360) % 360;
}
