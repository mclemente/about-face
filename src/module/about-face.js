/**
 * About Face -- A Token Rotator
 * Rotates tokens based on the direction the token is moved
 *
 * by Eadorin, edzillion
 */

import { AboutFace, onPreCreateToken, onPreUpdateToken } from "./logic.js";
import {
	MODULE_ID,
	asyncRenderSceneConfigHandler,
	highlightObjects,
	registerSettings,
	renderSceneConfigHandler,
	renderSettingsConfigHandler,
	renderTokenConfigHandler,
	tokenHover,
} from "./settings.js";

Hooks.once("init", () => {
	registerSettings();
	game.aboutFace = new AboutFace();
	if (game.settings.get(MODULE_ID, "indicator-state") === 1) {
		Hooks.on("hoverToken", tokenHover);
		Hooks.on("highlightObjects", highlightObjects);
	}
	game.keybindings.register(MODULE_ID, "toggleTokenRotation", {
		name: "about-face.keybindings.toggleTokenRotation.name",
		hint: "about-face.keybindings.toggleTokenRotation.hint",
		onDown: () => {
			game.aboutFace.tokenRotation = !game.aboutFace.tokenRotation;
			ui.notifications.info(
				`About Face: ${game.i18n.localize(
					`about-face.keybindings.toggleTokenRotation.tooltip.${game.aboutFace.tokenRotation}`
				)}`,
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
			let lockRotation;
			for (let token of canvas.tokens.controlled) {
				lockRotation = !token.document.lockRotation;
				token.document.update({ lockRotation: lockRotation });
			}
			if (lockRotation !== undefined) {
				ui.notifications.info(
					`About Face: ${game.i18n.localize(`about-face.keybindings.lockRotation.tooltip.${lockRotation}`)}`,
					{ console: false }
				);
			}
		},
		restricted: true,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
});
Hooks.on("canvasReady", async () => {
	if (canvas.scene?.flags?.[MODULE_ID] == null) await canvas.scene.setFlag(MODULE_ID, "sceneEnabled", true);
	if (canvas.scene?.flags?.[MODULE_ID].sceneEnabled) {
		canvas.scene.tokens.forEach((tokenDocument) => game.aboutFace.drawAboutFaceIndicator(tokenDocument.object));
	}
});
Hooks.on("preCreateToken", onPreCreateToken);
Hooks.on("preUpdateToken", onPreUpdateToken);
Hooks.on("createToken", (tokenDocument, options, userId) => {
	if (tokenDocument.object) game.aboutFace.drawAboutFaceIndicator(tokenDocument.object);
});
Hooks.on("updateToken", (tokenDocument, changes, options, userId) => {
	if (tokenDocument.object) game.aboutFace.drawAboutFaceIndicator(tokenDocument.object);
});
Hooks.on("refreshToken", (token, options) => {
	if (options.redrawEffects) game.aboutFace.drawAboutFaceIndicator(token);
});
Hooks.on("renderSceneConfig", renderSceneConfigHandler);
Hooks.on("renderSceneConfig", asyncRenderSceneConfigHandler);
Hooks.on("renderTokenConfig", renderTokenConfigHandler);
Hooks.on("renderSettingsConfig", renderSettingsConfigHandler);
