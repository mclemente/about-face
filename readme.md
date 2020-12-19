# About Face -- FoundryVTT Module
About Face is a module for FoundryVTT that changes a token's direction based on movement. It also provides optional "facing" indicators for tokens.

![Example](https://github.com/League-of-Foundry-Developers/about-face/raw/master/AboutFace-Demo.gif)

## Installation
Simply use the install module screen within the FoundryVTT setup


## Usage
Two options are available in the game settings module config. Otherwise, with everything enabled:
- Move your token!
- Hold SHIFT and using your W,A,S,D or &#8593;,&#8592;,&#8595;,&#8594; you can change the direction your token is facing without moving

### Disable for a specific Token
![Token Config Screenshot](https://github.com/League-of-Foundry-Developers/about-face/raw/master/screenshot.png)


## Known Issues / Limitations
- ~~Assumes the token default facing direction is "down". Other artwork may respond differently.~~
- If a token is not facing down just edit the rotation in Token Config > Image.
- ~~This has only been tested with square grids (not hexes) and uses 45 degree snapping for tokens.~~
- ~~Tokens don't change directions immediately (takes a movement for updateToken to start firing)~~
- ~~Have experienced an issue where locking a token makes it unusable until refresh~~
- ~~Direction indicators are created using the other players' colors. Because of the way drawing works, players will need to refresh after connecting in order to see all the colors *BUG~~
- ~~Unsure if 'facing' state carries from one session to another.~~
- ~~May need to refresh if redrawing the scene or moving tokens to a new scene. *should be fixed~~

## Troubleshooting
- Refresh Foundry VTT webpage

#### How do I keep certain tokens from spinning?
- You can lock tokens by either double-clicking and selecting the token icon from the hud or accessing from the character sheet. The option you're looking for is "Lock Rotation" under the "Position" tab.


## Upcoming Features
- ~~Support for tokens whose art faces a different direction by default~~
- Different / Configurable indicators
- Dynamic color-adjusting indicators based on the scene/tile


## Credit
Assistance from several Discord users, including @Forien and @Stan. Accepting translations for the few config options.

## License
This Foundry VTT module, writen by Eadorin & edzillion, is licensed under [GNU GPLv3.0](https://www.gnu.org/licenses/gpl-3.0.en.html), supplemented by [Commons Clause](https://commonsclause.com/).

This work is licensed under Foundry Virtual Tabletop [EULA - Limited License Agreement for module development v 0.1.6](http://foundryvtt.com/pages/license.html).
