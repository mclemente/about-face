/**
 * About Face -- A Token Rotator
 * Rotates tokens based on the direction the token is moved
 *
 * by Eadorin, edzillion
 */

import { AboutFace, onPreCreateToken, onPreUpdateToken } from "./logic.js";
import {
	MODULE_ID,
	facingOptions,
	highlightObjects,
	registerSettings,
	renderSettingsConfigHandler,
	tokenHover,
} from "./settings.js";

function addTokenConfigTab(cls, document = "document") {
	// We need to make sure the About Face tab renders before the footer
	cls.TABS.sheet.tabs.push({ id: "aboutFace", label: "About Face", icon: "fas fa-caret-down fa-fw" });
	const footerPart = cls.PARTS.footer;
	delete cls.PARTS.footer;
	cls.PARTS.aboutFace = {
		template: "modules/about-face/templates/token-config.html"
	};
	cls.PARTS.footer = footerPart;

	const defaultRenderPartContext = cls.prototype._preparePartContext;
	cls.prototype._preparePartContext = async function (partId, context, options) {
		if (partId === "aboutFace") {
			const flipOrRotateSetting = game.settings.get(MODULE_ID, "flip-or-rotate");
			return {
				indicatorDisabled: this[document].getFlag(MODULE_ID, "indicatorDisabled"),
				flipOrRotate: this[document].getFlag(MODULE_ID, "flipOrRotate") || "global",
				facingDirection: this[document].getFlag(MODULE_ID, "facingDirection") || "global",
				rotationOffset: this[document].getFlag(MODULE_ID, "rotationOffset") || 0,
				flipOrRotates: {
					global: `${game.i18n.localize("about-face.options.flip-or-rotate.choices.global")} (${game.i18n.localize(
						`about-face.options.flip-or-rotate.choices.${flipOrRotateSetting}`
					)})`,
					...game.settings.settings.get("about-face.flip-or-rotate").choices,
				},
				facingDirections: {
					global: `${game.i18n.localize("about-face.options.flip-or-rotate.choices.global")} (${game.i18n.localize(
						`about-face.options.facing-direction.choices.${game.settings.get(MODULE_ID, "facing-direction")}`
					)})`,
					...facingOptions[flipOrRotateSetting],
				},
				tab: context.tabs[partId],
			};
		}

		return defaultRenderPartContext.call(this, partId, context, options);
	};
}

Hooks.once("init", () => {
	registerSettings();
	game.aboutFace = new AboutFace();

	addTokenConfigTab(TokenConfig);
	addTokenConfigTab(foundry.applications.sheets.PrototypeTokenConfig, "actor");

	SceneConfig.TABS.sheet.tabs.push({ id: "aboutFace", label: "About Face", icon: "fas fa-caret-down fa-fw" });
	const footerPart = SceneConfig.PARTS.footer;
	delete SceneConfig.PARTS.footer;
	SceneConfig.PARTS.aboutFace = {
		template: "modules/about-face/templates/scene-settings.hbs"
	};
	SceneConfig.PARTS.footer = footerPart;

	SceneConfig.DEFAULT_OPTIONS.actions.aboutFaceApply = (event, currentTarget) => {
		const target = currentTarget.dataset.target;
		const checked = currentTarget.parentElement.querySelector("input").checked;
		const updates = [];
		switch (target) {
			case "lockRotation": {
				canvas.scene.tokens.forEach((token) => {
					if (token.lockRotation !== checked) {
						updates.push({ _id: token.id, lockRotation: checked });
					}
				});
				break;
			}
			case "lockArrowRotation": {
				canvas.scene.tokens.forEach((token) => {
					if (token.getFlag("about-face", "lockArrowRotation") !== checked) {
						updates.push({ _id: token.id, flags: { "about-face": { lockArrowRotation: checked } } });
					}
				});
				break;
			}
			default:
				break;
		}
		canvas.scene.updateEmbeddedDocuments("Token", updates);
	};

	// Override part context to include the about face config data
	const defaultRenderPartContext = SceneConfig.prototype._preparePartContext;
	SceneConfig.prototype._preparePartContext = async function(partId, context, options) {
		if (partId === "aboutFace") {
			return {
				sceneEnabled: this.document.getFlag("about-face", "sceneEnabled") ?? true,
				lockRotation: this.document.getFlag("about-face", "lockRotation") ?? game.settings.get(MODULE_ID, "lockRotation"),
				lockArrowRotation: this.document.getFlag("about-face", "lockArrowRotation") ?? game.settings.get(MODULE_ID, "lockArrowRotation"),
				document: this.document,
				tab: context.tabs[partId],
			};
		}

		return defaultRenderPartContext.call(this, partId, context, options);
	};

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
Hooks.on("renderSettingsConfig", renderSettingsConfigHandler);
