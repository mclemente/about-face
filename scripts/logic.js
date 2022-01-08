import { IndicatorMode, MODULE_ID } from "./settings.js";
import flipAngles from "./flipAngles.js";

let indicatorColor, indicatorDistance;

const IndicatorDirections = {
	up: -90,
	right: 0,
	down: 90,
	left: 180,
};
const TokenDirections = {
	down: 0,
	right: 90,
	up: 180,
	left: 270,
};
const SquareFacings = [ 45, 90, 135, 180, 225, 270, 315, 360]
const HexRowFacings = [ 0, 60, 120, 180, 240, 300, 360 ]
const HexColumnFacings = [ 30, 90, 150, 210, 270, 330, 390 ]

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
		// updates.direction = TokenDirections[facingDirection];
		// updates.flags[MODULE_ID] = { direction: TokenDirections[facingDirection] };
	}
	if (Object.keys(updates).length) document.data.update(updates);
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
			const [mirrorKey, mirrorVal] = getMirror(token, flipOrRotate, dir);
			if (mirrorKey) updates[mirrorKey] = mirrorVal;
			return;
		}
	} else if (("x" in updates || "y" in updates) && !game.settings.get(MODULE_ID, "lockArrowRotation")) {
		//get previews and new positions
		const prevPos = { x: token.data.x, y: token.data.y };
		const newPos = { x: updates.x ?? token.data.x, y: updates.y ?? token.data.y };
		//get the direction in degrees of the movement
		let diffY = newPos.y - prevPos.y;
		let diffX = newPos.x - prevPos.x;
		dir = (Math.atan2(diffY, diffX) * 180) / Math.PI;
    if (game.settings.get(MODULE_ID, "lockArrowToFace")) { 
      let gridType = token.parent?.data?.gridType ?? 0  // The only way I could figure out the scene's gridType
      if (gridType > 0) {
        let facings = SquareFacings
        let width = 60  // degree width of a facing
        if (gridType == 1) width = 45
        if (gridType == 2 || gridType == 3) facings = HexRowFacings
        if (gridType == 4 || gridType == 5) facings = HexColumnFacings
        let normalizedDir = Math.round((dir < 0) ? 360 + dir : dir)  // convert negative dirs into a range from 0-360
        let secondAngle = facings.find(e => e > normalizedDir)  // find the largest normalized angle
        dir = secondAngle - width  // and assume the facing is 60 degrees to the counter clockwise
        if ((secondAngle - normalizedDir) < (normalizedDir - dir)) dir = secondAngle  // unless the largest angle was closer
        if (dir > 180) dir = dir - 360  // return to the range 180 to -180
      }
    }
		//store the direction in the token data
		if (!updates.flags) updates.flags = {};
		updates.flags[MODULE_ID] = { direction: dir };
		if (flipOrRotate != "rotate") {
			const [mirrorKey, mirrorVal] = getMirror(token, flipOrRotate, dir + 90);
			if (mirrorKey) updates[mirrorKey] = mirrorVal;
			return;
		}
	} else return;
	//update the rotation of the token
	updates.rotation = dir - 90;
}

/////////////
// HELPERS //
/////////////

function getDirection(token) {
	return token.document.getFlag(MODULE_ID, "facingDirection") || game.settings.get(MODULE_ID, "facing-direction");
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

function getMirror(tokenDocument, flipOrRotate, dir) {
	if (dir == null) dir = tokenDocument.getFlag(MODULE_ID, "direction") || 0;
	const facingDirection = tokenDocument.getFlag(MODULE_ID, "facingDirection") || game.settings.get(MODULE_ID, "facing-direction");
	try {
		var angles = flipAngles[canvas.grid.type][flipOrRotate][facingDirection];
	} catch (error) {
		console.error(`About Face: failed to mirror token "${tokenDocument.name}" (ID: ${tokenDocument.id}).
			tokenDocument.flags.about-face.facingDirection: ${tokenDocument.getFlag(MODULE_ID, "facingDirection")}
			canvas.grid.type: ${canvas.grid.type}
			flipOrRotate: ${flipOrRotate}
			facingDirection: ${facingDirection}
			angles: ${JSON.stringify(angles)}
			${error}`);
	} finally {
		if (angles && angles[dir] != null) {
			const update = {
				[angles.mirror]: angles[dir],
			};
			return [angles.mirror, angles[dir]];
		}
		return [];
	}
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


