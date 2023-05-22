import { colorPicker } from "./colorPicker.js";
import { injectConfig } from "./injectConfig.js";
import { drawAboutFaceIndicator } from "./logic.js";

export const MODULE_ID = "about-face";
export const IndicatorMode = {
	OFF: 0,
	HOVER: 1,
	ALWAYS: 2,
};
const facingOptions = {
	global: {},
	none: {},
	rotate: {
		right: "about-face.options.facing-direction.choices.right",
		left: "about-face.options.facing-direction.choices.left",
		down: "about-face.options.facing-direction.choices.down",
		up: "about-face.options.facing-direction.choices.up",
	},
	"flip-h": {
		right: "about-face.options.facing-direction.choices.right",
		left: "about-face.options.facing-direction.choices.left",
	},
	"flip-v": {
		down: "about-face.options.facing-direction.choices.down",
		up: "about-face.options.facing-direction.choices.up",
	},
};

function getAllTokens() {
	const tokens = [];
	canvas.scene.tokens.forEach((tokenDocument) => {
		if (tokenDocument.object) tokens.push(tokenDocument.object);
	});
	return tokens;
}

export function registerSettings() {
	const SYSTEM_DEFAULTS = {};
	let system = /gurps/.exec(game.system.id);
	if (system) {
		switch (system[0]) {
			case "gurps":
				SYSTEM_DEFAULTS.lockArrowToFace = true;
				SYSTEM_DEFAULTS.lockRotation = true;
				SYSTEM_DEFAULTS["flip-or-rotate"] = "rotate";
				break;
			default:
				console.error(`About Face | Somehow, this happened.`);
		}
	}

	game.settings.register(MODULE_ID, "arrowColor", {
		name: "about-face.options.arrowColor.name",
		hint: "about-face.options.arrowColor.hint",
		scope: "world",
		config: true,
		default: "#000000",
		type: String,
		onChange: (value) => {
			game.aboutFace.indicatorColor = value;
			if (canvas == null) return;
			const tokens = getAllTokens();
			for (const token of tokens) {
				if (token.aboutFaceIndicator) {
					token.aboutFaceIndicator.destroy();
					drawAboutFaceIndicator(token);
				}
			}
		},
	});

	game.settings.register(MODULE_ID, "arrowDistance", {
		name: "about-face.options.arrowDistance.name",
		hint: "about-face.options.arrowDistance.hint",
		scope: "world",
		config: true,
		default: 1.4,
		type: Number,
		range: {
			min: 1.0,
			max: 1.4,
			step: 0.05,
		},
		onChange: (value) => {
			game.aboutFace.indicatorDistance = value;
			if (canvas == null) return;
			const tokens = getAllTokens();
			for (const token of tokens) {
				if (token.aboutFaceIndicator) drawAboutFaceIndicator(token);
			}
		},
	});

	game.settings.register(MODULE_ID, "indicator-state", {
		name: "about-face.options.enable-indicator.name",
		hint: "about-face.options.enable-indicator.hint",
		scope: "world",
		config: true,
		default: 2,
		type: Number,
		choices: {
			0: "about-face.options.enable-indicator.choices.0",
			1: "about-face.options.enable-indicator.choices.1",
			2: "about-face.options.enable-indicator.choices.2",
		},
		onChange: (value) => {
			if (Number(value) !== IndicatorMode.ALWAYS) toggleAllIndicators(false);
			else toggleAllIndicators(true);
		},
	});

	game.settings.register(MODULE_ID, "indicator-state-pc", {
		name: "about-face.options.enable-indicator-pc.name",
		hint: "about-face.options.enable-indicator-pc.hint",
		scope: "world",
		config: true,
		default: 2,
		type: Number,
		choices: {
			0: "about-face.options.enable-indicator.choices.0",
			1: "about-face.options.enable-indicator.choices.1",
			2: "about-face.options.enable-indicator.choices.2",
		},
		onChange: (value) => {
			if (Number(value) !== IndicatorMode.ALWAYS) toggleAllIndicators(false, true);
			else toggleAllIndicators(true, true);
		},
	});

	game.settings.register(MODULE_ID, "sprite-type", {
		name: "about-face.options.indicator-sprite.name",
		hint: "about-face.options.indicator-sprite.hint",
		scope: "world",
		config: true,
		default: 1.0,
		type: Number,
		range: {
			min: 0.5,
			max: 2.0,
			step: 0.05,
		},
		onChange: (value) => {
			game.aboutFace.indicatorSize = value;
			if (canvas == null) return;
			const tokens = getAllTokens();
			for (const token of tokens) {
				drawAboutFaceIndicator(token);
			}
		},
	});

	game.settings.register(MODULE_ID, "indicatorDrawingType", {
		name: "about-face.options.indicatorDrawingType.name",
		hint: "about-face.options.indicatorDrawingType.hint",
		scope: "world",
		config: true,
		default: 0,
		type: Number,
		choices: {
			0: "Arrow",
			1: "Line",
		},
		requiresReload: true,
	});

	game.settings.register(MODULE_ID, "hideIndicatorOnDead", {
		name: "about-face.options.hideIndicatorOnDead.name",
		hint: "about-face.options.hideIndicatorOnDead.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		onChange: (value) => {
			game.aboutFace.hideIndicatorOnDead = value;
			if (canvas == null) return;
			const tokens = getAllTokens();
			for (const token of tokens) {
				drawAboutFaceIndicator(token);
			}
		},
	});

	game.settings.register(MODULE_ID, "lockArrowRotation", {
		name: "about-face.options.lockArrowRotation.name",
		hint: "about-face.options.lockArrowRotation.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		onChange: (value) => {
			new Dialog({
				title: game.i18n.localize("about-face.options.lockArrowRotation.name"),
				content: game.i18n.localize("about-face.options.changeEverySceneDialog"),
				buttons: {
					yes: {
						label: "Yes",
						callback: (html) => {
							game.scenes.updateAll({ flags: { [MODULE_ID]: { lockArrowRotation: value } } });
						},
					},
					no: {
						label: "No",
					},
				},
			}).render(true);
		},
	});
	game.settings.register(MODULE_ID, "lockArrowToFace", {
		name: "about-face.options.lockArrowToFace.name",
		hint: "about-face.options.lockArrowToFace.hint",
		scope: "world",
		config: true,
		default: SYSTEM_DEFAULTS.lockArrowToFace || false,
		type: Boolean,
	});

	game.settings.register(MODULE_ID, "disableAnimations", {
		name: "about-face.options.disableAnimations.name",
		hint: "about-face.options.disableAnimations.hint",
		scope: "world",
		config: true,
		default: 0,
		type: Number,
		choices: {
			0: "about-face.options.disableAnimations.choices.none",
			1: "about-face.options.disableAnimations.choices.mirror",
			2: "about-face.options.disableAnimations.choices.rotation",
			3: "about-face.options.disableAnimations.choices.all",
		},
		onChange: (value) => {
			if (!(game.aboutFace.disableAnimations && value)) game.aboutFace.toggleAnimateFrame(value);
			game.aboutFace.disableAnimations = value;
		},
	});
	game.settings.register(MODULE_ID, "lockRotation", {
		name: "about-face.options.lockRotation.name",
		hint: "about-face.options.lockRotation.hint",
		scope: "world",
		config: true,
		default: SYSTEM_DEFAULTS.lockRotation || false,
		type: Boolean,
		onChange: (value) => {
			new Dialog({
				title: game.i18n.localize("about-face.options.lockRotation.name"),
				content: game.i18n.localize("about-face.options.changeEverySceneDialog"),
				buttons: {
					yes: {
						label: "Yes",
						callback: (html) => {
							game.scenes.updateAll({ flags: { [MODULE_ID]: { lockRotation: value } } });
						},
					},
					no: {
						label: "No",
					},
				},
			}).render(true);
		},
	});

	game.settings.register(MODULE_ID, "flip-or-rotate", {
		name: "about-face.options.flip-or-rotate.name",
		hint: "about-face.options.flip-or-rotate.hint",
		scope: "world",
		config: true,
		default: SYSTEM_DEFAULTS["flip-or-rotate"] || "flip-h",
		type: String,
		choices: {
			rotate: "about-face.options.flip-or-rotate.choices.rotate",
			"flip-h": "about-face.options.flip-or-rotate.choices.flip-h",
			"flip-v": "about-face.options.flip-or-rotate.choices.flip-v",
		},
	});
	game.settings.register(MODULE_ID, "facing-direction", {
		name: "about-face.options.facing-direction.name",
		hint: "about-face.options.facing-direction.hint",
		scope: "world",
		config: true,
		default: "right",
		type: String,
		choices: {
			right: "about-face.options.facing-direction.choices.right",
			left: "about-face.options.facing-direction.choices.left",
		},
	});
	game.settings.register(MODULE_ID, "lockVisionToRotation", {
		name: "about-face.options.lockVisionToRotation.name",
		hint: "about-face.options.lockVisionToRotation.hint",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
}

/**
 * Handler called when token configuration window is opened. Injects custom form html and deals
 * with updating token.
 * @category GMOnly
 * @function
 * @async
 * @param {TokenConfig} tokenConfig
 * @param {JQuery} html
 */
export async function renderSettingsConfigHandler(tokenConfig, html) {
	const lockArrowRotation = game.settings.get(MODULE_ID, "lockArrowRotation");
	const lockArrowRotationCheckbox = html.find('input[name="about-face.lockArrowRotation"]');
	const lockArrowToFaceCheckbox = html.find('input[name="about-face.lockArrowToFace"]');
	disableCheckbox(lockArrowToFaceCheckbox, lockArrowRotation);

	lockArrowRotationCheckbox.on("change", (event) => {
		disableCheckbox(lockArrowToFaceCheckbox, event.target.checked);
	});

	const flipOrRotate = game.settings.get(MODULE_ID, "flip-or-rotate");
	const flipOrRotateSelect = html.find('select[name="about-face.flip-or-rotate"]');
	const flipDirectionSelect = html.find('select[name="about-face.facing-direction"]');
	replaceSelectChoices(flipDirectionSelect, facingOptions[flipOrRotate]);

	const lockVisionToRotationCheckbox = html.find('input[name="about-face.lockVisionToRotation"]');

	disableCheckbox(lockVisionToRotationCheckbox, flipOrRotate !== "rotate");
	flipOrRotateSelect.on("change", (event) => {
		const facingDirections = facingOptions[event.target.value];
		replaceSelectChoices(flipDirectionSelect, facingDirections);
		disableCheckbox(lockVisionToRotationCheckbox, event.target.value !== "rotate");
	});

	// Create color picker
	const arrowColorInput = html.find('input[name="about-face.arrowColor"]');
	if (arrowColorInput.length) colorPicker("about-face.arrowColor", html, game.settings.get(MODULE_ID, "arrowColor"));
}

function disableCheckbox(checkbox, boolean) {
	checkbox.prop("disabled", boolean);
}

function replaceSelectChoices(select, choices) {
	const facing = game.settings.get(MODULE_ID, "facing-direction");
	select.empty();
	let hasGlobal = false;
	for (const [key, value] of Object.entries(choices)) {
		if (key == "global") {
			hasGlobal = true;
			select.append(
				$("<option></option>").attr("value", key).attr("selected", true).text(game.i18n.localize(value))
			);
		} else {
			select.append(
				$("<option></option>")
					.attr("value", key)
					.attr("selected", !hasGlobal && facing == key)
					.text(game.i18n.localize(value))
			);
		}
	}
}

/**
 * Handler called when token configuration window is opened. Injects custom form html and deals
 * with updating token.
 * @category GMOnly
 * @function
 * @async
 * @param {TokenConfig} tokenConfig
 * @param {JQuery} html
 */
export async function renderTokenConfigHandler(tokenConfig, html) {
	injectConfig.inject(
		tokenConfig,
		html,
		{
			moduleId: MODULE_ID,
			tab: {
				name: MODULE_ID,
				label: game.i18n.localize("about-face.options.facing"),
				icon: "fas fa-caret-down fa-fw",
			},
		},
		tokenConfig.object
	);
	const posTab = html.find(`.tab[data-tab="${MODULE_ID}"]`);

	// const flipOrRotate = tokenConfig.object.getFlag(MODULE_ID, "flipOrRotate") || "global";
	if (tokenConfig.options.sheetConfig) {
		var indicatorDisabled = tokenConfig.object.getFlag(MODULE_ID, "indicatorDisabled") ? "checked" : "";
		var flipOrRotate = tokenConfig.object.getFlag(MODULE_ID, "flipOrRotate") || "global";
		var facingDirection = tokenConfig.object.getFlag(MODULE_ID, "facingDirection") || "global";
		var rotationOffset = tokenConfig.object.getFlag(MODULE_ID, "rotationOffset") || "0";
	} else {
		indicatorDisabled = tokenConfig.token.flags?.[MODULE_ID]?.indicatorDisabled ? "checked" : "";
		flipOrRotate = tokenConfig.token.flags?.[MODULE_ID]?.flipOrRotate || "global";
		facingDirection = tokenConfig.token.flags?.[MODULE_ID]?.facingDirection || "global";
		rotationOffset = tokenConfig.token.flags?.[MODULE_ID]?.rotationOffset || "0";
	}
	const flipOrRotateSetting = game.settings.get(MODULE_ID, "flip-or-rotate");
	const flipOrRotates = {
		global: `${game.i18n.localize("about-face.options.flip-or-rotate.choices.global")} (${game.i18n.localize(
			"about-face.options.flip-or-rotate.choices." + flipOrRotateSetting
		)})`,
		...game.settings.settings.get("about-face.flip-or-rotate").choices,
	};
	const facingDirectionSetting = game.settings.get(MODULE_ID, "facing-direction");
	const facingDirections = {
		global: `${game.i18n.localize("about-face.options.flip-or-rotate.choices.global")} (${game.i18n.localize(
			"about-face.options.facing-direction.choices." + facingDirectionSetting
		)})`,
		...facingOptions[flipOrRotateSetting],
	};
	let data = {
		indicatorDisabled: indicatorDisabled,
		flipOrRotates: flipOrRotates,
		flipOrRotate: flipOrRotate,
		facingDirection: facingDirection,
		facingDirections: facingDirections,
		rotationOffset: rotationOffset,
	};

	const insertHTML = await renderTemplate("modules/" + MODULE_ID + "/templates/token-config.html", data);
	posTab.append(insertHTML);

	const selectFlipOrRotate = posTab.find(".token-config-select-flip-or-rotate");
	const selectFacingDirection = posTab.find(".token-config-select-facing-direction");

	selectFlipOrRotate.on("change", (event) => {
		const flipOrRotate = event.target.value != "global" ? event.target.value : flipOrRotateSetting;
		if (event.target.value == "global") {
			var facingDirections = {
				global: `${game.i18n.localize(
					"about-face.options.flip-or-rotate.choices.global"
				)} (${game.i18n.localize("about-face.options.facing-direction.choices." + facingDirectionSetting)})`,
			};
		} else facingDirections = {};
		facingDirections = {
			...facingDirections,
			...facingOptions[flipOrRotate],
		};
		replaceSelectChoices(selectFacingDirection, facingDirections);
	});
}

export function renderSceneConfigHandler(app, html) {
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
			default: app.object?.flags?.[MODULE_ID]?.sceneEnabled ?? true,
		},
		lockRotation: {
			type: "checkbox",
			label: game.i18n.localize("about-face.sceneConfig.lockRotation.name"),
			notes: game.i18n.localize("about-face.sceneConfig.lockRotation.hint"),
			default: app.object?.flags?.[MODULE_ID]?.lockRotation ?? game.settings.get(MODULE_ID, "lockRotation"),
		},
		lockRotationButton: {
			type: "custom",
			html: `<button type="button" id="lockRotationButton">${game.i18n.localize(
				"about-face.sceneConfig.apply"
			)}</button>`,
		},
		lockArrowRotation: {
			type: "checkbox",
			label: game.i18n.localize("about-face.sceneConfig.lockArrowRotation.name"),
			notes: game.i18n.localize("about-face.sceneConfig.lockArrowRotation.hint"),
			default:
				app.object?.flags?.[MODULE_ID]?.lockArrowRotation ?? game.settings.get(MODULE_ID, "lockArrowRotation"),
		},
		lockArrowRotationButton: {
			type: "custom",
			html: `<button type="button" id="lockArrowRotationButton">${game.i18n.localize(
				"about-face.sceneConfig.apply"
			)}</button>`,
		},
	};
	injectConfig.inject(app, html, data, app.object);
}

export async function asyncRenderSceneConfigHandler(app, html) {
	const lockRotationButton = html.find("button[id='lockRotationButton']");
	lockRotationButton.on("click", () => {
		const lockRotationCheckbox = html.find('input[name="flags.about-face.lockRotation"]');
		const state = lockRotationCheckbox[0].checked;
		const updates = [];
		canvas.scene.tokens.forEach((token) => {
			if (token.lockRotation != state) {
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
			if ("token.flags.about-face.lockArrowRotation" != state) {
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
}

function toggleAllIndicators(state, playerOwner = false) {
	if (canvas == null) return;
	const tokens = getAllTokens();
	tokens.forEach((token) => {
		if (token.actor.hasPlayerOwner == playerOwner && token.aboutFaceIndicator)
			token.aboutFaceIndicator.graphics.visible = state;
	});
}
