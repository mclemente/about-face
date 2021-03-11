# CHANGELOG


## [2.1.2]
- Remove debug circles.

## [2.1.1]
### BUGFIXES
- Fixed adding a new actor with default hex indicator crash

## [2.1.0]
### FEATURES
- Flipping Feature has been readded. Can flip horizontal / vertical. Works on hex scenes now too.
- Settings Overhaul. GM can set defaults on a per-scene basis and override on individual tokens.
- Token Facing. Can set default facing direction for sprite flipping for a scene & override on tokens.

### BUGFIXES
- Fixed tokenIndicators pool not being reset between scenes
- Fixed rotation not set on sprite creation bug

## [2.0.5]
### BUGFIXES
- Fixed compatibility bug with FXMaster https://github.com/eadorin/about-face/issues/59

## [2.0.4]
### FEATURES
- New Token Indicator style 'Hex' to visually indicate the front faces (green), the side faces (blue), and the back face (red) thanks to [Chris Normand](https://github.com/crnormand)!
- Updated compatible core version to 0.7.9

## [2.0.3]
### RELEASE 
- Per-token disable by checking 'Disable Direction Indicator' in Token config.
- Module settings are now on a per-client basis, each user can decide have their own config.
- Works on Hex scenes.
- Can disable module on a per-scene basis. 
- Dragging sets direction properly.
- Lots of minor bug fixes due to improved implementation.

## [2.0.2]
### FEATURES
- Separate 'Lock Rotation' and 'Disable Direction Indicator' settings in Token config.
- Updated compatible core version to 0.7.7

## [2.0.1]
### BUGFIXES 
- Patched user[0] can be null when generating color indicator
- Fixed updating disabled token bug.

## [2.0.0]
### MAJOR UPDATE
- Clients and GM now in sync.
- Can be disabled per scene (GM only)
- Can be disabled per token by toggling 'lock rotation' (GM only)
- Visiblity of indicator can be changed by all clients.

### TECHINCAL CHANGES
- Move stuff from preUpdate to update because token.indicator is not available in former. 
- Now updateTokenHandler deals with updates for all clients: GM sees changes, sets flags -> all clients act on those flags. 
- AboutFace.tokenIndicators holds all token indicators on the scene. disabled tokens not included. 
- Move other vars inside the AboutFace Class.
- TokenIndicator should deal with rotating the token too. 
- If we just watch for rotation changes in hooks we don't need to have our own keybindings.
- Change handler for settings is on the registersettings definition, no need for refresh settings.
- Lots of Refactoring. 
- Removed lots of redundant code. It is in the history if we need it again.
- We only need to save the token rotation in a flag as we can determine the change each round from comparing `updateData` to the Token data.
- Save the `sceneDisabled` flag on each scene.
- Hacky workaround to get that to appear in the main settings window: GM checks for changes of the `sceneDisabled` flag and then updates the game setting `rotation-enabled` to keep them in sync.

## [1.7.0]
### BUGFIXES 
- Fix ActorIsPC Deprecated bug #38
- Fix bug when token is created and not moved before update

## [1.6.10] 
### FEATURES
- Added logging module in `/scripts`, convert `console.log` to `log(LogLevel.INFO,...`
### BUGFIXES
- Fix ActorIsPC Deprecated

## [1.6.9] 
### RESTRUCTURE
- Added build tools from [Foundry Project Creator](https://gitlab.com/foundry-projects/foundry-pc/create-foundry-project)
- Remove redundant packages. 
- Restructure file folders for src and dist.

## [1.6.8] 
### BUGFIXES
- fix bug when token is created and not moved before update 
- (moved setFlag to createTokenHandler)

## [1.6.7] 2020-09-19
### BUGFIXES
- fixed reload direction, part 2
- fixed flip issue
- addressed a performance issue
- fixed issue where new token required refresh; thanks to @BlitzKraig

## [1.6.7] 2020-08-02
### BUGFIXES
- fixed problem where directions would reset on reload
- fixed mirror token issue


## [1.6.6] 2020-08-02
### BUGFIXES
- corrected some directional stuff
- fixed problem with token vision

### KNOWN ISSUES
- performance seems to be .. not great and needs optimized. =(

## [1.6.5] 2020-07-19
### ADDED
- Portugese Support! -- thanks to @HonzoNebro
- Castilian Support! -- thanks to @HonzoNebro
### BUGFIXES
- resolved issue with tokens jumping when using Horizontal flip
- fixed pesky bug causing a delay in updates


## [1.6.3] 2020-07-05
### BUGFIXES
- corrected issue attempting to hide non-registered sprites

## [1.0.6] 2020-07-04
### BUGFIXES
- corrected issue with indicator color at startup


## [1.0.6] 2020-06-21

### BUGFIXES
- corrected issue with actors not being associated with tokens


## [1.0.5] 2020-06-18

### ADDED
- Vertical and Horizontal flip token options (doesn't work with Indicators)
- Added larger indicator option
- Backend support for multiple graphics indicators

## [1.0.3] 2020-06-18

### BUGFIXES

## [1.0.2] 2020-06-18

### BUGFIXES

## [1.0.1] 2020-06-18

### ADDED
- Indicators to show facing direction
- Indicator Options
- Ability to change direction w/o moving using SHIFT.



## [1.0.0] 2020-06-13

### ADDED

- Initial Release
- Tokens rotate "facing" based on movement