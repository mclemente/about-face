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
	replaceSelectChoices,
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

	cls.prototype._prepareAboutfaceTab = async function (partId, context, options) {
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
				...game.settings.settings.get("about-face.flip-or-rotate").type.choices,
			},
			facingDirections: {
				global: `${game.i18n.localize("about-face.options.flip-or-rotate.choices.global")} (${game.i18n.localize(
					`about-face.options.facing-direction.choices.${game.settings.get(MODULE_ID, "facing-direction")}`
				)})`,
				...facingOptions[flipOrRotateSetting],
			}
		};
	};

	libWrapper.register("about-face", `foundry.applications.sheets.${cls.name}.prototype._onChangeForm`, function (wrapped, formConfig, event) {
		wrapped(formConfig, event);
		if (event.target.name === "flags.about-face.flipOrRotate") {
			const flipOrRotate = this.element.querySelector('[name="flags.about-face.flipOrRotate"]').value;
			const facingDirection = this.element.querySelector('[name="flags.about-face.facingDirection"]');
			const option = flipOrRotate === "global" ? game.settings.get(MODULE_ID, "flip-or-rotate") : flipOrRotate;
			const choices = {
				global: {},
				...facingOptions[option]
			};
			if (flipOrRotate === "global") {
				choices.global = `${game.i18n.localize("about-face.options.flip-or-rotate.choices.global")} (${game.i18n.localize(
					`about-face.options.facing-direction.choices.${game.settings.get(MODULE_ID, "facing-direction")}`
				)})`;
			} else delete choices.global;
			replaceSelectChoices(facingDirection, choices);
		}
	});
}

function updateCombat(combat, updateData) {
	if (!game.aboutFace.combatOnly) return;
	game.aboutFace.combatRunning = game.aboutFace.isCombatRunning();
	canvas.tokens?.placeables.forEach((token) => {
		game.aboutFace.drawAboutFaceIndicator(token);
	});
}

Hooks.once("init", () => {
	registerSettings();
	game.aboutFace = new AboutFace();

	addTokenConfigTab(foundry.applications.sheets.TokenConfig);
	addTokenConfigTab(foundry.applications.sheets.PrototypeTokenConfig, "actor");

	if (game.settings.get(MODULE_ID, "indicator-state") === 1) {
		Hooks.on("hoverToken", tokenHover);
		Hooks.on("highlightObjects", highlightObjects);
	}
});
Hooks.on("canvasInit", () => game.aboutFace.combatRunning = game.aboutFace.isCombatRunning());
Hooks.on("canvasReady", async () => {
	canvas.scene.tokens.forEach((tokenDocument) => game.aboutFace.drawAboutFaceIndicator(tokenDocument.object));
});
Hooks.on("combatStart", (combat, updateData) => {
	if (!game.aboutFace.combatOnly) return;
	game.aboutFace.combatRunning = true;
	canvas.tokens?.placeables.forEach((token) => {
		game.aboutFace.drawAboutFaceIndicator(token);
	});
});
Hooks.on("updateCombat", updateCombat);
Hooks.on("deleteCombat", updateCombat);
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
