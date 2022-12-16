import { IndicatorMode, MODULE_ID } from "./settings.js";
import { libWrapper } from "./shim.js";

let _tokenRotation = false;

export class AboutFace {
	constructor() {
		this.disableAnimations = game.settings.get(MODULE_ID, "disableAnimations");
		this.indicatorColor = game.settings.get(MODULE_ID, "arrowColor");
		this.indicatorDistance = game.settings.get(MODULE_ID, "arrowDistance");
		if (this.disableAnimations) this.toggleAnimateFrame(this.disableAnimations);
	}

	get toggleTokenRotation() {
		return _tokenRotation;
	}
	set toggleTokenRotation(value) {
		_tokenRotation = value;
	}

	toggleAnimateFrame(value) {
		if (value) libWrapper.register(MODULE_ID, "CanvasAnimation._animateFrame", _animateFrame, "OVERRIDE");
		else libWrapper.unregister(MODULE_ID, "CanvasAnimation._animateFrame");
	}
}

// HOOKS

export function onPreCreateToken(document, data, options, userId) {
	const updates = { flags: { [MODULE_ID]: {} } };
	const facingDirection = document.flags?.[MODULE_ID]?.facingDirection ?? game.settings.get(MODULE_ID, "facing-direction");
	if (canvas.scene.getFlag(MODULE_ID, "lockRotation")) {
		updates.lockRotation = true;
	}
	if (document.rotation && document.flags?.[MODULE_ID]?.rotationOffset === undefined) {
		updates.flags[MODULE_ID].rotationOffset = document.rotation;
	}
	if (facingDirection) {
		const flipMode = game.settings.get(MODULE_ID, "flip-or-rotate");
		const gridType = getGridType();
		if (gridType == 0 || (gridType == 1 && flipMode == "flip-h") || (gridType == 2 && flipMode == "flip-v")) {
			const TokenDirections = {
				down: 90,
				right: 360,
				up: 270,
				left: 180,
			};
			if (document.flags?.[MODULE_ID]?.direction === undefined) {
				updates.flags[MODULE_ID].direction = TokenDirections[facingDirection];
			}
		}
	}
	if (Object.keys(updates).length) document.updateSource(updates);
}

export function onPreUpdateToken(tokenDocument, updates, options, userId) {
	if (!canvas.scene.getFlag(MODULE_ID, "sceneEnabled") || options?.mlt_bypass) return;

	const durations = [];
	let position = {};
	// store the direction in the token data
	if (!updates.flags) updates.flags = {};
	if ("rotation" in updates) {
		var dir = updates.rotation + 90;
		updates.flags[MODULE_ID] = { direction: dir };
		durations.push(1000 / 6);
	} else if (!game.aboutFace.toggleTokenRotation && ("x" in updates || "y" in updates) && !canvas.scene.getFlag(MODULE_ID, "lockArrowRotation")) {
		//get previous and new positions
		const prevPos = { x: tokenDocument.x, y: tokenDocument.y };
		const newPos = { x: updates.x ?? tokenDocument.x, y: updates.y ?? tokenDocument.y };
		//get the direction in degrees of the movement
		let diffY = newPos.y - prevPos.y;
		let diffX = newPos.x - prevPos.x;
		if (diffX || diffY) durations.push((Math.hypot(diffX, diffY) * 1000) / (canvas.dimensions.size * 6));
		dir = (Math.atan2(diffY, diffX) * 180) / Math.PI;
		if (canvas.grid.type && game.settings.get(MODULE_ID, "lockArrowToFace")) {
			const directions = [
				[45, 90, 135, 180, 225, 270, 315, 360], //Square
				[0, 60, 120, 180, 240, 300, 360], //Hex Rows
				[30, 90, 150, 210, 270, 330, 390], //Hex Columns
			];
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
		updates.flags[MODULE_ID] = { direction: dir, prevPos: prevPos };
		position = { x: diffX, y: diffY };
	}

	const flipOrRotate = getFlipOrRotation(tokenDocument);
	if (flipOrRotate != "rotate") {
		const [mirrorKey, mirrorVal] = getMirror(tokenDocument, position);
		if ((tokenDocument.texture[mirrorKey] < 0 && !mirrorVal) || (tokenDocument.texture[mirrorKey] > 0 && mirrorVal)) {
			const source = tokenDocument.toObject();
			updates[`texture.${mirrorKey}`] = source.texture[mirrorKey] * -1;
		}
	}
	// update the rotation of the token
	else if (dir !== undefined && ("rotation" in updates || !(tokenDocument.lockRotation && game.settings.get(MODULE_ID, "lockVisionToRotation")))) {
		updates.rotation = dir - 90 + (tokenDocument.flags[MODULE_ID]?.rotationOffset ?? 0);
	}
	if (durations.length) {
		if (!options.animation) options.animation = { duration: Math.max(...durations) };
		else options.animation.duration = Math.max(...durations);
	}
}

export function drawAboutFaceIndicator(token) {
	if (!canvas.scene.getFlag(MODULE_ID, "sceneEnabled")) {
		if (token.aboutFaceIndicator) token.aboutFaceIndicator.graphics.visible = false;
	} else {
		try {
			//get the rotation of the token
			let dir = token.document.flags[MODULE_ID]?.direction ?? getIndicatorDirection(token.document) ?? 90;
			//calc distance
			const r = (Math.max(token.w, token.h) / 2) * game.aboutFace.indicatorDistance;
			//calc scale
			const scale =
				((Math.max(token.document.width, token.document.height) * (Math.abs(token.document.texture.scaleX) + Math.abs(token.document.texture.scaleY))) / 2) *
				(game.settings.get(MODULE_ID, "sprite-type") || 1);
			if (!token.aboutFaceIndicator || token.aboutFaceIndicator._destroyed) {
				const container = new PIXI.Container();
				container.name = "aboutFaceIndicator";
				container.width = token.w;
				container.height = token.h;
				container.x = token.w / 2;
				container.y = token.h / 2;
				const graphics = new PIXI.Graphics();
				//draw an arrow indicator
				// drawArrow(graphics);
				const color = `0x${game.aboutFace.indicatorColor.substring(1, 7)}` || ``;
				graphics.beginFill(color, 0.5).lineStyle(2, color, 1).moveTo(0, 0).lineTo(0, -10).lineTo(10, 0).lineTo(0, 10).lineTo(0, 0).closePath().endFill();
				//place the arrow in the correct position
				container.angle = dir;
				graphics.x = r;
				graphics.scale.set(scale, scale);
				//add the graphics to the container
				container.addChild(graphics);
				container.graphics = graphics;
				token.aboutFaceIndicator = container;
				//add the container to the token
				token.addChild(container);
			} else {
				let container = token.aboutFaceIndicator;
				let graphics = container.graphics;
				graphics.x = r;
				graphics.scale.set(scale, scale);
				//update the rotation of the arrow
				container.angle = dir;
			}
			const indicatorState = token?.actor?.hasPlayerOwner ? game.settings.get(MODULE_ID, "indicator-state-pc") : game.settings.get(MODULE_ID, "indicator-state");
			if (indicatorState == IndicatorMode.OFF || token.document.getFlag(MODULE_ID, "indicatorDisabled")) token.aboutFaceIndicator.graphics.visible = false;
			else if (indicatorState == IndicatorMode.HOVER) token.aboutFaceIndicator.graphics.visible = token.hover;
			else if (indicatorState == IndicatorMode.ALWAYS) token.aboutFaceIndicator.graphics.visible = true;
		} catch (error) {
			console.error(`About Face | Error drawing the indicator for token ${token.name} (ID: ${token.id}, Type: ${token.document?.actor?.type ?? null})`, error);
		}
	}
}

// HELPERS

function getGridType() {
	return Math.floor(canvas.grid.type / 2);
}

function getIndicatorDirection(tokenDocument) {
	const IndicatorDirections = {
		up: -90,
		right: 0,
		down: 90,
		left: 180,
	};
	const direction = tokenDocument.getFlag(MODULE_ID, "facingDirection") || game.settings.get(MODULE_ID, "facing-direction");
	return IndicatorDirections[direction];
}

function getFlipOrRotation(tokenDocument) {
	const tokenFlipOrRotate = tokenDocument.getFlag(MODULE_ID, "flipOrRotate") || "global";
	return tokenFlipOrRotate != "global" ? tokenFlipOrRotate : game.settings.get(MODULE_ID, "flip-or-rotate");
}

function getMirror(tokenDocument, position = {}) {
	if (!Object.keys(position).length) {
		// Taken from ClientKeybindings._handleMovement
		// Define movement offsets and get moved directions
		const directions = game.keybindings.moveKeys;
		let dx = 0;
		let dy = 0;

		// Assign movement offsets
		if (directions.has(ClientKeybindings.MOVEMENT_DIRECTIONS.LEFT)) dx -= 1;
		else if (directions.has(ClientKeybindings.MOVEMENT_DIRECTIONS.RIGHT)) dx += 1;
		if (directions.has(ClientKeybindings.MOVEMENT_DIRECTIONS.UP)) dy -= 1;
		else if (directions.has(ClientKeybindings.MOVEMENT_DIRECTIONS.DOWN)) dy += 1;

		position = { x: dx, y: dy };
	}
	const tokenFacingDirection = tokenDocument.getFlag(MODULE_ID, "facingDirection") || "global";
	const facingDirection = tokenFacingDirection == "global" ? game.settings.get(MODULE_ID, "facing-direction") : tokenFacingDirection;
	const mirrorX = "scaleX";
	const mirrorY = "scaleY";
	if (facingDirection === "right") {
		if (position.x < 0) return [mirrorX, true];
		if (position.x > 0) return [mirrorX, false];
	} else if (facingDirection === "left") {
		if (position.x < 0) return [mirrorX, false];
		if (position.x > 0) return [mirrorX, true];
	} else if (facingDirection === "up") {
		if (position.y < 0) return [mirrorY, false];
		if (position.y > 0) return [mirrorY, true];
	} else if (facingDirection === "down") {
		if (position.y < 0) return [mirrorY, true];
		if (position.y > 0) return [mirrorY, false];
	}
	return [];
}

// WRAPPERS
function _animateFrame(deltaTime, animation) {
	const { attributes, duration, ontick } = animation;

	// Compute animation timing and progress
	const dt = this.ticker.elapsedMS; // Delta time in MS
	animation.time += dt; // Total time which has elapsed
	const pt = animation.time / duration; // Proportion of total duration
	const complete = animation.time >= duration;
	const pa = complete ? 1 : animation.easing ? animation.easing(pt) : pt;

	// Update each attribute
	try {
		for (let a of attributes) {
			// Snap to final target
			if (complete) {
				a.parent[a.attribute] = a.to;
				a.done = a.delta;
			}

			// Continue animating
			else {
				const da =
					a.delta *
					((a.attribute == "rotation" && [2, 3].includes(game.aboutFace.disableAnimations)) ||
					((a.attribute == "scaleX" || a.attribute == "scaleY") && [1, 3].includes(game.aboutFace.disableAnimations))
						? 1
						: pa);
				a.parent[a.attribute] = a.from + da;
				a.done = da;
			}
		}

		// Callback function
		if (ontick) ontick(dt, animation);
	} catch (err) {
		// Terminate the animation if any errors occur
		animation.reject(err);
	}

	// Resolve the original promise once the animation is complete
	if (complete) animation.resolve(true);
}
