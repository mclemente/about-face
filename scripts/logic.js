import { IndicatorMode, MODULE_ID } from "./settings.js";

let indicatorColor, indicatorDistance;
const IndicatorDirections = {
	up: -90,
	right: 0,
	down: 90,
	left: 180,
};
const TokenDirections = {
	down: 90,
	right: 360,
	up: 270,
	left: 180,
};
const directions = [
	[45, 90, 135, 180, 225, 270, 315, 360], //Square
	[0, 60, 120, 180, 240, 300, 360], //Hex Rows
	[30, 90, 150, 210, 270, 330, 390], //Hex Columns
];

export function drawAboutFaceIndicator(wrapped, ...args) {
	if (!canvas.scene.getFlag(MODULE_ID, "sceneEnabled")) {
		if (this.aboutFaceIndicator) this.aboutFaceIndicator.graphics.visible = false;
		wrapped(...args);
		return;
	}
	try {
		//get the rotation of the token
		let dir = this.data.flags[MODULE_ID]?.direction ?? getIndicatorDirection(this) ?? 90;
		//calc distance
		const r = (Math.max(this.w, this.h) / 2) * indicatorDistance;
		//calc scale
		const scale = Math.max(this.data.width, this.data.height) * this.data.scale * (game.settings.get(MODULE_ID, "sprite-type") || 1);
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
			graphics.x = r;
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
			graphics.x = r;
			graphics.scale.set(scale, scale);
			//update the rotation of the arrow
			container.angle = dir;
		}
		const indicatorState = game.settings.get(MODULE_ID, "indicator-state");
		if (indicatorState == IndicatorMode.OFF || this.document.getFlag(MODULE_ID, "indicatorDisabled")) this.aboutFaceIndicator.graphics.visible = false;
		else if (indicatorState == IndicatorMode.HOVER) this.aboutFaceIndicator.graphics.visible = this._hover;
		else if (indicatorState == IndicatorMode.ALWAYS) this.aboutFaceIndicator.graphics.visible = true;
	} catch (error) {
		console.error(error);
	}
	wrapped(...args);
}

function drawArrow(graphics) {
	const color = `0x${indicatorColor.substring(1, 7)}` || ``;
	graphics.beginFill(color, 0.5).lineStyle(2, color, 1).moveTo(0, 0).lineTo(0, -10).lineTo(10, 0).lineTo(0, 10).lineTo(0, 0).closePath().endFill();
}

export async function onCanvasReady() {
	if (canvas.scene.data?.flags?.[MODULE_ID] == undefined) {
		canvas.scene.setFlag(MODULE_ID, "sceneEnabled", true);
	}
}

export function onPreCreateToken(document, data, options, userId) {
	const updates = { flags: {} };
	const facingDirection = game.settings.get(MODULE_ID, "facing-direction");
	if (canvas.scene.getFlag(MODULE_ID, "lockRotation")) {
		updates.lockRotation = true;
	}
	if (facingDirection) {
		const flipMode = game.settings.get(MODULE_ID, "flip-or-rotate");
		const gridType = getGridType();
		if (gridType == 0 || (gridType == 1 && flipMode == "flip-h") || (gridType == 2 && flipMode == "flip-v")) {
			let angle = TokenDirections[facingDirection];
			updates.direction = angle;
			updates.flags[MODULE_ID] = { direction: angle };
		}
	}
	if (Object.keys(updates).length) document.data.update(updates);
}

export function onPreUpdateToken(tokenDocument, updates) {
	if (!canvas.scene.getFlag(MODULE_ID, "sceneEnabled")) return;
	const flipOrRotate = getFlipOrRotation(tokenDocument);
	if ("rotation" in updates) {
		var dir = updates.rotation + 90;
		//store the direction in the token data
		if (!updates.flags) updates.flags = {};
		updates.flags[MODULE_ID] = { direction: dir };
		if (flipOrRotate != "rotate") {
			const [mirrorKey, mirrorVal] = getMirror(tokenDocument, flipOrRotate, dir);
			if (mirrorKey) updates[mirrorKey] = mirrorVal;
			return;
		} else {
			updates.rotation = dir - 90;
			return;
		}
	} else if (("x" in updates || "y" in updates) && !canvas.scene.getFlag(MODULE_ID, "lockArrowRotation")) {
		//get previews and new positions
		const prevPos = { x: tokenDocument.data.x, y: tokenDocument.data.y };
		const newPos = { x: updates.x ?? tokenDocument.data.x, y: updates.y ?? tokenDocument.data.y };
		const tokenPrevPos = tokenDocument.getFlag(MODULE_ID, "prevPos");
		if (game.settings.get(MODULE_ID, "rememberTokenPrevPos") && tokenPrevPos && newPos.x == tokenPrevPos.x && newPos.y == tokenPrevPos.y) return;
		//get the direction in degrees of the movement
		let diffY = newPos.y - prevPos.y;
		let diffX = newPos.x - prevPos.x;
		dir = (Math.atan2(diffY, diffX) * 180) / Math.PI;
		if (canvas.grid.type && game.settings.get(MODULE_ID, "lockArrowToFace")) {
			const gridType = getGridType();
			const facings = directions[gridType];
			if (facings) {
				// convert negative dirs into a range from 0-360
				let normalizedDir = Math.round(dir < 0 ? 360 + dir : dir);
				// find the largest normalized angle
				let secondAngle = facings.find((e) => e > normalizedDir);
				// and assume the facing is 60 degrees (hexes) or 45 (square) to the counter clockwise
				dir = gridType ? secondAngle - 60 : secondAngle - 45;
				// unless the largest angle was closer
				if (secondAngle - normalizedDir < normalizedDir - dir) dir = secondAngle;
				// return to the range 180 to -180
				if (dir > 180) dir = dir - 360;
			}
		}
		//store the direction in the token data
		if (!updates.flags) updates.flags = {};
		updates.flags[MODULE_ID] = { direction: dir, prevPos: prevPos };
		if (flipOrRotate != "rotate") {
			const [mirrorKey, mirrorVal] = getMirror(tokenDocument, { x: diffX, y: diffY });
			if (mirrorKey) updates[mirrorKey] = mirrorVal;
			return;
		}
	} else return;
	//update the rotation of the token
	if (!tokenDocument.data.lockRotation || game.settings.get(MODULE_ID, "lockVisionToRotation")) updates.rotation = dir - 90;
}

/////////////
// HELPERS //
/////////////

function getDirection(token) {
	return token.document.getFlag(MODULE_ID, "facingDirection") || game.settings.get(MODULE_ID, "facing-direction");
}

function getGridType() {
	return Math.floor(canvas.grid.type / 2);
}

function getIndicatorDirection(token) {
	return IndicatorDirections[getDirection(token)];
}

function getTokenDirection(token) {
	return TokenDirections[getDirection(token)];
}

function getFlipOrRotation(tokenDocument) {
	const tokenFlipOrRotate = tokenDocument.getFlag(MODULE_ID, "flipOrRotate") || "global";
	return tokenFlipOrRotate != "global" ? tokenFlipOrRotate : game.settings.get(MODULE_ID, "flip-or-rotate");
}

function getMirror(tokenDocument, position) {
	const facingDirection = tokenDocument.getFlag(MODULE_ID, "facingDirection") || game.settings.get(MODULE_ID, "facing-direction");
	if (facingDirection === "right") {
		if (position.x < 0) return ["mirrorX", true];
		if (position.x > 0) return ["mirrorX", false];
	} else if (facingDirection === "left") {
		if (position.x < 0) return ["mirrorX", false];
		if (position.x > 0) return ["mirrorX", true];
	} else if (facingDirection === "up") {
		if (position.y < 0) return ["mirrorY", false];
		if (position.y > 0) return ["mirrorY", true];
	} else if (facingDirection === "down") {
		if (position.y < 0) return ["mirrorY", true];
		if (position.y > 0) return ["mirrorY", false];
	}
	return [];
}

export function updateArrowColor(color) {
	indicatorColor = color;
}

export function updateArrowDistance(distance) {
	indicatorDistance = distance;
}

export function updateSettings() {
	indicatorColor = game.settings.get(MODULE_ID, "arrowColor");
	indicatorDistance = game.settings.get(MODULE_ID, "arrowDistance");
}
