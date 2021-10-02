import { IndicatorMode, MODULE_ID } from "./settings.js";

function getDirection(token) {
	const facingDirection = token.getFlag(MODULE_ID, "facingDirection") || game.settings.get(MODULE_ID, "facing-direction");
	const directions = {
		right: 0,
		left: 180,
		down: 270,
		up: 90,
	};
	return directions[facingDirection];
}

function getFlipOrRotation(token) {
	const tokenFlipOrRotate = token.getFlag(MODULE_ID, "flipOrRotate") || "global";
	return tokenFlipOrRotate != "global" ? tokenFlipOrRotate : game.settings.get(MODULE_ID, "flip-or-rotate");
}

export function drawAboutFaceIndicator(wrapped, ...args) {
	if (!canvas.scene.getFlag(MODULE_ID, "sceneEnabled")) {
		wrapped(...args);
		return;
	}
	//get the rotation of the token
	let dir = this.data.flags["about-face"]?.direction;
	if (dir === undefined || dir === null) {
		dir = 90;
		const flipOrRotate = getFlipOrRotation(this);
		if (flipOrRotate !== "rotate") {
			dir = getDirection(this);
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

export async function onCanvasReady() {
	if (canvas.scene.data?.flags?.[MODULE_ID] == undefined) {
		canvas.scene.setFlag(MODULE_ID, "sceneEnabled", true);
	}
}

export function onPreCreateToken(document, data, options, userId) {
	if (canvas.scene.getFlag(MODULE_ID, "lockRotation")) {
		document.data.update({ lockRotation: true });
	}
}

export function onPreUpdateToken(token, updates) {
	if (!canvas.scene.getFlag(MODULE_ID, "sceneEnabled")) return;
	const flipOrRotate = getFlipOrRotation(token);
	if ("rotation" in updates) {
		var dir = updates.rotation + 90;
		//store the direction in the token data
		if (!updates.flags) updates.flags = {};
		updates.flags[MODULE_ID] = { direction: dir };
		if (flipOrRotate != "rotate") {
			if (flipOrRotate == "flip-h" && [180, 360].includes(dir)) {
				updates.mirrorX = !token.data.mirrorX;
			} else if (flipOrRotate == "flip-v" && [90, 270].includes(dir)) {
				updates.mirrorY = !token.data.mirrorY;
			}
			return;
		}
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
		if (flipOrRotate != "rotate") {
			if (flipOrRotate == "flip-h" && diffX != 0) {
				updates.mirrorX = !token.data.mirrorX;
			} else if (flipOrRotate == "flip-v" && diffY != 0) {
				updates.mirrorY = !token.data.mirrorY;
			}
			return;
		}
	} else return;
	//update the rotation of the token
	updates.rotation = dir - 90;
}
