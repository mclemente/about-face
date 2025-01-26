import { IndicatorMode, MODULE_ID } from "./settings.js";

export class AboutFace {
	constructor() {
		this.indicatorColor = game.settings.get(MODULE_ID, "arrowColor");
		this.indicatorDistance = game.settings.get(MODULE_ID, "arrowDistance");
		this.hideIndicatorOnDead = game.settings.get("about-face", "hideIndicatorOnDead");
		this.indicatorDrawingType = game.settings.get("about-face", "indicatorDrawingType");
		this.indicatorSize = game.settings.get("about-face", "sprite-type");
		this._tokenRotation = false;
		if (game.settings.get("about-face", "disableAnimations")) this._prepareAnimation();
	}

	get tokenRotation() {
		return this._tokenRotation;
	}

	set tokenRotation(value) {
		this._tokenRotation = value;
	}

	_prepareAnimation(value = true) {
		if (value) {
			libWrapper.register(
				MODULE_ID,
				"CONFIG.Token.objectClass.prototype._getAnimationDuration",
				(from, to, { movementSpeed = 6 } = {}) => {
					let duration = 0;
					const dx = from.x - (to.x ?? from.x);
					const dy = from.y - (to.y ?? from.y);
					if (dx || dy) duration = Math.max(
						duration,
						(Math.hypot(dx, dy) / canvas.dimensions.size / movementSpeed) * 1000
					);
					const dr = ((Math.abs(from.rotation - (to.rotation ?? from.rotation)) + 180) % 360) - 180;
					if (dr && !(dx || dy)) duration = Math.max(duration, (Math.abs(dr) / (movementSpeed * 60)) * 1000);
					if (!duration) duration = 1000; // The default animation duration is 1 second
					return duration;
				},
				"OVERRIDE"
			);
			libWrapper.register(
				MODULE_ID,
				"CONFIG.Token.objectClass.prototype._prepareAnimation",
				(wrapped, from, changes, context, options = {}) => {
					if ("x" in changes || "y" in changes) {
						if ("rotation" in changes) delete changes.rotation;
						if (changes.texture?.scaleX) delete changes.texture.scaleX;
						if (changes.texture?.scaleY) delete changes.texture.scaleY;
					}
					return wrapped(from, changes, context, options);
				},
				"WRAPPER"
			);
		} else {
			libWrapper.unregister(MODULE_ID, "CONFIG.Token.objectClass.prototype._getAnimationDuration");
			libWrapper.unregister(MODULE_ID, "CONFIG.Token.objectClass.prototype._prepareAnimation");
		}
	}

	drawAboutFaceIndicator(token) {
		if (!canvas.scene.getFlag(MODULE_ID, "sceneEnabled")) {
			if (token.aboutFaceIndicator) token.aboutFaceIndicator.graphics.visible = false;
			return;
		}
		const deadIcon = CONFIG.statusEffects.find((x) => x.id === "dead")?.icon;
		const isDead = token.actor?.effects.some((el) => el.statuses.has("dead") || el.img === deadIcon);
		if (this.hideIndicatorOnDead && isDead) {
			if (token.aboutFaceIndicator && !token.aboutFaceIndicator?._destroyed) {
				token.aboutFaceIndicator.graphics.visible = false;
			}
			return;
		}
		try {
			// get the rotation of the token
			let tokenDirection = token.document.flags[MODULE_ID]?.direction
				?? getIndicatorDirection(token.document) ?? 90;

			// Calculate indicator's distance
			const indicatorDistance = this.indicatorDistance;
			const maxTokenSize = Math.max(token.w, token.h);
			const distance = (maxTokenSize / 2) * indicatorDistance;

			// Calculate indicator's scale
			const tokenSize = Math.max(token.document.width, token.document.height);
			const tokenScale = Math.abs(token.document.texture.scaleX) + Math.abs(token.document.texture.scaleY);
			const indicatorSize = this.indicatorSize || 1;
			const scale = ((tokenSize * tokenScale) / 2) * indicatorSize;

			// Create or update the about face indicator
			// updateAboutFaceIndicator(token, tokenDirection, distance, scale);
			if (!token.aboutFaceIndicator || token.aboutFaceIndicator._destroyed) {
				const { w: width, h: height } = token;
				const container = new PIXI.Container({ name: "aboutFaceIndicator", width, height });
				container.name = "aboutFaceIndicator";
				container.width = width;
				container.height = height;
				container.x = width / 2;
				container.y = height / 2;
				const graphics = new PIXI.Graphics();
				// draw an arrow indicator
				// drawArrow(graphics);
				const color = `0x${this.indicatorColor.substring(1, 7)}` || "";
				graphics.beginFill(color, 0.5).lineStyle(2, color, 1).moveTo(0, 0);
				if (this.indicatorDrawingType === 0) {
					graphics.lineTo(0, -10).lineTo(10, 0).lineTo(0, 10).lineTo(0, 0).closePath().endFill();
				} else if (this.indicatorDrawingType === 1) {
					graphics.lineTo(-10, -20).lineTo(0, 0).lineTo(-10, 20).lineTo(0, 0).closePath().endFill();
				}
				// place the arrow in the correct position
				container.angle = tokenDirection;
				graphics.x = distance;
				graphics.scale.set(scale, scale);
				// add the graphics to the container
				container.addChild(graphics);
				container.graphics = graphics;
				token.aboutFaceIndicator = container;
				// add the container to the token
				token.addChild(container);
			} else {
				let container = token.aboutFaceIndicator;
				let graphics = container.graphics;
				graphics.x = distance;
				graphics.scale.set(scale, scale);
				// update the rotation of the arrow
				container.angle = tokenDirection;
			}

			// Set the visibility of the indicator based on the current indicator mode
			const indicatorState = token?.actor?.hasPlayerOwner
				? game.settings.get(MODULE_ID, "indicator-state-pc")
				: game.settings.get(MODULE_ID, "indicator-state");
			const indicatorDisabled = token.document.getFlag(MODULE_ID, "indicatorDisabled");

			if (indicatorState === IndicatorMode.OFF || indicatorDisabled) {
				token.aboutFaceIndicator.graphics.visible = false;
			} else if (indicatorState === IndicatorMode.HOVER) token.aboutFaceIndicator.graphics.visible = token.hover;
			else if (indicatorState === IndicatorMode.ALWAYS) token.aboutFaceIndicator.graphics.visible = true;
		} catch(error) {
			console.error(
				`About Face | Error drawing the indicator for token ${token.name} (ID: ${token.id}, Type: ${
					token.document?.actor?.type ?? null
				})`,
				error
			);
		}
	}
}

// HOOKS

export function onPreCreateToken(tokenDocument, data, options, userId) {
	const updates = { flags: { [MODULE_ID]: {} } };
	const facingDirection =
		tokenDocument.flags?.[MODULE_ID]?.facingDirection ?? game.settings.get(MODULE_ID, "facing-direction");
	if (canvas.scene.getFlag(MODULE_ID, "lockRotation")) {
		updates.lockRotation = true;
	}
	if (facingDirection) {
		const flipMode = game.settings.get(MODULE_ID, "flip-or-rotate");
		const gridType = getGridType();
		if (gridType === 0 || (gridType === 1 && flipMode === "flip-h") || (gridType === 2 && flipMode === "flip-v")) {
			const TokenDirections = {
				down: 90,
				right: 360,
				up: 270,
				left: 180,
			};
			if (tokenDocument.flags?.[MODULE_ID]?.direction === undefined) {
				updates.flags[MODULE_ID].direction = TokenDirections[facingDirection];
			}
		}
	}
	if (Object.keys(updates).length) tokenDocument.updateSource(updates);
}

export function onPreUpdateToken(tokenDocument, updates, options, userId) {
	if (!canvas.scene.getFlag(MODULE_ID, "sceneEnabled")) {
		return;
	}

	if (
		game.modules.get("multilevel-tokens")?.active
		&& !game.multilevel._isReplicatedToken(tokenDocument)
		&& options?.mlt_bypass
	) {
		return;
	}

	if (
		tokenDocument.x === updates.x
		&& tokenDocument.y === updates.y
		&& (
			!("rotation" in updates)
			|| tokenDocument.rotation === updates.rotation
		)
	) {
		return;
	}

	let position = {};
	// store the direction in the token data

	let tokenDirection;
	const { x, y, rotation } = updates;
	const { x: tokenX, y: tokenY } = tokenDocument;

	if (rotation !== undefined) {
		tokenDirection = rotation + 90;
		foundry.utils.setProperty(updates, `flags.${MODULE_ID}.direction`, tokenDirection);
		if (!options.animation) {
			options.animation = { duration: 1000 / 6 };
		} else {
			options.animation.duration = 1000 / 6;
		}
	} else if (
		!game.aboutFace.tokenRotation
		&& (Number.isNumeric(x) || Number.isNumeric(y))
		&& !canvas.scene.getFlag(MODULE_ID, "lockArrowRotation")
	) {
		// get previous and new positions
		const prevPos = { x: tokenX, y: tokenY };
		const newPos = { x: x ?? tokenX, y: y ?? tokenY };
		// get the direction in degrees of the movement
		let diffY = newPos.y - prevPos.y;
		let diffX = newPos.x - prevPos.x;
		tokenDirection = (Math.atan2(diffY, diffX) * 180) / Math.PI;

		if (canvas.grid.type && game.settings.get(MODULE_ID, "lockArrowToFace")) {
			const directions = [
				[45, 90, 135, 180, 225, 270, 315, 360], // Square
				[0, 60, 120, 180, 240, 300, 360], // Hex Rows
				[30, 90, 150, 210, 270, 330, 390], // Hex Columns
			];
			const gridType = getGridType();
			const facings = directions[gridType];
			if (facings && facings.length) {
				// convert negative dirs into a range from 0-360
				let normalizedDir = ((tokenDirection % 360) + 360) % 360; // Math.round(tokenDirection < 0 ? 360 + tokenDirection : tokenDirection);
				// find the largest normalized angle
				let secondAngle = facings.reduceRight(
					(prev, curr) => (curr < prev && curr > normalizedDir ? curr : prev)
				); // facings.find((e) => e > normalizedDir);
				// and assume the facing is 60 degrees (hexes) or 45 (square) to the counter clockwise
				tokenDirection = gridType ? secondAngle - 60 : secondAngle - 45;
				// unless the largest angle was closer
				if (secondAngle - normalizedDir < normalizedDir - tokenDirection) tokenDirection = secondAngle;
				// return tokenDirection to the range 180 to -180
				if (tokenDirection > 180) tokenDirection -= 360;
			}
		}
		foundry.utils.setProperty(updates, `flags.${MODULE_ID}.direction`, tokenDirection);
		foundry.utils.setProperty(updates, `flags.${MODULE_ID}.prevPos`, prevPos);
		position = { x: diffX, y: diffY };
	}

	const { texture, lockRotation, flags, sight } = tokenDocument;
	const flipOrRotate = getTokenFlipOrRotate(tokenDocument);

	if (flipOrRotate !== "rotate") {
		const [mirrorKey, mirrorVal] = getMirror(tokenDocument, position);
		if ((texture[mirrorKey] < 0 && !mirrorVal) || (texture[mirrorKey] > 0 && mirrorVal)) {
			const source = tokenDocument.toObject();
			updates[`texture.${mirrorKey}`] = source.texture[mirrorKey] * -1;
		}
	}

	// update the rotation of the token
	if (tokenDirection === undefined) return;

	// Determine if a rotation update is needed
	const hasRotationUpdate = "rotation" in updates;
	const isRotationAction = flipOrRotate === "rotate";
	const isRotationLocked = lockRotation && game.settings.get(MODULE_ID, "lockVisionToRotation");

	// Check conditions for rotation and sight angle updates
	const shouldUpdateRotation = hasRotationUpdate || isRotationAction !== isRotationLocked;
	const hasSightAngle = sight.enabled && sight.angle !== 360;
	const shouldUpdateSightAngle = !isRotationLocked && hasSightAngle;

	// If any update is needed, calculate the rotation offset and update the rotation
	if (shouldUpdateRotation || shouldUpdateSightAngle) {
		const rotationOffset = flags[MODULE_ID]?.rotationOffset ?? 0;
		updates.rotation = tokenDirection - 90 + rotationOffset;
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
	const direction =
		tokenDocument.getFlag(MODULE_ID, "facingDirection") || game.settings.get(MODULE_ID, "facing-direction");
	return IndicatorDirections[direction];
}

function getTokenFlipOrRotate(tokenDocument) {
	const tokenFlipOrRotate = tokenDocument.getFlag(MODULE_ID, "flipOrRotate") || "global";
	return tokenFlipOrRotate !== "global" ? tokenFlipOrRotate : game.settings.get(MODULE_ID, "flip-or-rotate");
}

/**
 *
 * @param {TokenDocument} tokenDocument
 * @param {Object} position
 * @returns {Array}
 */
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
	const { x, y } = position;
	const tokenFacingDirection = tokenDocument.getFlag(MODULE_ID, "facingDirection") || "global";
	const facingDirection =
		tokenFacingDirection === "global" ? game.settings.get(MODULE_ID, "facing-direction") : tokenFacingDirection;
	const mirrorX = "scaleX";
	const mirrorY = "scaleY";
	if (facingDirection === "right") {
		if (x < 0) return [mirrorX, true];
		if (x > 0) return [mirrorX, false];
	} else if (facingDirection === "left") {
		if (x < 0) return [mirrorX, false];
		if (x > 0) return [mirrorX, true];
	} else if (facingDirection === "up") {
		if (y < 0) return [mirrorY, false];
		if (y > 0) return [mirrorY, true];
	} else if (facingDirection === "down") {
		if (y < 0) return [mirrorY, true];
		if (y > 0) return [mirrorY, false];
	}
	return [];
}
