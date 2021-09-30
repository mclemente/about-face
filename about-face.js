/**
 * About Face -- A Token Rotator
 * Rotates tokens based on the direction the token is moved
 *
 * by Eadorin, edzillion
 */

const MODULE_ID = "about-face";

const IndicatorMode = {
	OFF: 0,
	HOVER: 1,
	ALWAYS: 2,
};

Hooks.on("preUpdateToken", (token, updates) => {
	const flipOrRotate = game.settings.get(MODULE_ID, "flip-or-rotate");
	if (flipOrRotate == "rotate" && "rotation" in updates && !token.data.lockRotation) {
		var dir = updates.rotation + 90;
	} else if ("x" in updates || "y" in updates) {
		//get previews and new positions
		const prevPos = { x: token.data.x, y: token.data.y };
		const newPos = { x: updates.x ?? token.data.x, y: updates.y ?? token.data.y };
		//get the direction in degrees of the movement
		let diffY = newPos.y - prevPos.y;
		let diffX = newPos.x - prevPos.x;
		if (flipOrRotate == "flip-h") diffY = 0;
		else if (flipOrRotate == "flip-v") diffX = 0;
		if (!(diffY || diffX)) return;
		var dir = (Math.atan2(diffY, diffX) * 180) / Math.PI;
	} else return;
	//store the direction in the token data
	if (!updates.flags) updates.flags = {};
	updates.flags["about-face"] = { direction: dir };
	//update the rotation of the token
	updates.rotation = dir - 90;
});

Hooks.once("init", () => {
	libWrapper.register("about-face", "Token.prototype.refresh", drawAboutFaceIndicator);
	registerSettings();
});

function drawAboutFaceIndicator(wrapped, ...args) {
	//get the rotation of the token
	const dir = this.data.flags["about-face"]?.direction;
	if (dir === undefined || dir === null) return wrapped(...args);
	if (!this.aboutFaceIndicator || this.aboutFaceIndicator._destroyed) {
		const container = new PIXI.Container();
		container.name = "aboutFaceIndicator";
		container.width = this.w;
		container.height = this.h;
		container.x = this.w / 2;
		container.y = this.h / 2;
		const graphics = new PIXI.Graphics();
		//draw an arrow indicator
		drawArrow(graphics);
		//place the arrow in the correct position
		container.angle = dir;
		//calc distance
		const r = (Math.max(this.w, this.h) / 2) * Math.SQRT2;
		graphics.x = r;
		//calc scale
		const scale = Math.max(this.data.width, this.data.height) * this.data.scale;
		graphics.scale.set(scale, scale);
		//add the graphics to the container
		container.addChild(graphics);
		container.graphics = graphics;
		this.aboutFaceIndicator = container;
		//add the container to the token
		this.addChild(container);
	} else {
		let container = this.aboutFaceIndicator;
		let graphics = container.graphics;
		//calc distance
		const r = (Math.max(this.w, this.h) / 2) * Math.SQRT2;
		graphics.x = r;
		//calc scale
		const scale = Math.max(this.data.width, this.data.height) * this.data.scale;
		graphics.scale.set(scale, scale);
		//update the rotation of the arrow
		container.angle = dir;
	}
	const indicatorState = game.settings.get(MODULE_ID, "indicator-state");
	if (indicatorState !== IndicatorMode.ALWAYS || this.document.getFlag(MODULE_ID, "indicatorDisabled")) this.aboutFaceIndicator.graphics.visible = false;
	else if (indicatorState == IndicatorMode.HOVER) this.aboutFaceIndicator.visible = this._hover;
	wrapped(...args);
}

function drawArrow(graphics) {
	graphics
		.beginFill("", 0.5)
		.lineStyle(2, "", 1) //Alternative: .lineStyle(1, 0xffffff, 1);
		.moveTo(0, 0)
		.lineTo(0, -10)
		.lineTo(10, 0)
		.lineTo(0, 10)
		.lineTo(0, 0)
		.closePath()
		.endFill()
		.beginFill(0x000000, 0)
		.lineStyle(0, 0x000000, 0)
		.endFill();
}

function registerSettings() {
	// game.settings.register(MODULE_ID, "scene-enabled", {
	// 	name: "about-face.options.scene-enabled.name",
	// 	hint: "about-face.options.scene-enabled.hint",
	// 	scope: "world",
	// 	config: true,
	// 	default: true,
	// 	type: Boolean,
	// 	onChange: (value) => {
	// 		if (!canvas.scene) return;
	// 		if (isFirstActiveGM()) canvas.scene.setFlag(MODULE_ID, "sceneEnabled", value);
	// 	},
	// });

	game.settings.register(MODULE_ID, "indicator-state", {
		name: "about-face.options.enable-indicator.name",
		hint: "about-face.options.enable-indicator.hint",
		scope: "client",
		config: true,
		default: 2,
		type: Number,
		choices: {
			0: "about-face.options.indicator.choices.0",
			1: "about-face.options.indicator.choices.1",
			2: "about-face.options.indicator.choices.2",
		},
		onChange: (value) => {
			if (Number(value) !== IndicatorMode.ALWAYS) toggleAllIndicators(false);
			else toggleAllIndicators(true);
		},
	});

	// game.settings.register(MODULE_ID, "sprite-type", {
	// 	name: "about-face.options.indicator-sprite.name",
	// 	hint: "about-face.options.indicator-sprite.hint",
	// 	scope: "world",
	// 	config: true,
	// 	default: 0,
	// 	type: Number,
	// 	choices: {
	// 		0: "about-face.options.indicator-sprite.choices.normal",
	// 		1: "about-face.options.indicator-sprite.choices.large",
	// 	},
	// 	onChange: async (value) => {
	// 		if (!canvas.scene) return;
	// 		value = Number(value);
	// 		if (isFirstActiveGM()) canvas.scene.setFlag(MODULE_ID, "spriteType", value);
	// 	},
	// });

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
async function renderTokenConfigHandler(tokenConfig, html) {
	const posTab = html.find('.tab[data-tab="position"]');

	const flipOrRotate = tokenConfig.object.getFlag(MODULE_ID, "flipOrRotate") || "rotate";
	let data = {
		indicatorDisabled: tokenConfig.object.getFlag(MODULE_ID, "indicatorDisabled") ? "checked" : "",
		flipOrRotates: game.settings.settings.get("about-face.flip-or-rotate").choices,
		flipOrRotate: flipOrRotate,
	};

	const insertHTML = await renderTemplate("modules/" + MODULE_ID + "/templates/token-config.html", data);
	posTab.append(insertHTML);
}

function toggleAllIndicators(state) {
	if (canvas == null) return;
	const tokens = Array.from(
		game.scenes.map((scene) => scene.getEmbeddedCollection("Token")),
		([token]) => token.object
	);
	for (const token of tokens) {
		token.aboutFaceIndicator.graphics.visible = state;
	}
}

// Hooks.on("createToken", AboutFace.createTokenHandler);
// Hooks.on("deleteToken", AboutFace.deleteTokenHandler);
// Hooks.on("canvasReady", AboutFace.canvasReadyHandler);
// Hooks.on("updateToken", AboutFace.updateTokenHandler);
// Hooks.on("updateScene", AboutFace.updateSceneHandler);
Hooks.on("renderTokenConfig", renderTokenConfigHandler);
