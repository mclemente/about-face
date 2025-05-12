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
		type: new foundry.data.fields.ColorField({ nullable: false, initial: "#000000" }),
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
		default: true,
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

	game.settings.register(MODULE_ID, "lockArrowToFace", {
		name: "about-face.options.lockArrowToFace.name",
		hint: "about-face.options.lockArrowToFace.hint",
		scope: "world",
		config: true,
		default: SYSTEM_DEFAULTS.lockArrowToFace || false,
		type: Boolean,
	});

	game.settings.register(MODULE_ID, "flip-or-rotate", {
		name: "about-face.options.flip-or-rotate.name",
		hint: "about-face.options.flip-or-rotate.hint",
		scope: "world",
		config: true,
		type: new foundry.data.fields.StringField({required: true, initial: SYSTEM_DEFAULTS["flip-or-rotate"] || "flip-h",
			choices: {
				rotate: "about-face.options.flip-or-rotate.choices.rotate",
				"flip-h": "about-face.options.flip-or-rotate.choices.flip-h",
				"flip-v": "about-face.options.flip-or-rotate.choices.flip-v",
			}}),
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
}

export async function renderSettingsConfigHandler(app, html) {
	if (!game.user.isGM) return;
	const flipOrRotate = game.settings.get(MODULE_ID, "flip-or-rotate");
	const flipOrRotateSelect = html.querySelector('select[name="about-face.flip-or-rotate"]');
	const flipDirectionSelect = html.querySelector('select[name="about-face.facing-direction"]');
	replaceSelectChoices(flipDirectionSelect, facingOptions[flipOrRotate] ?? {});

	flipOrRotateSelect.addEventListener("change", (event) => {
		const facingDirections = facingOptions[event.target.value] ?? {};
		replaceSelectChoices(flipDirectionSelect, facingDirections);
	});
}

export function replaceSelectChoices(select, choices) {
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
	canvas.scene.tokens.forEach((tokenDocument) => {
		if (highlighted) {
			game.aboutFace.drawAboutFaceIndicator(tokenDocument.object);
		} else if (tokenDocument.object.aboutFaceIndicator) {
			tokenDocument.object.aboutFaceIndicator.graphics.visible = false;
		}
	});
}
