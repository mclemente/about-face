![GitHub release](https://img.shields.io/github/release-date/mclemente/about-face)
![the latest version](https://img.shields.io/github/downloads/mclemente/about-face/latest/module.zip)

# About Face -- FoundryVTT Module

About Face is a module for FoundryVTT that changes a token's direction based on movement. It also provides optional "facing" indicators for tokens.

![Example](https://github.com/mclemente/about-face/raw/master/media/AboutFace-Demo.gif)

## Usage

Two options are available in the game settings module config. Otherwise, with everything enabled:

-   Move your token!
-   Hold SHIFT and using your W,A,S,D or &#8593;,&#8592;,&#8595;,&#8594; you can change the direction your token is facing without moving

### Disable for a specific Token

![Token Config Screenshot](https://raw.githubusercontent.com/mclemente/about-face/master/media/screenshot.PNG)

## Known Issues / Limitations

-   If a token is not facing down just edit the rotation in Token Config > Image.
-   Closing the Token Configuration will erase a token's indicator. This is due to Foundry redrawing the token whenever its configuration is changed.
-   If you are using Mirroring and Vision Angles, use the Lock Rotation setting for the vision to stick to the token's facing. This is due to Foundry drawing the token's vision based on its rotation, which isn't specifically changed when mirroring.

## Troubleshooting

#### How do I keep certain tokens from spinning?

-   There's the `Lock Rotation` setting (on the Module settings for a global-scope and on Scene settings for scene-scope).

## Credit

Eadorin & edzillion, for the original [About Face](https://github.com/League-of-Foundry-Developers/about-face).
Assistance from several Discord users, including @Forien and @Stan. Accepting translations for the few config options.
Assistance from theripper93 for the 3.0 update.

## License

This Foundry VTT module is a fork of [About Face](https://github.com/League-of-Foundry-Developers/about-face) and is licensed under [GNU GPLv3.0](https://www.gnu.org/licenses/gpl-3.0.en.html), supplemented by [Commons Clause](https://commonsclause.com/).

This work is licensed under Foundry Virtual Tabletop [EULA - Limited License Agreement for Module Development](https://foundryvtt.com/article/license/).
