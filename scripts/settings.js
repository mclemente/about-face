import { updateArrowColor, updateArrowDistance } from "./logic.js";
import { injectConfig } from "./injectConfig.js";
import { colorPicker } from "./colorPicker.js";

export const MODULE_ID = "about-face";
export const IndicatorMode = {
	OFF: 0,
	HOVER: 1,
	ALWAYS: 2,
};
const facingOptions = {
	global: {},
	none: {},
	rotate: {},
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
	const scenes = game.scenes
		.filter((scene) => {
			if (scene.getEmbeddedCollection("Token").size) return true;
			return false;
		})
		.map((scene) => scene.getEmbeddedCollection("Token"));
	const tokens = [];
	scenes.forEach((scene) => {
		scene.forEach((token) => {
			if (token.object) tokens.push(token.object);
		});
	});
	return tokens;
}

export function registerSettings() {
	game.settings.register(MODULE_ID, "arrowColor", {
		name: "about-face.options.arrowColor.name",
		hint: "about-face.options.arrowColor.hint",
		scope: "world",
		config: true,
		default: "#000000",
		type: String,
		onChange: (value) => {
			updateArrowColor(value);
			if (canvas == null) return;
			const tokens = getAllTokens();
			for (const token of tokens) {
				if (token.aboutFaceIndicator) {
					token.aboutFaceIndicator.destroy();
					token.refresh();
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
			updateArrowDistance(value);
			if (canvas == null) return;
			const tokens = getAllTokens();
			for (const token of tokens) {
				if (token.aboutFaceIndicator) {
					token.refresh();
				}
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
		onChange: () => {
			if (canvas == null) return;
			const tokens = getAllTokens();
			for (const token of tokens) {
				token.refresh();
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
		default: false,
		type: Boolean,
	});

	game.settings.register(MODULE_ID, "lockRotation", {
		name: "about-face.options.lockRotation.name",
		hint: "about-face.options.lockRotation.hint",
		scope: "world",
		config: true,
		default: false,
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
		default: "flip-h",
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
	disableCheckbox(flipDirectionSelect, flipOrRotate == "rotate");

	const lockVisionToRotationCheckbox = html.find('input[name="about-face.lockVisionToRotation"]');
	disableCheckbox(lockVisionToRotationCheckbox, flipOrRotate !== "rotate");

	flipOrRotateSelect.on("change", (event) => {
		const facingDirections = facingOptions[event.target.value];
		replaceSelectChoices(flipDirectionSelect, facingDirections);
		disableCheckbox(flipDirectionSelect, event.target.value == "rotate");
		disableCheckbox(lockVisionToRotationCheckbox, event.target.value !== "rotate");
	});

	// Create color picker
	colorPicker("about-face.arrowColor", html);
}

function disableCheckbox(checkbox, boolean) {
	checkbox.prop("disabled", boolean);
}

function replaceSelectChoices(select, choices) {
	const facing = game.settings.get(MODULE_ID, "facing-direction");
	select.empty();
	for (const [key, value] of Object.entries(choices)) {
		select.append(
			$("<option></option>")
				.attr("value", key)
				.attr("selected", facing == key)
				.text(game.i18n.localize(value))
		);
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
			moduleId: "about-face",
			tab: {
				name: "about-face",
				label: "About Face",
				icon: "fas fa-caret-down fa-fw",
			},
		},
		tokenConfig.object
	);
	const posTab = html.find('.tab[data-tab="about-face"]');

	// const flipOrRotate = tokenConfig.object.getFlag(MODULE_ID, "flipOrRotate") || "global";
	if (tokenConfig.options.sheetConfig) {
		var indicatorDisabled = tokenConfig.object.getFlag(MODULE_ID, "indicatorDisabled") ? "checked" : "";
		var flipOrRotate = tokenConfig.object.getFlag(MODULE_ID, "flipOrRotate") || "global";
		var facingDirection = tokenConfig.object.getFlag(MODULE_ID, "facingDirection") || "";
	} else {
		indicatorDisabled = tokenConfig.token.flags?.[MODULE_ID]?.indicatorDisabled ? "checked" : "";
		flipOrRotate = tokenConfig.token.flags?.[MODULE_ID]?.flipOrRotate || "global";
		facingDirection = tokenConfig.token.flags?.[MODULE_ID]?.facingDirection || "";
	}
	const flipOrRotates = {
		global: "about-face.options.flip-or-rotate.choices.global",
		...game.settings.settings.get("about-face.flip-or-rotate").choices,
	};
	let data = {
		indicatorDisabled: indicatorDisabled,
		flipOrRotates: flipOrRotates,
		flipOrRotate: flipOrRotate,
		facingDirection: facingDirection,
		facingDirections: facingOptions[flipOrRotate != "global" ? flipOrRotate : game.settings.get(MODULE_ID, "flip-or-rotate")],
	};

	const insertHTML = await renderTemplate("modules/" + MODULE_ID + "/templates/token-config.html", data);
	posTab.append(insertHTML);

	const selectFlipOrRotate = posTab.find(".token-config-select-flip-or-rotate");
	const selectFacingDirection = posTab.find(".token-config-select-facing-direction");

	selectFlipOrRotate.on("change", (event) => {
		const flipOrRotate = event.target.value != "global" ? event.target.value : game.settings.get(MODULE_ID, "flip-or-rotate");
		const facingDirections = facingOptions[flipOrRotate];
		replaceSelectChoices(selectFacingDirection, facingDirections);
	});
}

function toggleAllIndicators(state, playerOwner = false) {
	if (canvas == null) return;
	const tokens = getAllTokens().filter((token) => {
		return token.actor.hasPlayerOwner == playerOwner;
	});
	for (const token of tokens) {
		if (token.aboutFaceIndicator) token.aboutFaceIndicator.graphics.visible = state;
	}
}
