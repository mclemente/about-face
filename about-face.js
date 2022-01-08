/**
 * About Face -- A Token Rotator
 * Rotates tokens based on the direction the token is moved
 *
 * by Eadorin, edzillion
 */

import { injectConfig } from "./scripts/injectConfig.js";
import { drawAboutFaceIndicator, onCanvasReady, onPreCreateToken, onPreUpdateToken, updateSettings } from "./scripts/logic.js";
import { MODULE_ID, registerSettings, renderSettingsConfigHandler, renderTokenConfigHandler } from "./scripts/settings.js";

Hooks.once("init", () => {
	libWrapper.register(MODULE_ID, "Token.prototype.refresh", drawAboutFaceIndicator);
	registerSettings();
	updateSettings();
});
Hooks.on("preCreateToken", onPreCreateToken);
Hooks.on("preUpdateToken", onPreUpdateToken);

Hooks.on("canvasReady", onCanvasReady);
Hooks.on("renderSceneConfig", (app, html) => {
	const data = {
		moduleId: "about-face",
		tab: {
			name: "about-face",
			label: "About Face",
			icon: "fas fa-caret-down fa-fw",
		},
		sceneEnabled: {
			type: "checkbox",
			label: game.i18n.localize("about-face.sceneConfig.scene-enabled.name"),
			notes: game.i18n.localize("about-face.sceneConfig.scene-enabled.hint"),
			default: app.object.data?.flags?.[MODULE_ID]?.sceneEnabled ?? true,
		},
		lockRotation: {
			type: "checkbox",
			label: game.i18n.localize("about-face.options.lockRotation.name"),
			notes: game.i18n.localize("about-face.options.lockRotation.hint"),
			default: app.object.data?.flags?.[MODULE_ID]?.lockRotation ?? game.settings.get(MODULE_ID, "lockRotation"),
		},
		lockArrowRotation: {
			type: "checkbox",
			label: game.i18n.localize("about-face.options.lockArrowRotation.name"),
			notes: game.i18n.localize("about-face.options.lockArrowRotation.hint"),
			default: app.object.data?.flags?.[MODULE_ID]?.lockArrowRotation ?? game.settings.get(MODULE_ID, "lockArrowRotation"),
		},
	};
	injectConfig.inject(app, html, data, app.object);
});
Hooks.on("renderTokenConfig", renderTokenConfigHandler);
Hooks.on("renderSettingsConfig", renderSettingsConfigHandler);
