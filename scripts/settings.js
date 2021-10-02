export const MODULE_ID = "about-face";
export const IndicatorMode = {
	OFF: 0,
	HOVER: 1,
	ALWAYS: 2,
};
const facingOptions = {
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

function changeIndicatorSize(value) {
	if (canvas == null) return;
	const tokens = getAllTokens();
	for (const token of tokens) {
		const scale = Math.max(token.data.width, token.data.height) * token.data.scale * [1, 1.5][value];
		if (token.aboutFaceIndicator) token.aboutFaceIndicator.graphics.scale.set(scale, scale);
	}
}

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
	game.settings.register(MODULE_ID, "indicator-state", {
		name: "about-face.options.enable-indicator.name",
		hint: "about-face.options.enable-indicator.hint",
		scope: "client",
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

	game.settings.register(MODULE_ID, "sprite-type", {
		name: "about-face.options.indicator-sprite.name",
		hint: "about-face.options.indicator-sprite.hint",
		scope: "world",
		config: true,
		default: 0,
		type: Number,
		choices: {
			0: "about-face.options.indicator-sprite.choices.normal",
			1: "about-face.options.indicator-sprite.choices.large",
		},
		onChange: (value) => {
			changeIndicatorSize(value);
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
			none: "TOKEN.PositionLock",
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
	const flipOrRotate = game.settings.get(MODULE_ID, "flip-or-rotate");
	const flipOrRotateSelect = html.find('select[name="about-face.flip-or-rotate"]');
	const flipDirectionSelect = html.find('select[name="about-face.facing-direction"]');
	replaceSelectChoices(flipDirectionSelect, facingOptions[flipOrRotate]);

	flipOrRotateSelect.on("change", (event) => {
		const facingDirections = facingOptions[event.target.value];
		replaceSelectChoices(flipDirectionSelect, facingDirections);
	});
}

function replaceSelectChoices(select, choices) {
	select.empty();
	for (const [key, value] of Object.entries(choices)) {
		select.append($("<option></option>").attr("value", key).text(game.i18n.localize(value)));
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
	const posTab = html.find('.tab[data-tab="position"]');

	const flipOrRotate = tokenConfig.object.getFlag(MODULE_ID, "flipOrRotate") || "rotate";
	let data = {
		indicatorDisabled: tokenConfig.object.getFlag(MODULE_ID, "indicatorDisabled") ? "checked" : "",
		flipOrRotates: game.settings.settings.get("about-face.flip-or-rotate").choices,
		flipOrRotate: flipOrRotate,
		facingDirections: facingOptions[flipOrRotate],
	};

	const insertHTML = await renderTemplate("modules/" + MODULE_ID + "/templates/token-config.html", data);
	posTab.append(insertHTML);

	const selectFlipOrRotate = posTab.find(".token-config-select-flip-or-rotate");
	const selectFacingDirection = posTab.find(".token-config-select-facing-direction");
	const lockRotateCheckbox = document.getElementsByName("lockRotation")[0];

	selectFlipOrRotate.on("change", (event) => {
		const facingDirections = facingOptions[event.target.value];
		replaceSelectChoices(selectFacingDirection, facingDirections);
		// lockRotateCheckbox.checked = event.target.value !== "rotate";
	});
}

function toggleAllIndicators(state) {
	if (canvas == null) return;
	const tokens = getAllTokens();
	for (const token of tokens) {
		if (token.aboutFaceIndicator) token.aboutFaceIndicator.graphics.visible = state;
	}
}