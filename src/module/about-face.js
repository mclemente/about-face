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

function addTokenConfigTab(cls) {
	cls.TABS.sheet.tabs.push({ id: "aboutFace", label: "About Face", icon: "fas fa-caret-down fa-fw" });

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

async function renderTokenConfigHandler(form, data, options, docPath = "document") {
	if (!options.isFirstRender) return;
	const flipOrRotateSetting = game.settings.get(MODULE_ID, "flip-or-rotate");
	const flags = data[docPath].flags?.[MODULE_ID] ?? {};
	const tabData = {
		tab: data.tabs.aboutFace,
		indicatorDisabled: flags.indicatorDisabled,
		flipOrRotate: flags.flipOrRotate || "global",
		facingDirection: flags.facingDirection || "global",
		rotationOffset: flags.rotationOffset || 0,
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
	const tab = await foundry.applications.handlebars.renderTemplate("modules/about-face/templates/token-config.html", tabData);
	const lastTab = [...form.querySelectorAll(".tab")].pop();
	lastTab.insertAdjacentHTML("afterend", tab);
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
Hooks.on("renderPrototypeTokenConfig", (_app, form, data, options) => renderTokenConfigHandler(form, data, options, "source"));
Hooks.on("renderTokenConfig", (_app, form, data, options) => renderTokenConfigHandler(form, data, options));
