import { colorPicker } from "./colorPicker.js";
// import { injectConfig } from "./injectConfig.js";

export const MODULE_ID = "about-face";
export const IndicatorMode = {
	OFF: 0,
	HOVER: 1,
	ALWAYS: 2,
};
export const facingOptions = {
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
				console.error("About Face | Somehow, this happened.");
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
			if (canvas === null) return;
			const tokens = getAllTokens();
			for (const token of tokens) {
				if (token.aboutFaceIndicator) {
					token.aboutFaceIndicator.destroy();
					game.aboutFace.drawAboutFaceIndicator(token);
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
			if (canvas === null) return;
			const tokens = getAllTokens();
			for (const token of tokens) {
				if (token.aboutFaceIndicator) game.aboutFace.drawAboutFaceIndicator(token);
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
			value = Number(value);
			if (value === IndicatorMode.HOVER) {
				Hooks.on("hoverToken", tokenHover);
				Hooks.on("highlightObjects", highlightObjects);
			} else {
				Hooks.off("hoverToken", tokenHover);
				Hooks.off("highlightObjects", highlightObjects);
			}
			toggleAllIndicators(value === IndicatorMode.ALWAYS);
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
			value = Number(value);
			if (value === IndicatorMode.HOVER) {
				Hooks.on("hoverToken", tokenHover);
				Hooks.on("highlightObjects", highlightObjects);
			} else {
				Hooks.off("hoverToken", tokenHover);
				Hooks.off("highlightObjects", highlightObjects);
			}
			toggleAllIndicators(value === IndicatorMode.ALWAYS, true);
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
			if (canvas === null) return;
			const tokens = getAllTokens();
			for (const token of tokens) {
				game.aboutFace.drawAboutFaceIndicator(token);
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
			0: game.i18n.localize("about-face.options.indicatorDrawingType.options.arrow"),
			1: game.i18n.localize("about-face.options.indicatorDrawingType.options.line"),
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
			if (canvas === null) return;
			const tokens = getAllTokens();
			for (const token of tokens) {
				game.aboutFace.drawAboutFaceIndicator(token);
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
						label: game.i18n.localize("Yes"),
						callback: (html) => {
							game.scenes.updateAll({ flags: { [MODULE_ID]: { lockArrowRotation: value } } });
						},
					},
					no: {
						label: game.i18n.localize("No"),
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
		default: false,
		type: Boolean,
		onChange: (value) => {
			game.aboutFace._prepareAnimation(value);
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
						label: game.i18n.localize("Yes"),
						callback: (html) => {
							game.scenes.updateAll({ flags: { [MODULE_ID]: { lockRotation: value } } });
						},
					},
					no: {
						label: game.i18n.localize("No"),
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

export async function renderSettingsConfigHandler(app, html) {
	if (!game.user.isGM) return;
	const lockArrowRotation = game.settings.get(MODULE_ID, "lockArrowRotation");
	const lockArrowRotationCheckbox = html.querySelector('input[name="about-face.lockArrowRotation"]');
	const lockArrowToFaceCheckbox = html.querySelector('input[name="about-face.lockArrowToFace"]');
	disableCheckbox(lockArrowToFaceCheckbox, lockArrowRotation);

	lockArrowRotationCheckbox.addEventListener("change", (event) => {
		disableCheckbox(lockArrowToFaceCheckbox, event.target.checked);
	});

	const flipOrRotate = game.settings.get(MODULE_ID, "flip-or-rotate");
	const flipOrRotateSelect = html.querySelector('select[name="about-face.flip-or-rotate"]');
	const flipDirectionSelect = html.querySelector('select[name="about-face.facing-direction"]');
	replaceSelectChoices(flipDirectionSelect, facingOptions[flipOrRotate]);

	const lockVisionToRotationCheckbox = html.querySelector('input[name="about-face.lockVisionToRotation"]');

	disableCheckbox(lockVisionToRotationCheckbox, flipOrRotate !== "rotate");
	flipOrRotateSelect.addEventListener("change", (event) => {
		const facingDirections = facingOptions[event.target.value];
		replaceSelectChoices(flipDirectionSelect, facingDirections);
		disableCheckbox(lockVisionToRotationCheckbox, event.target.value !== "rotate");
	});

	// Create color picker
	const arrowColorInput = html.querySelector('input[name="about-face.arrowColor"]');
	if (arrowColorInput.length) colorPicker("about-face.arrowColor", html, game.settings.get(MODULE_ID, "arrowColor"));
}

function disableCheckbox(checkbox, boolean) {
	checkbox.disabled = boolean;
}

function replaceSelectChoices(select, choices) {
	const facing = game.settings.get(MODULE_ID, "facing-direction");
	select.innerHTML = "";
	let hasGlobal = false;
	for (const [key, value] of Object.entries(choices)) {
		if (key === "global") hasGlobal = true;
		const option = document.createElement("option");
		option.value = key;
		option.textContent = game.i18n.localize(value);
		option.selected = key === "global" || (!hasGlobal && facing === key);
		select.appendChild(option);
	}
}

function toggleAllIndicators(state, playerOwner = false) {
	if (canvas === null) return;
	const tokens = getAllTokens();
	tokens.forEach((token) => {
		if (token.actor.hasPlayerOwner === playerOwner && token.aboutFaceIndicator) {
			token.aboutFaceIndicator.graphics.visible = state;
		}
	});
}

export function tokenHover(token, hovered) {
	if (hovered) {
		game.aboutFace.drawAboutFaceIndicator(token);
	} else if (token.aboutFaceIndicator) {
		token.aboutFaceIndicator.graphics.visible = false;
	}
}
export function highlightObjects(highlighted) {
	if (canvas.scene?.flags?.[MODULE_ID].sceneEnabled) {
		canvas.scene.tokens.forEach((tokenDocument) => {
			if (highlighted) {
				game.aboutFace.drawAboutFaceIndicator(tokenDocument.object);
			} else if (tokenDocument.object.aboutFaceIndicator) {
				tokenDocument.object.aboutFaceIndicator.graphics.visible = false;
			}
		});
	}
}
