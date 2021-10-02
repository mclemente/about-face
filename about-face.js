/**
 * About Face -- A Token Rotator
 * Rotates tokens based on the direction the token is moved
 *
 * by Eadorin, edzillion
 */

import { IndicatorMode, MODULE_ID, registerSettings, renderSettingsConfigHandler, renderTokenConfigHandler } from "./scripts/settings.js";
import { renderSceneConfig, closeSceneConfig } from "./scripts/sceneConfig.js";

function drawAboutFaceIndicator(wrapped, ...args) {
	if (!canvas.scene.getFlag(MODULE_ID, "sceneEnabled")) {
		wrapped(...args);
		return;
	}
	//get the rotation of the token
	let dir = this.data.flags["about-face"]?.direction;
	if (dir === undefined || dir === null) {
		dir = 90;
		const flipOrRotate = game.settings.get(MODULE_ID, "flip-or-rotate");
		if (flipOrRotate !== "rotate") {
			const facingDirection = game.settings.get(MODULE_ID, "facing-direction");
			switch (facingDirection) {
				case "right":
					dir = 0;
					break;
				case "left":
					dir = 180;
					break;
				case "down":
					dir = 270;
					break;
			}
		}
	}
	const indicatorSize = [1, 1.5][game.settings.get(MODULE_ID, "sprite-type")];
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
		const scale = Math.max(this.data.width, this.data.height) * this.data.scale * indicatorSize;
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
		const scale = Math.max(this.data.width, this.data.height) * this.data.scale * indicatorSize;
		graphics.scale.set(scale, scale);
		//update the rotation of the arrow
		container.angle = dir;
	}
	const indicatorState = game.settings.get(MODULE_ID, "indicator-state");
	if (indicatorState == IndicatorMode.OFF || this.document.getFlag(MODULE_ID, "indicatorDisabled")) this.aboutFaceIndicator.graphics.visible = false;
	else if (indicatorState == IndicatorMode.HOVER) this.aboutFaceIndicator.graphics.visible = this._hover;
	else if (indicatorState == IndicatorMode.ALWAYS) this.aboutFaceIndicator.graphics.visible = true;
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

async function onCanvasReady() {
	if (canvas.scene.data?.flags?.[MODULE_ID] == undefined) {
		canvas.scene.setFlag(MODULE_ID, "sceneEnabled", true);
	}
}

Hooks.once("init", () => {
	libWrapper.register(MODULE_ID, "Token.prototype.refresh", drawAboutFaceIndicator);
	registerSettings();
});
Hooks.on("preUpdateToken", (token, updates) => {
	if (!canvas.scene.getFlag(MODULE_ID, "sceneEnabled")) return;
	const flipOrRotate = game.settings.get(MODULE_ID, "flip-or-rotate");
	const tokenFlipOrRotate = token.getFlag(MODULE_ID, "flipOrRotate");
	if (flipOrRotate == "rotate" && "rotation" in updates) {
		var dir = updates.rotation + 90;
		//store the direction in the token data
		if (!updates.flags) updates.flags = {};
		updates.flags[MODULE_ID] = { direction: dir };
	} else if ("x" in updates || "y" in updates) {
		//get previews and new positions
		const prevPos = { x: token.data.x, y: token.data.y };
		const newPos = { x: updates.x ?? token.data.x, y: updates.y ?? token.data.y };
		//get the direction in degrees of the movement
		let diffY = newPos.y - prevPos.y;
		let diffX = newPos.x - prevPos.x;
		dir = (Math.atan2(diffY, diffX) * 180) / Math.PI;
		//store the direction in the token data
		if (!updates.flags) updates.flags = {};
		updates.flags[MODULE_ID] = { direction: dir };
		if (flipOrRotate == "none") {
			updates.lockRotation = true;
			return;
		}
		if (flipOrRotate != "rotate" && tokenFlipOrRotate != "rotate") {
			if (flipOrRotate == "flip-h" || tokenFlipOrRotate == "flip-h") diffY = 0;
			else if (flipOrRotate == "flip-v" || tokenFlipOrRotate == "flip-v") diffX = 0;
			dir = (Math.atan2(diffY, diffX) * 180) / Math.PI;
			if (!(diffY || diffX)) return;
		}
	} else return;
	//update the rotation of the token
	updates.rotation = dir - 90;
});

// Hooks.on("createToken", AboutFace.createTokenHandler);
// Hooks.on("deleteToken", AboutFace.deleteTokenHandler);
Hooks.on("canvasReady", onCanvasReady);
Hooks.on("renderSceneConfig", (app, html) => {
	renderSceneConfig(app, html);
});
Hooks.on("closeSceneConfig", (app, html) => {
	closeSceneConfig(app, html);
});
// Hooks.on("updateToken", AboutFace.updateTokenHandler);
// Hooks.on("updateScene", AboutFace.updateSceneHandler);
Hooks.on("renderTokenConfig", renderTokenConfigHandler);
Hooks.on("renderSettingsConfig", renderSettingsConfigHandler);
