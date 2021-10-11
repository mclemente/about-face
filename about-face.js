/**
 * About Face -- A Token Rotator
 * Rotates tokens based on the direction the token is moved
 *
 * by Eadorin, edzillion
 */

import { drawAboutFaceIndicator, onCanvasReady, onPreCreateToken, onPreUpdateToken, updateSettings } from "./scripts/logic.js";
import { MODULE_ID, registerSettings, renderSettingsConfigHandler, renderTokenConfigHandler } from "./scripts/settings.js";
import { renderSceneConfig, closeSceneConfig } from "./scripts/sceneConfig.js";

Hooks.once("init", () => {
	libWrapper.register(MODULE_ID, "Token.prototype.refresh", drawAboutFaceIndicator);
	registerSettings();
	updateSettings();
});
Hooks.on("preCreateToken", onPreCreateToken);
Hooks.on("preUpdateToken", onPreUpdateToken);

// Hooks.on("createToken", AboutFace.createTokenHandler);
// Hooks.on("deleteToken", AboutFace.deleteTokenHandler);
Hooks.on("canvasReady", onCanvasReady);
Hooks.on("renderSceneConfig", (app, html) => {
	renderSceneConfig(app, html);
});
Hooks.on("closeSceneConfig", (app, html) => {
	closeSceneConfig(app, html);
});
// Hooks.on("updateToken", AboutFace.updateTokenHandler);
// Hooks.on("updateScene", AboutFace.updateSceneHandler);
Hooks.on("renderTokenConfig", renderTokenConfigHandler);
Hooks.on("renderSettingsConfig", renderSettingsConfigHandler);
