/**
 * About Face -- A Token Rotator
 * Rotates tokens based on the direction the token is moved
 *
 * by Eadorin, edzillion
 */

import { injectConfig } from "./scripts/injectConfig.js";
import { drawAboutFaceIndicator, onCanvasReady, onPreCreateToken, onPreUpdateToken, updateSettings } from "./scripts/logic.js";
import { MODULE_ID, registerSettings, renderSettingsConfigHandler, renderTokenConfigHandler } from "./scripts/settings.js";

export let toggleTokenRotation = false;

export function createDialog(data = {}) {
	for (let token of canvas.tokens.controlled) {
		var rotationOffset = token.actor.getFlag(MODULE_ID, "rotationOffset") || 0;
	}
	new Dialog(
		{
			title: "Rotation Offset",
			label: "create",
			buttons: {
				OK: {
					icon: '<i class="fas fa-check"></i>',
					label: game.i18n.localize("OK"),
					callback: (html) => {
						const rotationOffset = Number(html.find("#rotationOffset").val());
						for (let token of canvas.tokens.controlled) {
							token.actor.setFlag(MODULE_ID, "rotationOffset", rotationOffset);
						}
					},
				},
			},
			default: "OK",
			content: `<form>
						<div class="form-group">
							<label for="rotationOffset">Rotation Offset:</label>
							<input type="number" id="rotationOffset" name="rotationOffset" value="${rotationOffset}" min="-89" max="89" />
						</div>
					</form>`,
		},
		{ width: 200, height: 140 }
	).render(true);
}

Hooks.once("init", () => {
	libWrapper.register(MODULE_ID, "Token.prototype.refresh", drawAboutFaceIndicator);
	registerSettings();
	updateSettings();

	game.keybindings.register(MODULE_ID, "toggleTokenRotation", {
		name: "about-face.keybindings.toggleTokenRotation.name",
		hint: "about-face.keybindings.toggleTokenRotation.hint",
		onDown: () => {
			toggleTokenRotation = !toggleTokenRotation;
			ui.notifications.notify("About Face: " + game.i18n.localize(`about-face.keybindings.toggleTokenRotation.tooltip.${toggleTokenRotation}`));
		},
		restricted: false,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
	game.keybindings.register(MODULE_ID, "lockRotation", {
		name: "about-face.keybindings.lockRotation.name",
		hint: "about-face.keybindings.lockRotation.hint",
		onDown: () => {
			for (let token of canvas.tokens.controlled) {
				var lockRotation = token.data.lockRotation;
				token.document.update({ lockRotation: !lockRotation });
			}
		},
		restricted: false,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
	game.keybindings.register(MODULE_ID, "rotationOffset", {
		name: "about-face.keybindings.rotationOffset.name",
		hint: "about-face.keybindings.rotationOffset.hint",
		onDown: () => {
			createDialog();
		},
		restricted: false,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
});
Hooks.on("preCreateToken", onPreCreateToken);
Hooks.on("preUpdateToken", onPreUpdateToken);

Hooks.once("ready", () => {
	try {
		window.Ardittristan.ColorSetting.tester;
	} catch {
		ui.notifications.notify('Please make sure you have the "lib - ColorSettings" module installed and enabled.', "error");
	}
});
Hooks.on("canvasReady", onCanvasReady);
Hooks.on("renderSceneConfig", (app, html) => {
	const data = {
		moduleId: MODULE_ID,
		tab: {
			name: MODULE_ID,
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
			label: game.i18n.localize("about-face.sceneConfig.lockRotation.name"),
			notes: game.i18n.localize("about-face.sceneConfig.lockRotation.hint"),
			default: app.object.data?.flags?.[MODULE_ID]?.lockRotation ?? game.settings.get(MODULE_ID, "lockRotation"),
		},
		lockRotationButton: {
			type: "custom",
			html: `<button type="button" id="lockRotationButton">${game.i18n.localize("about-face.sceneConfig.apply")}</button>`,
		},
		lockArrowRotation: {
			type: "checkbox",
			label: game.i18n.localize("about-face.sceneConfig.lockArrowRotation.name"),
			notes: game.i18n.localize("about-face.sceneConfig.lockArrowRotation.hint"),
			default: app.object.data?.flags?.[MODULE_ID]?.lockArrowRotation ?? game.settings.get(MODULE_ID, "lockArrowRotation"),
		},
		lockArrowRotationButton: {
			type: "custom",
			html: `<button type="button" id="lockArrowRotationButton">${game.i18n.localize("about-face.sceneConfig.apply")}</button>`,
		},
	};
	injectConfig.inject(app, html, data, app.object);
});
Hooks.on("renderSceneConfig", async (app, html) => {
	const lockRotationButton = html.find("button[id='lockRotationButton']");
	lockRotationButton.on("click", () => {
		const lockRotationCheckbox = html.find('input[name="flags.about-face.lockRotation"]');
		const state = lockRotationCheckbox[0].checked;
		const updates = [];
		canvas.scene.tokens.forEach((token) => {
			console.log(token);
			if (token.data.lockRotation != state) {
				updates.push({
					_id: token.id,
					lockRotation: state,
				});
			}
		});
		canvas.scene.updateEmbeddedDocuments("Token", updates);
	});
	const lockArrowRotationButton = html.find("button[id='lockArrowRotationButton']");
	lockArrowRotationButton.on("click", () => {
		const lockArrowRotationCheckbox = html.find('input[name="flags.about-face.lockArrowRotation"]');
		const state = lockArrowRotationCheckbox[0].checked;
		const updates = [];
		canvas.scene.tokens.forEach((token) => {
			console.log(token);
			if ("token.data.flags.about-face.lockArrowRotation" != state) {
				updates.push({
					_id: token.id,
					flags: {
						"about-face": { lockArrowRotation: state },
					},
				});
			}
		});
		canvas.scene.updateEmbeddedDocuments("Token", updates);
	});
});
Hooks.on("renderTokenConfig", renderTokenConfigHandler);
Hooks.on("renderSettingsConfig", renderSettingsConfigHandler);
